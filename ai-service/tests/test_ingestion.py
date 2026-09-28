"""
Unit and integration tests for Feature 2: Agentic Data Ingestion Engine.
Tests Pydantic validation, deterministic fallback, missing fields, and rate/weight handling.
"""
import os
import sys
import pytest
from pydantic import ValidationError
from starlette.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from ingestion.schemas import DispatchLoad, EquipmentType
from ingestion.parser import DeterministicFallbackExtractor, parse_dispatch_email


def test_valid_dispatch_email_extraction_example():
    """
    Test extraction using the prompt's exact example:
    'Load pickup from Mumbai to Delhi. Rate is ₹45,000. Need a reefer truck. Weight 12,000 kg.'
    """
    email_text = (
        "Load pickup from Mumbai to Delhi.\n"
        "Rate is ₹45,000.\n"
        "Need a reefer truck.\n"
        "Weight 12,000 kg."
    )
    load = parse_dispatch_email(email_text, use_slm=False)

    assert isinstance(load, DispatchLoad)
    assert load.origin == "Mumbai"
    assert load.destination == "Delhi"
    assert load.rate == 45000.0
    assert load.equipment_type == EquipmentType.REEFER.value
    assert load.weight_kg == 12000.0
    assert load.currency == "INR"


def test_european_route_dispatch_extraction():
    """
    Test extraction for typical EU corridor:
    'Origin: Rotterdam, Destination: Berlin. Freight rate EUR 1,200. Dry van, 18000 kg.'
    """
    email_text = (
        "Urgent dispatch request:\n"
        "Origin: Rotterdam\n"
        "Destination: Berlin\n"
        "Rate: 1,200 EUR\n"
        "Equipment: Dry van\n"
        "Payload: 18,000 kg"
    )
    load = parse_dispatch_email(email_text, use_slm=False)

    assert load.origin == "Rotterdam"
    assert load.destination == "Berlin"
    assert load.rate == 1200.0
    assert load.equipment_type == EquipmentType.DRY_VAN.value
    assert load.weight_kg == 18000.0
    assert load.currency == "EUR"


def test_flatbed_with_tonnes_conversion():
    """
    Test weight specified in tonnes converting to kg.
    """
    email_text = "Offering flatbed from Hamburg to Copenhagen, rate is 1500 EUR, weight 22 tonnes."
    load = parse_dispatch_email(email_text, use_slm=False)

    assert load.origin == "Hamburg"
    assert load.destination == "Copenhagen"
    assert load.rate == 1500.0
    assert load.equipment_type == EquipmentType.FLATBED.value
    assert load.weight_kg == 22000.0


def test_missing_required_origin_destination_raises():
    """
    Email missing origin/destination should fail extraction with a descriptive error.
    """
    email_text = "Hello, rate is 1200 EUR for a reefer truck, 10000 kg."
    with pytest.raises(ValueError) as excinfo:
        parse_dispatch_email(email_text, use_slm=False)
    assert "origin and destination" in str(excinfo.value).lower()


def test_missing_rate_raises():
    """
    Email missing freight rate should fail extraction.
    """
    email_text = "Please dispatch reefer from Paris to Amsterdam. Weight 5000 kg."
    with pytest.raises(ValueError) as excinfo:
        parse_dispatch_email(email_text, use_slm=False)
    assert "freight rate" in str(excinfo.value).lower()


def test_pydantic_strict_validation():
    """
    Test strict Pydantic model validation on invalid negative rates or empty strings.
    """
    # Negative rate rejected
    with pytest.raises(ValidationError):
        DispatchLoad(
            origin="Mumbai",
            destination="Delhi",
            rate=-500.0,
            equipment_type="reefer",
        )

    # Blank origin rejected
    with pytest.raises(ValidationError):
        DispatchLoad(
            origin="",
            destination="Delhi",
            rate=1000.0,
            equipment_type="reefer",
        )

    # Blank destination rejected
    with pytest.raises(ValidationError):
        DispatchLoad(
            origin="Mumbai",
            destination="   ",
            rate=1000.0,
            equipment_type="reefer",
        )


def test_equipment_normalization():
    """
    Test equipment aliases normalize cleanly.
    """
    load = DispatchLoad(
        origin="Paris",
        destination="Berlin",
        rate=900.0,
        equipment_type="Refrigerated",
    )
    assert load.equipment_type == "reefer"

    load2 = DispatchLoad(
        origin="Paris",
        destination="Berlin",
        rate=900.0,
        equipment_type="Flat-Bed",
    )
    assert load2.equipment_type == "flatbed"


def test_ingest_email_api_endpoint():
    """
    Test FastAPI POST /ingest/email endpoint with realistic dispatch text.
    """
    client = TestClient(app)
    payload = {
        "email_text": "Need urgent reefer transport from Mumbai to Delhi. Rate is 45000 INR. Weight 12000 kg."
    }
    response = client.post("/ingest/email", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["load"]["origin"] == "Mumbai"
    assert data["load"]["destination"] == "Delhi"
    assert data["load"]["rate"] == 45000.0
    assert data["load"]["equipment_type"] == "reefer"
    assert data["load"]["weight_kg"] == 12000.0


def test_ingest_email_api_endpoint_invalid_error():
    """
    Test FastAPI POST /ingest/email endpoint returns 422 for missing required fields.
    """
    client = TestClient(app)
    payload = {
        "email_text": "Hello, good morning team."
    }
    response = client.post("/ingest/email", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
