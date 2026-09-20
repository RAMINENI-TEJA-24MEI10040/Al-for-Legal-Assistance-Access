import uuid
from typing import Dict, Any, Optional
from app.rag.retrieval import HybridRetrievalEngine
from app.rag.anti_hallucination import AntiHallucinationPipeline
from app.agents.model_router import ModelRouter
from app.db.database import db_manager


class QAAgent:
    """Agent 5 — Q&A Agent: Grounded legal question answering with page/section citations and anti-hallucination refusal boundary."""

    @staticmethod
    async def answer_question(
        query_text: str,
        organization_id: str,
        user_id: str,
        document_id: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Hybrid Retrieval of document chunks (vector + BM25 + tenant filter)
        retrieved_chunks = await HybridRetrievalEngine.search(
            query=query_text,
            organization_id=organization_id,
            document_id=document_id,
            top_k=5
        )

        if not retrieved_chunks:
            refusal_msg = "I don't have sufficient evidence in the provided documents to answer this reliably."
            return {
                "answer": refusal_msg,
                "confidence_status": "Insufficient Evidence",
                "citations": [],
                "model_used": settings.GEMINI_FAST_MODEL
            }

        # 2. Context Construction from retrieved chunks
        context_str = "\n\n".join([
            f"[Page {chk.get('page_number', 1)} | Section: {chk.get('section_heading', 'General')}]\n{chk['text_content']}"
            for chk in retrieved_chunks
        ])

        system_instruction = (
            "You are LegalEase AI Q&A Agent. Answer the user's legal document question strictly using the provided context chunks. "
            "Cite specific section headings and page numbers. Never fabricate legal sources or answer beyond the provided context. "
            "If the context does not contain sufficient facts to answer, explicitly state: 'I don't have sufficient evidence in the provided documents to answer this reliably.'"
        )

        prompt = f"Context Documents:\n{context_str}\n\nUser Question:\n{query_text}"

        # 3. Model Execution
        model_res = await ModelRouter.call_model(
            prompt=prompt,
            system_instruction=system_instruction,
            task_complexity="reasoning",
            organization_id=organization_id,
            user_id=user_id
        )

        raw_answer = model_res["text"]

        # 4. Anti-Hallucination 6-Layer Verification Pass
        final_answer, confidence_status, citations = AntiHallucinationPipeline.verify_and_ground_response(
            query=query_text,
            retrieved_chunks=retrieved_chunks,
            generated_answer=raw_answer
        )

        # 5. Persist Query, Response, and Citations in DB
        query_id = f"qry_{uuid.uuid4().hex[:12]}"
        response_id = f"resp_{uuid.uuid4().hex[:12]}"

        await db_manager.execute_commit(
            """
            INSERT INTO queries (id, organization_id, user_id, document_id, query_text)
            VALUES (?, ?, ?, ?, ?)
            """,
            (query_id, organization_id, user_id, document_id, query_text)
        )

        await db_manager.execute_commit(
            """
            INSERT INTO responses (id, query_id, answer_text, confidence_status, model_used, latency_ms)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (response_id, query_id, final_answer, confidence_status, model_res["model_used"], model_res["latency_ms"])
        )

        for cit in citations:
            cit_id = f"cit_{uuid.uuid4().hex[:12]}"
            await db_manager.execute_commit(
                """
                INSERT INTO citations (id, response_id, document_id, chunk_id, source_text, section_heading, page_number, similarity_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (cit_id, response_id, cit["document_id"], cit["chunk_id"], cit["source_text"], cit["section_heading"], cit["page_number"], cit["similarity_score"])
            )

        return {
            "query_id": query_id,
            "response_id": response_id,
            "answer": final_answer,
            "confidence_status": confidence_status,
            "citations": citations,
            "model_used": model_res["model_used"],
            "latency_ms": model_res["latency_ms"]
        }
