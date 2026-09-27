"""
Seed script: ingest penalty policy documents into Qdrant on first startup.
Called from main.py lifespan if the collection is empty.
"""
import json
from pathlib import Path


def seed_penalty_policies() -> int:
    """
    Ingest seed documents from data/penalty_policies.jsonl.
    Returns number of documents ingested (0 if already seeded or file missing).
    """
    from rag.qdrant_store import get_point_count
    from rag.ingestion import ingest_document

    data_file = Path(__file__).parent / "data" / "penalty_policies.jsonl"
    if not data_file.exists():
        print("[seed] No seed file found — skipping.")
        return 0

    if get_point_count() > 0:
        print(f"[seed] Collection already has {get_point_count()} points — skipping seed.")
        return 0

    print("[seed] Ingesting penalty policy documents...")
    total = 0
    with data_file.open() as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            doc = json.loads(line)
            chunks = ingest_document(
                text=doc["text"],
                source=doc["source"],
                clause_type=doc["clause_type"],
            )
            total += len(chunks)
            print(f"[seed]   {doc['source']} ({doc['clause_type']}) → {len(chunks)} chunk(s)")

    print(f"[seed] Done — {total} chunks ingested.")
    return total
