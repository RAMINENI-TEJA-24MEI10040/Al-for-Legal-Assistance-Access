import re
from typing import Tuple, Dict

PII_PATTERNS = {
    "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
    "CREDIT_CARD": r"\b(?:\d[ -]*?){13,16}\b",
    "EMAIL": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "PHONE": r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
    "PASSPORT": r"\b[A-Z0-9]{6,9}\b"
}


class PIIRedactor:
    """Scans and redacts PII before document indexing or telemetry logging."""

    @staticmethod
    def redact_text(text: str) -> Tuple[str, Dict[str, int]]:
        redacted_text = text
        counts: Dict[str, int] = {}

        for pii_type, pattern in PII_PATTERNS.items():
            matches = re.findall(pattern, redacted_text)
            if matches:
                counts[pii_type] = len(matches)
                redacted_text = re.sub(pattern, f"[REDACTED_{pii_type}]", redacted_text)

        return redacted_text, counts
