import re
from typing import List, Dict, Any, Tuple


class StructureAwareChunker:
    """Structure-aware legal chunker preserving hierarchy (Section -> Subsection -> Clause -> Paragraph) & standalone definitions."""

    @staticmethod
    def chunk_parsed_document(parsed_doc: Dict[str, Any], document_id: str, organization_id: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        chunks: List[Dict[str, Any]] = []
        definitions: List[Dict[str, Any]] = []

        sections = parsed_doc.get("sections", [])
        chunk_idx = 0

        # Definition extraction regex matching e.g. "Term" means ...
        def_pattern = r'"([^"]+)"\s+(?:means|shall mean|refers to)\s+([^.\n]+)'

        for sec in sections:
            sec_heading = sec.get("heading", "General")
            sec_num = sec.get("section_number", "")
            sec_text = sec.get("text", "")
            page_num = sec.get("page_number", 1)

            # Search for definitions in text
            def_matches = re.findall(def_pattern, sec_text, re.IGNORECASE)
            for term, def_val in def_matches:
                definitions.append({
                    "document_id": document_id,
                    "term": term.strip(),
                    "definition_text": def_val.strip(),
                    "section_heading": sec_heading,
                    "page_number": page_num
                })

            # Paragraph & Clause level chunking (~250-400 words target)
            paragraphs = sec_text.split("\n\n")
            current_chunk_paragraphs = []
            current_len = 0

            for p in paragraphs:
                p_clean = p.strip()
                if not p_clean:
                    continue

                words = p_clean.split()
                if current_len + len(words) > 350 and current_chunk_paragraphs:
                    chunk_text = "\n\n".join(current_chunk_paragraphs)
                    chunks.append({
                        "chunk_index": chunk_idx,
                        "document_id": document_id,
                        "organization_id": organization_id,
                        "text_content": chunk_text,
                        "cleaned_content": chunk_text.lower(),
                        "page_number": page_num,
                        "section_heading": sec_heading,
                        "section_number": sec_num,
                        "clause_type": StructureAwareChunker._detect_clause_type(chunk_text)
                    })
                    chunk_idx += 1
                    current_chunk_paragraphs = [p_clean]
                    current_len = len(words)
                else:
                    current_chunk_paragraphs.append(p_clean)
                    current_len += len(words)

            if current_chunk_paragraphs:
                chunk_text = "\n\n".join(current_chunk_paragraphs)
                chunks.append({
                    "chunk_index": chunk_idx,
                    "document_id": document_id,
                    "organization_id": organization_id,
                    "text_content": chunk_text,
                    "cleaned_content": chunk_text.lower(),
                    "page_number": page_num,
                    "section_heading": sec_heading,
                    "section_number": sec_num,
                    "clause_type": StructureAwareChunker._detect_clause_type(chunk_text)
                })
                chunk_idx += 1

        return chunks, definitions

    @staticmethod
    def _detect_clause_type(text: str) -> str:
        lower = text.lower()
        if "indemnif" in lower or "hold harmless" in lower:
            return "indemnification"
        elif "liabil" in lower or "limitation of liability" in lower:
            return "liability"
        elif "terminat" in lower or "cancel" in lower:
            return "termination"
        elif "confidential" in lower or "non-disclosure" in lower:
            return "confidentiality"
        elif "governing law" in lower or "jurisdiction" in lower or "arbitrat" in lower:
            return "jurisdiction"
        elif "renew" in lower or "auto-renew" in lower:
            return "renewal"
        elif "payment" in lower or "fee" in lower or "invoice" in lower:
            return "payment"
        return "general"
