"""
Strict Pydantic schemas for dispatch email extraction.
Validates unstructured logistics communications into deterministic JSON.
"""
from enum import Enum
from pydantic import BaseModel, Field, field_validator, ConfigDict


class EquipmentType(str, Enum):
    REEFER = "reefer"
    DRY_VAN = "dry_van"
    FLATBED = "flatbed"
    TANKER = "tanker"
    STEP_DECK = "step_deck"
    LOWBOY = "lowboy"
    BOX_TRUCK = "box_truck"
    CONTAINER = "container"
    OTHER = "other"


class DispatchLoad(BaseModel):
    """
    Validated structured logistics data extracted from raw dispatch email.
    """
    model_config = ConfigDict(str_strip_whitespace=True)

    origin: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Origin city, facility or location of shipment pickup",
    )
    destination: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Destination city, facility or location of shipment delivery",
    )
    rate: float = Field(
        ...,
        gt=0,
        le=10_000_000,
        description="Agreed or proposed freight rate as a positive number",
    )
    equipment_type: str = Field(
        default="dry_van",
        description="Trailer or equipment requirement (e.g. reefer, flatbed, dry_van, tanker)",
    )
    weight_kg: float | None = Field(
        default=None,
        ge=0,
        le=500_000,
        description="Total shipment weight in kilograms",
    )
    currency: str = Field(
        default="EUR",
        max_length=10,
        description="Detected currency code or symbol (e.g. EUR, USD, INR)",
    )
    confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Extraction confidence score (0.0 to 1.0)",
    )
    extracted_by: str = Field(
        default="slm",
        description="Extraction engine: 'ollama-llama3' or 'deterministic_fallback'",
    )

    @field_validator("origin", "destination")
    @classmethod
    def validate_location(cls, v: str) -> str:
        cleaned = v.strip().strip(",.- ")
        if not cleaned or len(cleaned) < 2:
            raise ValueError("Origin and destination must be non-empty location strings.")
        return cleaned

    @field_validator("equipment_type")
    @classmethod
    def normalize_equipment(cls, v: str) -> str:
        if not v:
            return "dry_van"
        cleaned = v.lower().strip().replace("-", "_").replace(" ", "_")
        mapping = {
            "reefer": "reefer",
            "refrigerated": "reefer",
            "dry_van": "dry_van",
            "dryvan": "dry_van",
            "van": "dry_van",
            "flatbed": "flatbed",
            "flat_bed": "flatbed",
            "tanker": "tanker",
            "tank": "tanker",
            "step_deck": "step_deck",
            "stepdeck": "step_deck",
            "lowboy": "lowboy",
            "box_truck": "box_truck",
            "container": "container",
        }
        return mapping.get(cleaned, cleaned)


class IngestEmailRequest(BaseModel):
    email_text: str = Field(
        ...,
        min_length=5,
        description="Raw unstructured text from incoming dispatch email",
    )


class IngestEmailResponse(BaseModel):
    success: bool = True
    load: DispatchLoad
    raw_email_snippet: str | None = None
