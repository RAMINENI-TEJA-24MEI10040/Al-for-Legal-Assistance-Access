from typing import List, Dict, Any
from app.db.database import db_manager


class ComparisonService:
    """Use Case 2: Multi-Document Clause Comparison Engine."""

    @staticmethod
    async def compare_documents(doc_id_a: str, doc_id_b: str, organization_id: str) -> Dict[str, Any]:
        # Fetch chunks for Doc A and Doc B
        chunks_a = await db_manager.execute_query(
            "SELECT * FROM document_chunks WHERE document_id = ? AND organization_id = ? ORDER BY chunk_index ASC",
            (doc_id_a, organization_id)
        )
        chunks_b = await db_manager.execute_query(
            "SELECT * FROM document_chunks WHERE document_id = ? AND organization_id = ? ORDER BY chunk_index ASC",
            (doc_id_b, organization_id)
        )

        doc_a_rec = (await db_manager.execute_query("SELECT filename FROM documents WHERE id = ?", (doc_id_a,)))[0]
        doc_b_rec = (await db_manager.execute_query("SELECT filename FROM documents WHERE id = ?", (doc_id_b,)))[0]

        comparison_matrix: List[Dict[str, Any]] = []
        additions: List[Dict[str, Any]] = []
        removals: List[Dict[str, Any]] = []
        modifications: List[Dict[str, Any]] = []
        material_differences: List[Dict[str, Any]] = []

        types_a = {c["clause_type"]: c for c in chunks_a if c["clause_type"] != "general"}
        types_b = {c["clause_type"]: c for c in chunks_b if c["clause_type"] != "general"}

        all_clause_types = set(types_a.keys()).union(set(types_b.keys()))

        for c_type in all_clause_types:
            item_a = types_a.get(c_type)
            item_b = types_b.get(c_type)

            if item_a and not item_b:
                removals.append({
                    "clause_type": c_type,
                    "doc_a_text": item_a["text_content"],
                    "section": item_a["section_heading"],
                    "page": item_a["page_number"]
                })
                comparison_matrix.append({
                    "clause_type": c_type.capitalize(),
                    "status": "Removed in Doc B",
                    "doc_a_quote": item_a["text_content"][:150],
                    "doc_b_quote": "N/A (Omitted in Document B)"
                })
            elif item_b and not item_a:
                additions.append({
                    "clause_type": c_type,
                    "doc_b_text": item_b["text_content"],
                    "section": item_b["section_heading"],
                    "page": item_b["page_number"]
                })
                comparison_matrix.append({
                    "clause_type": c_type.capitalize(),
                    "status": "Added in Doc B",
                    "doc_a_quote": "N/A (Omitted in Document A)",
                    "doc_b_quote": item_b["text_content"][:150]
                })
            elif item_a and item_b:
                if item_a["text_content"] != item_b["text_content"]:
                    modifications.append({
                        "clause_type": c_type,
                        "doc_a_text": item_a["text_content"],
                        "doc_b_text": item_b["text_content"]
                    })
                    if c_type in ["liability", "indemnification", "termination"]:
                        material_differences.append({
                            "clause_type": c_type,
                            "impact": "Material Risk Deviation",
                            "explanation": f"Document B modifies {c_type} terms compared to Document A."
                        })
                    comparison_matrix.append({
                        "clause_type": c_type.capitalize(),
                        "status": "Modified",
                        "doc_a_quote": item_a["text_content"][:150],
                        "doc_b_quote": item_b["text_content"][:150]
                    })
                else:
                    comparison_matrix.append({
                        "clause_type": c_type.capitalize(),
                        "status": "Unchanged",
                        "doc_a_quote": item_a["text_content"][:150],
                        "doc_b_quote": item_b["text_content"][:150]
                    })

        return {
            "document_a": {"id": doc_id_a, "filename": doc_a_rec["filename"]},
            "document_b": {"id": doc_id_b, "filename": doc_b_rec["filename"]},
            "comparison_matrix": comparison_matrix,
            "summary": {
                "additions_count": len(additions),
                "removals_count": len(removals),
                "modifications_count": len(modifications),
                "material_differences_count": len(material_differences)
            },
            "additions": additions,
            "removals": removals,
            "modifications": modifications,
            "material_differences": material_differences
        }
