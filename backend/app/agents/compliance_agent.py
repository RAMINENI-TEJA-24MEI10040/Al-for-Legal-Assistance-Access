from typing import List, Dict, Any
from app.db.database import db_manager


class ComplianceAgent:
    """Agent 4 — Compliance Agent: Compares clauses against standard compliance guidelines and flags jurisdiction deviations."""

    STANDARD_REQUIREMENTS = {
        "data_protection": "Contract must specify PII data handling, GDPR/CCPA compliance, and breach notification within 72 hours.",
        "governing_law": "Governing jurisdiction must be explicitly declared with court or arbitration venue.",
        "confidentiality": "Mutual confidentiality obligation with standard exceptions (public domain, legal process).",
        "liability_cap": "Liability cap must not exceed 2x annual contract value."
    }

    @staticmethod
    async def evaluate_compliance(document_id: str, organization_id: str, target_jurisdiction: str = "General") -> Dict[str, Any]:
        chunks = await db_manager.execute_query(
            "SELECT text_content, section_heading, page_number FROM document_chunks WHERE document_id = ? AND organization_id = ?",
            (document_id, organization_id)
        )

        all_text = " ".join([c["text_content"].lower() for c in chunks])
        evaluations: List[Dict[str, Any]] = []

        # 1. Data Protection Standard Check
        has_dp = "gdpr" in all_text or "privacy" in all_text or "data protection" in all_text or "breach" in all_text
        evaluations.append({
            "standard_name": "Data Protection & Privacy",
            "configured_standard": ComplianceAgent.STANDARD_REQUIREMENTS["data_protection"],
            "status": "Compliant" if has_dp else "Non-Compliant / Missing Provision",
            "document_evidence": "Data protection & privacy terms identified." if has_dp else "No explicit data protection or 72-hour breach notification clause found.",
            "ai_interpretation": "Requires inclusion of standard Data Processing Addendum (DPA)." if not has_dp else "Satisfies baseline privacy structure.",
            "requires_professional_review": True
        })

        # 2. Governing Law Check
        has_gov = "governing law" in all_text or "jurisdiction" in all_text or "state of" in all_text
        evaluations.append({
            "standard_name": "Jurisdiction & Governing Law",
            "configured_standard": ComplianceAgent.STANDARD_REQUIREMENTS["governing_law"],
            "status": "Compliant" if has_gov else "Non-Compliant / Missing Provision",
            "document_evidence": f"Governing law clause present (Target Jurisdiction: {target_jurisdiction})." if has_gov else "Governing law clause is omitted.",
            "ai_interpretation": "Verify alignment with host organization headquarters venue." if has_gov else "Add explicit choice of law and venue clause.",
            "requires_professional_review": True
        })

        return {
            "jurisdiction": target_jurisdiction,
            "evaluations": evaluations
        }
