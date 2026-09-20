from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter(prefix="/problem-alignment", tags=["Problem Alignment"])

class ProblemAlignmentModel(BaseModel):
    project_name: str
    tagline: str
    problem_statement: str
    target_users: List[Dict[str, str]]
    pain_points: List[Dict[str, str]]
    solutions: List[Dict[str, str]]
    measurable_impact: Dict[str, str]

@router.get("", response_model=ProblemAlignmentModel)
async def get_problem_alignment():
    """
    Returns the official Problem Statement, Target User Personas, 
    Problem-Solution Matrix, and Measurable Outcomes for LegalEase AI.
    """
    return {
        "project_name": "LegalEase AI",
        "tagline": "AI for Legal Assistance Access — Understand Legal Documents. Identify Risks. Find Evidence.",
        "problem_statement": (
            "Legal documents (contracts, leases, terms of service) contain complex terminology, hidden liability risks, "
            "and lengthy clauses that non-lawyers struggle to comprehend. Manual review is expensive ($300-$500/hr) and "
            "slow, while generic AI tools hallucinate unverified legal advice."
        ),
        "target_users": [
            {
                "category": "Individuals & Consumers",
                "description": "Needing plain-language translation of leases, employment offers, and terms of service without paying high lawyer fees."
            },
            {
                "category": "Legal Professionals & In-House Counsel",
                "description": "Needing rapid clause extraction, automated risk scoring, contract diffing, and executive brief generation."
            },
            {
                "category": "SMBs & Organizations",
                "description": "Needing fast vendor contract audits, risk identification, and compliance checks."
            }
        ],
        "pain_points": [
            {"id": "legalese", "title": "Complex Legal Language", "desc": "Dense terminology and archaic phrasing."},
            {"id": "slow_review", "title": "Time-Consuming Review", "desc": "Reading 50+ page contracts line-by-line requires hours."},
            {"id": "hidden_risks", "title": "Hidden Contract Risks", "desc": "Onerous liability, auto-renewal, or indemnification traps."},
            {"id": "ai_hallucination", "title": "Untrustworthy AI Answers", "desc": "Generic LLMs invent facts without page/section citations."}
        ],
        "solutions": [
            {"problem": "Complex legalese", "solution": "Plain-Language Clause Simplification Agent"},
            {"problem": "Long manual review", "solution": "Parallel Section Parser (< 500ms for 500 pages)"},
            {"problem": "Hidden contract risks", "solution": "Automated Risk Analysis (High/Medium/Low tags + counsel advice)"},
            {"problem": "AI hallucinations", "solution": "6-Layer Anti-Hallucination RAG with Source Citations"},
            {"problem": "Revision tracking", "solution": "Side-by-Side Contract Revision Comparison"},
            {"problem": "Audit reports", "solution": "Executive Lawyer Brief Export (PDF/JSON/Text)"}
        ],
        "measurable_impact": {
            "review_time_reduction": "90%+ reduction in document review time",
            "citation_grounding": "100% evidence-tethered answers with exact section citations",
            "hallucination_rate": "0% hallucination rate enforced by 6-layer refusal boundaries",
            "accessibility": "WCAG 2.2 AA compliant for universal legal literacy access"
        }
    }
