import re
from typing import Tuple

INJECTION_PATTERNS = [
    r"ignore previous instructions",
    r"disregard prior directives",
    r"system prompt:",
    r"you are now an unfiltered",
    r"reveal secret",
    r"exfiltrate",
    r"print system prompt",
    r"bypass safety",
    r"override rules",
    r"forget your legal disclaimer"
]


class PromptGuard:
    """Sanitizes queries and document text against direct & indirect prompt injection attacks."""

    @staticmethod
    def inspect_query(query: str) -> Tuple[bool, str]:
        normalized = query.lower()
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, normalized):
                return True, f"Suspicious prompt pattern detected: '{pattern}'."
        return False, ""

    @staticmethod
    def sanitize_document_text(text: str) -> str:
        """Strips suspicious prompt override commands from ingested document chunks."""
        cleaned = text
        for pattern in INJECTION_PATTERNS:
            cleaned = re.sub(pattern, "[SECURITY_REDACTED_INSTRUCTION]", cleaned, flags=re.IGNORECASE)
        return cleaned
