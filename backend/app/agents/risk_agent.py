import uuid
from typing import List, Dict, Any
from app.db.database import db_manager
from app.agents.model_router import ModelRouter


class RiskAgent:
    """Agent 3 — Risk Agent: Identifies potential contract liabilities, auto-renewals, penalties, and missing protections."""

    @staticmethod
    async def analyze_document_risks(document_id: str, organization_id: str) -> List[Dict[str, Any]]:
        # Fetch clauses and chunks
        chunks = await db_manager.execute_query(
            "SELECT * FROM document_chunks WHERE document_id = ? AND organization_id = ?",
            (document_id, organization_id)
        )

        risk_findings: List[Dict[str, Any]] = []

        for chk in chunks:
            text = chk["text_content"]
            lower_text = text.lower()
            page_num = chk.get("page_number", 1)
            heading = chk.get("section_heading", "General")

            # 1. Unlimited Liability Risk Detection
            if "liabil" in lower_text and ("unlimited" in lower_text or "without limit" in lower_text or "no cap" in lower_text or "no maximum" in lower_text):
                risk_findings.append({
                    "id": f"risk_{uuid.uuid4().hex[:12]}",
                    "document_id": document_id,
                    "organization_id": organization_id,
                    "issue_title": "Unlimited Liability Provision",
                    "severity": "High Risk — Unlimited Liability Clause",
                    "severity_level": "High",
                    "evidence_text": text[:250],
                    "source_section": heading,
                    "page_number": page_num,
                    "explanation": "The clause removes standard monetary caps on liability, exposing the organization to uncapped financial damages.",
                    "verification_status": "Verified",
                    "potential_consideration": "Propose inserting a mutual liability cap equal to 12 months of paid contract fees.",
                    "requires_professional_review": 1
                })

            # 2. Broad Indemnification Risk Detection
            elif "indemnif" in lower_text and ("hold harmless" in lower_text or "defend" in lower_text):
                risk_findings.append({
                    "id": f"risk_{uuid.uuid4().hex[:12]}",
                    "document_id": document_id,
                    "organization_id": organization_id,
                    "issue_title": "Uncapped Indemnification Obligation",
                    "severity": "High Risk — Broad Indemnification Scope",
                    "severity_level": "High",
                    "evidence_text": text[:250],
                    "source_section": heading,
                    "page_number": page_num,
                    "explanation": "Broad indemnification language requiring defense against third-party claims without clear fault exclusions.",
                    "verification_status": "Verified",
                    "potential_consideration": "Limit indemnification strictly to gross negligence, willful misconduct, or direct IP infringement.",
                    "requires_professional_review": 1
                })

            # 3. Automatic Renewal Risk Detection
            elif "auto-renew" in lower_text or "automatically renew" in lower_text or "renews automatically" in lower_text:
                risk_findings.append({
                    "id": f"risk_{uuid.uuid4().hex[:12]}",
                    "document_id": document_id,
                    "organization_id": organization_id,
                    "issue_title": "Automatic Renewal Commitment",
                    "severity": "Medium Risk — Automatic Renewal",
                    "severity_level": "Medium",
                    "evidence_text": text[:250],
                    "source_section": heading,
                    "page_number": page_num,
                    "explanation": "Agreement automatically renews for subsequent terms unless written cancellation is submitted within a strict window.",
                    "verification_status": "Verified",
                    "potential_consideration": "Calendar the non-renewal notice deadline 60 days prior to contract expiration.",
                    "requires_professional_review": 1
                })

            # 4. Severe Termination Penalty
            elif "terminat" in lower_text and ("penalty" in lower_text or "liquidated damages" in lower_text or "early termination fee" in lower_text):
                risk_findings.append({
                    "id": f"risk_{uuid.uuid4().hex[:12]}",
                    "document_id": document_id,
                    "organization_id": organization_id,
                    "issue_title": "Early Termination Financial Penalty",
                    "severity": "Medium Risk — Termination Penalty",
                    "severity_level": "Medium",
                    "evidence_text": text[:250],
                    "source_section": heading,
                    "page_number": page_num,
                    "explanation": "Early termination triggers accelerated payment penalties equal to remaining contract balance.",
                    "verification_status": "Verified",
                    "potential_consideration": "Negotiate termination for convenience upon 30 days notice without financial penalty.",
                    "requires_professional_review": 1
                })

        # Save findings to SQLite DB
        for rf in risk_findings:
            await db_manager.execute_commit(
                """
                INSERT OR IGNORE INTO risk_findings 
                (id, document_id, organization_id, issue_title, severity, evidence_text, source_section, page_number, explanation, verification_status, potential_consideration, requires_professional_review)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (rf["id"], rf["document_id"], rf["organization_id"], rf["issue_title"], rf["severity"], rf["evidence_text"], rf["source_section"], rf["page_number"], rf["explanation"], rf["verification_status"], rf["potential_consideration"], rf["requires_professional_review"])
            )

        return risk_findings
