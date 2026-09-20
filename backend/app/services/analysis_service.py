from typing import Dict, Any, List
from app.db.database import db_manager
from app.agents.clause_agent import ClauseAgent
from app.agents.risk_agent import RiskAgent
from app.agents.compliance_agent import ComplianceAgent


class AnalysisService:
    """Use Case 1: Document Simplification & Deep Executive Summary Generator."""

    @staticmethod
    async def get_document_summary(document_id: str, organization_id: str) -> Dict[str, Any]:
        # Fetch document record
        docs = await db_manager.execute_query(
            "SELECT * FROM documents WHERE id = ? AND organization_id = ?",
            (document_id, organization_id)
        )
        if not docs:
            return {}

        doc = docs[0]
        clause_res = await ClauseAgent.extract_clauses_and_obligations(document_id, organization_id)
        risks = await RiskAgent.analyze_document_risks(document_id, organization_id)
        compliance = await ComplianceAgent.evaluate_compliance(document_id, organization_id)

        # Executive summary construction
        exec_summary = (
            f"This legal document ('{doc['filename']}') comprises {doc['page_count']} pages covering "
            f"{len(clause_res['clauses'])} extracted clauses across {len(clause_res['parties'])} identified parties. "
            f"A total of {len(risks)} potential risk concerns were identified requiring professional legal review."
        )

        # Important dates extraction mock
        important_dates = [
            {"event": "Effective Agreement Date", "date": "Upon Execution", "section": "Section 1.1"},
            {"event": "Non-Renewal Notice Deadline", "date": "60 Days Prior to Expiration", "section": "Section 8.2"}
        ]

        return {
            "document_id": document_id,
            "filename": doc["filename"],
            "file_type": doc["file_type"],
            "page_count": doc["page_count"],
            "executive_summary": exec_summary,
            "parties": clause_res["parties"],
            "key_obligations": clause_res["obligations"],
            "important_dates": important_dates,
            "glossary": clause_res["definitions"],
            "important_clauses": clause_res["clauses"],
            "potential_concerns": risks,
            "compliance_checks": compliance["evaluations"]
        }
