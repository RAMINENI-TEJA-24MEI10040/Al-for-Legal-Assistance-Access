import re
from typing import List, Dict, Any
from app.db.database import db_manager
from app.agents.model_router import ModelRouter


class ClauseAgent:
    """Agent 2 — Clause Agent: Clause identification, obligations, party identification, and definitions."""

    @staticmethod
    async def extract_clauses_and_obligations(document_id: str, organization_id: str) -> Dict[str, Any]:
        # Fetch document chunks
        chunks = await db_manager.execute_query(
            "SELECT * FROM document_chunks WHERE document_id = ? AND organization_id = ? ORDER BY chunk_index ASC",
            (document_id, organization_id)
        )

        extracted_clauses: List[Dict[str, Any]] = []
        obligations: List[Dict[str, Any]] = []
        parties: List[str] = []

        party_pattern = r"(?:between|by and between)\s+([A-Z][A-Za-z0-9\s,.]+?)\s+(?:and|\&)\s+([A-Z][A-Za-z0-9\s,.]+)"
        shall_pattern = r"([^.]*?\bshall\b[^.]*?\.)"

        for chk in chunks:
            text = chk["text_content"]
            
            # Party extraction
            p_match = re.search(party_pattern, text, re.IGNORECASE)
            if p_match:
                parties.extend([p_match.group(1).strip(), p_match.group(2).strip()])

            # Obligation extraction (shall/must statements)
            shall_matches = re.findall(shall_pattern, text, re.IGNORECASE)
            for sm in shall_matches:
                if len(sm.strip()) > 15:
                    obligations.append({
                        "obligation_text": sm.strip(),
                        "section_heading": chk.get("section_heading", "General"),
                        "page_number": chk.get("page_number", 1)
                    })

            # Clause identification
            if chk.get("clause_type") != "general":
                extracted_clauses.append({
                    "document_id": document_id,
                    "document_version": "v1.0",
                    "chunk_id": chk["id"],
                    "page_number": chk.get("page_number", 1),
                    "section_number": chk.get("section_number", ""),
                    "section_heading": chk.get("section_heading", "General"),
                    "clause_type": chk["clause_type"],
                    "source_text": text
                })

        # Fetch definitions
        defs = await db_manager.execute_query(
            "SELECT term, definition_text, section_heading, page_number FROM definitions WHERE document_id = ?",
            (document_id,)
        )

        return {
            "clauses": extracted_clauses,
            "obligations": obligations,
            "parties": list(set(parties)),
            "definitions": defs
        }
