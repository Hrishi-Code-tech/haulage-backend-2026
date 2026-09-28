"""
Dispatch email parser engine.
Provides a local SLM extractor (Ollama) with a deterministic fallback extractor,
guaranteeing strict Pydantic validation on all outputs.
"""
import re
import json
import logging
from abc import ABC, abstractmethod
import httpx

from config import settings
from ingestion.schemas import DispatchLoad, EquipmentType

logger = logging.getLogger("ingestion.parser")


class BaseExtractor(ABC):
    @abstractmethod
    def extract(self, text: str) -> DispatchLoad:
        """Extract structured dispatch information from raw email text."""
        pass


class DeterministicFallbackExtractor(BaseExtractor):
    """
    High-precision deterministic extractor using regex heuristics.
    Used for instant, zero-latency, deterministic extraction and as a safe fallback.
    """

    EQUIPMENT_KEYWORDS = {
        "reefer": EquipmentType.REEFER.value,
        "refrigerated": EquipmentType.REEFER.value,
        "cold": EquipmentType.REEFER.value,
        "flatbed": EquipmentType.FLATBED.value,
        "flat bed": EquipmentType.FLATBED.value,
        "dry van": EquipmentType.DRY_VAN.value,
        "dryvan": EquipmentType.DRY_VAN.value,
        "van": EquipmentType.DRY_VAN.value,
        "tanker": EquipmentType.TANKER.value,
        "tank": EquipmentType.TANKER.value,
        "step deck": EquipmentType.STEP_DECK.value,
        "stepdeck": EquipmentType.STEP_DECK.value,
        "lowboy": EquipmentType.LOWBOY.value,
        "box truck": EquipmentType.BOX_TRUCK.value,
        "container": EquipmentType.CONTAINER.value,
    }

    CURRENCY_SYMBOLS = {
        "₹": "INR",
        "inr": "INR",
        "rs": "INR",
        "rs.": "INR",
        "€": "EUR",
        "eur": "EUR",
        "$": "USD",
        "usd": "USD",
        "£": "GBP",
        "gbp": "GBP",
    }

    def extract(self, text: str) -> DispatchLoad:
        clean_text = text.strip()
        lines = [line.strip() for line in clean_text.splitlines() if line.strip()]

        origin, destination = self._extract_route(clean_text, lines)
        rate, currency = self._extract_rate_and_currency(clean_text)
        equipment = self._extract_equipment(clean_text)
        weight_kg = self._extract_weight(clean_text)

        if not origin or not destination:
            raise ValueError(
                f"Could not extract valid origin and destination from email: '{clean_text[:100]}...'"
            )
        if rate is None or rate <= 0:
            raise ValueError(
                f"Could not extract a valid freight rate from email: '{clean_text[:100]}...'"
            )

        return DispatchLoad(
            origin=origin,
            destination=destination,
            rate=rate,
            equipment_type=equipment,
            weight_kg=weight_kg,
            currency=currency,
            confidence=0.92,
            extracted_by="deterministic_fallback",
        )

    def _extract_route(self, text: str, lines: list[str]) -> tuple[str | None, str | None]:
        # Pattern 1: "from <Origin> to <Destination>"
        m = re.search(
            r"(?:from|pickup(?:\s+from|\s+at)?|origin)\s*[:=]?\s*([A-Za-z\s,\.-]+?)\s+(?:to|deliver(?:\s+to|\s+at)?|drop(?:\s+to|\s+off)?|destination)\s*[:=]?\s*([A-Za-z\s,\.-]+?)(?:\.|\n|rate|need|weight|offering|\$|€|₹|$)",
            text,
            re.IGNORECASE,
        )
        if m:
            orig = m.group(1).strip().strip(",.-")
            dest = m.group(2).strip().strip(",.-")
            if orig and dest:
                return orig, dest

        # Pattern 2: "Origin: X" and "Destination: Y" on separate lines or keys
        orig_match = re.search(r"(?:origin|pickup)\s*[:=]\s*([A-Za-z\s,\.-]+)", text, re.IGNORECASE)
        dest_match = re.search(r"(?:destination|drop|delivery)\s*[:=]\s*([A-Za-z\s,\.-]+)", text, re.IGNORECASE)
        if orig_match and dest_match:
            orig = orig_match.group(1).split(",")[0].strip()
            dest = dest_match.group(1).split(",")[0].strip()
            if orig and dest:
                return orig, dest

        # Pattern 3: "<CityA> to <CityB>" or "<CityA> -> <CityB>"
        m3 = re.search(r"\b([A-Za-z]{3,20})\s*(?:to|->|-->)\s*([A-Za-z]{3,20})\b", text, re.IGNORECASE)
        if m3:
            orig = m3.group(1).strip()
            dest = m3.group(2).strip()
            # Avoid stopwords
            stopwords = {"need", "want", "have", "order", "load", "rate", "weight"}
            if orig.lower() not in stopwords and dest.lower() not in stopwords:
                return orig, dest

        return None, None

    def _extract_rate_and_currency(self, text: str) -> tuple[float | None, str]:
        detected_currency = "EUR"

        # Search for rate mentions with currency symbol or word
        # Matches: ₹45,000 | 45,000 INR | EUR 1200 | €1,200 | Rate is 1500 | Rate: 45000
        patterns = [
            r"(?:rate|price|freight|budget|quote|amount|is|at|offering)?\s*[:=]?\s*([₹\$€£]|eur|inr|usd|rs\.?)\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)",
            r"(?:rate|price|freight|budget|quote|amount|is|at|offering)\s*[:=]?\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*([₹\$€£]|eur|inr|usd|rs\.?)?",
        ]

        for p in patterns:
            for match in re.finditer(p, text, re.IGNORECASE):
                groups = match.groups()
                # Find which group is currency and which is number
                curr_candidate = None
                num_candidate = None

                for g in groups:
                    if not g:
                        continue
                    clean_g = g.strip().lower()
                    if clean_g in self.CURRENCY_SYMBOLS:
                        curr_candidate = self.CURRENCY_SYMBOLS[clean_g]
                    elif re.match(r"^[0-9,.]+$", g.strip()):
                        num_candidate = g.strip()

                if num_candidate:
                    try:
                        rate_val = float(num_candidate.replace(",", ""))
                        if rate_val > 0:
                            if curr_candidate:
                                detected_currency = curr_candidate
                            elif "₹" in text or "inr" in text.lower():
                                detected_currency = "INR"
                            elif "$" in text or "usd" in text.lower():
                                detected_currency = "USD"
                            elif "€" in text or "eur" in text.lower():
                                detected_currency = "EUR"
                            return rate_val, detected_currency
                    except ValueError:
                        continue

        return None, detected_currency

    def _extract_equipment(self, text: str) -> str:
        text_lower = text.lower()
        for kw, eq in self.EQUIPMENT_KEYWORDS.items():
            if re.search(r"\b" + re.escape(kw) + r"\b", text_lower):
                return eq
        return EquipmentType.DRY_VAN.value

    def _extract_weight(self, text: str) -> float | None:
        # Matches "12,000 kg", "12000kg", "18 tonnes", "22 tons", "15000 lbs"
        m = re.search(
            r"(?:weight|wt|payload|cargo)?\s*[:=]?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(kg|kgs|kilogram|kilograms|tons|ton|tonne|tonnes|lbs|pound|pounds)\b",
            text,
            re.IGNORECASE,
        )
        if m:
            num_str = m.group(1).replace(",", "")
            unit = m.group(2).lower()
            try:
                val = float(num_str)
                if unit in ("ton", "tons", "tonne", "tonnes"):
                    return round(val * 1000.0, 1)
                elif unit in ("lbs", "pound", "pounds"):
                    return round(val * 0.45359237, 1)
                return round(val, 1)
            except ValueError:
                pass

        # Check for standalone "weight: 12000"
        m2 = re.search(r"(?:weight|wt)\s*[:=]\s*([0-9,.]+)", text, re.IGNORECASE)
        if m2:
            try:
                return float(m2.group(1).replace(",", ""))
            except ValueError:
                pass

        return None


class OllamaExtractor(BaseExtractor):
    """
    Local SLM extractor using Ollama API with JSON mode.
    Falls back gracefully to DeterministicFallbackExtractor if Ollama is unreachable.
    """

    def __init__(self, fallback: BaseExtractor | None = None):
        self.fallback = fallback or DeterministicFallbackExtractor()
        self.client = httpx.Client(timeout=3.0)

    def extract(self, text: str) -> DispatchLoad:
        prompt = (
            "You are a logistics dispatch extraction engine. "
            "Extract shipment details from the following dispatch communication into a JSON object.\n"
            "Required fields:\n"
            "- origin (string: city/location)\n"
            "- destination (string: city/location)\n"
            "- rate (number: positive freight rate)\n"
            "- equipment_type (string: e.g. reefer, dry_van, flatbed, tanker)\n"
            "- weight_kg (number or null: weight in kilograms)\n"
            "- currency (string: e.g. EUR, USD, INR)\n\n"
            f"Email text:\n\"\"\"{text}\"\"\"\n\n"
            "Return ONLY valid JSON."
        )

        try:
            url = f"{settings.ollama_url}/api/generate"
            res = self.client.post(
                url,
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt,
                    "format": "json",
                    "stream": False,
                    "options": {"temperature": 0.0},
                },
            )

            if res.status_code == 200:
                body = res.json()
                raw_response = body.get("response", "{}")
                parsed_json = json.loads(raw_response)

                parsed_json["extracted_by"] = "ollama"
                parsed_json["confidence"] = 0.98

                # Validate with strict Pydantic model
                return DispatchLoad.model_validate(parsed_json)
            else:
                logger.warning(
                    f"Ollama returned status {res.status_code}. Falling back to deterministic extractor."
                )
        except Exception as exc:
            logger.info(
                f"Ollama extraction unavailable or timed out ({exc}). Using deterministic fallback parser."
            )

        # Resilient fallback
        return self.fallback.extract(text)


# Module-level instances
_deterministic_extractor = DeterministicFallbackExtractor()
_ollama_extractor = OllamaExtractor(fallback=_deterministic_extractor)


def parse_dispatch_email(email_text: str, use_slm: bool = True) -> DispatchLoad:
    """
    Main entry point for parsing dispatch emails into strict Pydantic DispatchLoad.
    """
    if use_slm:
        return _ollama_extractor.extract(email_text)
    return _deterministic_extractor.extract(email_text)
