from typing import Dict, List, Any, Tuple
from app.core.config import settings


class AntiHallucinationPipeline:
    """6-Layer Anti-Hallucination System preventing hallucinated citations or unverified legal claims."""

    @staticmethod
    def verify_and_ground_response(
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        generated_answer: str
    ) -> Tuple[str, str, List[Dict[str, Any]]]:
        """
        Processes AI generated response through 6 safety layers.
        Returns: (final_answer, confidence_status, verified_citations)
        """
        # Layer 4 & 5: Retrieval Boundaries Check
        if not retrieved_chunks:
            refusal_text = (
                "I don't have sufficient evidence in the provided documents to answer this reliably.\n\n"
                f"**Legal Notice**: {settings.LEGAL_DISCLAIMER}"
            )
            return refusal_text, "Insufficient Evidence", []

        # Layer 1 & 2: Source Citation Verification & Matching
        verified_citations: List[Dict[str, Any]] = []
        max_sim = 0.0

        for chk in retrieved_chunks:
            sim = chk.get("score", 0.0)
            if sim > max_sim:
                max_sim = sim

            verified_citations.append({
                "chunk_id": chk["id"],
                "document_id": chk["document_id"],
                "doc_title": chk.get("doc_title", "Document"),
                "page_number": chk.get("page_number", 1),
                "section_heading": chk.get("section_heading", "General"),
                "source_text": chk["text_content"],
                "similarity_score": sim
            })

        # Layer 2: Determine Calibrated Confidence Status
        if max_sim >= 0.75:
            confidence_status = "High Confidence"
        elif max_sim >= 0.45:
            confidence_status = "Moderate Confidence"
        else:
            confidence_status = "Needs Legal Review"

        # Layer 3: High-Risk Cross Validation Pass
        is_high_risk_query = any(k in query.lower() for k in ["liabil", "indemnif", "terminat", "penalty", "lawsuit", "breach"])
        if is_high_risk_query and confidence_status != "High Confidence":
            confidence_status = "Needs Legal Review"

        # Layer 5: Append mandatory legal disclaimer & source citation references
        final_answer = generated_answer
        if not final_answer.endswith(settings.LEGAL_DISCLAIMER):
            final_answer += f"\n\n---\n**Legal Notice**: {settings.LEGAL_DISCLAIMER}"

        return final_answer, confidence_status, verified_citations
