import time
import json
import numpy as np
from typing import List, Dict, Any, Optional
from rank_bm25 import BM25Okapi
from app.db.database import db_manager
from app.rag.embeddings import EmbeddingGenerator
from app.core.metrics import metrics_collector
from app.core.logging import logger


class HybridRetrievalEngine:
    """Optimized Hybrid Retrieval Engine: Batch Vector Matrix Multiplication + BM25 Search + Metadata Guard."""

    @staticmethod
    async def search(
        query: str,
        organization_id: str,
        document_id: Optional[str] = None,
        top_k: int = 5,
        jurisdiction: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        start_time = time.time()

        # 1. Tenant-isolated SQL Fetch of candidate document chunks
        if document_id:
            sql = """
                SELECT c.id, c.document_id, c.organization_id, c.text_content, c.page_number, 
                       c.section_heading, c.clause_type, d.title as doc_title
                FROM document_chunks c
                JOIN documents d ON c.document_id = d.id
                WHERE c.organization_id = ? AND c.document_id = ? AND d.is_deleted = 0
            """
            params = (organization_id, document_id)
        else:
            sql = """
                SELECT c.id, c.document_id, c.organization_id, c.text_content, c.page_number, 
                       c.section_heading, c.clause_type, d.title as doc_title
                FROM document_chunks c
                JOIN documents d ON c.document_id = d.id
                WHERE c.organization_id = ? AND d.is_deleted = 0
            """
            params = (organization_id,)

        raw_chunks = await db_manager.execute_query(sql, params)
        if not raw_chunks:
            retrieval_ms = (time.time() - start_time) * 1000
            metrics_collector.record_latency("vector_retrieval", retrieval_ms)
            return []

        # 2. Batch Vectorization Matrix Dot Product Optimization
        query_vec = np.array(EmbeddingGenerator.get_embedding(query))
        chunk_vecs = np.array([EmbeddingGenerator.get_embedding(chk["text_content"]) for chk in raw_chunks])

        # Vectorized batch cosine similarity: dot product of normalized vectors
        query_norm = np.linalg.norm(query_vec)
        chunk_norms = np.linalg.norm(chunk_vecs, axis=1)

        if query_norm > 0:
            query_vec_norm = query_vec / query_norm
        else:
            query_vec_norm = query_vec

        chunk_norms[chunk_norms == 0] = 1.0
        chunk_vecs_norm = chunk_vecs / chunk_norms[:, np.newaxis]

        vector_scores = np.dot(chunk_vecs_norm, query_vec_norm)

        # 3. BM25 Keyword Search Calculation
        corpus = [chk["text_content"].lower().split() for chk in raw_chunks]
        query_tokens = query.lower().split()
        bm25 = BM25Okapi(corpus)
        bm25_scores = bm25.get_scores(query_tokens)

        max_bm25 = max(bm25_scores) if len(bm25_scores) > 0 and max(bm25_scores) > 0 else 1.0
        
        # 4. Hybrid Reciprocal Rank / Score Fusion (0.6 Vector + 0.4 BM25)
        final_results = []
        for idx, chk in enumerate(raw_chunks):
            v_score = float(vector_scores[idx])
            norm_bm25 = bm25_scores[idx] / max_bm25
            hybrid_score = (0.6 * v_score) + (0.4 * norm_bm25)
            final_results.append({
                **chk,
                "score": hybrid_score,
                "vector_score": v_score,
                "bm25_score": norm_bm25
            })

        # 5. Sort by Hybrid Score & return Top-K
        final_results.sort(key=lambda x: x["score"], reverse=True)
        top_results = final_results[:top_k]

        retrieval_ms = (time.time() - start_time) * 1000
        metrics_collector.record_latency("vector_retrieval", retrieval_ms)
        logger.info(f"Hybrid search returned {len(top_results)} results in {retrieval_ms:.2f}ms for query: '{query}'")

        return top_results
