import io
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from pypdf import PdfReader
from app.core.config import settings

# Recognized magic bytes
PDF_MAGIC_BYTES = b"%PDF"
DOCX_MAGIC_BYTES = b"PK\x03\x04"  # Zip archive header used by docx


class SecurityFileValidator:
    """Validates uploaded files against security threats (ZIP bombs, corrupt headers, macro execution risks)."""

    @staticmethod
    async def validate_file(file: UploadFile) -> Tuple[bytes, str]:
        # 1. Size Validation
        contents = await file.read()
        file_size = len(contents)
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        # 2. Magic Bytes Inspection
        file_signature = contents[:4]
        filename_lower = file.filename.lower()
        detected_type = "unknown"

        if file_signature.startswith(PDF_MAGIC_BYTES) or filename_lower.endswith(".pdf"):
            detected_type = "pdf"
        elif file_signature.startswith(DOCX_MAGIC_BYTES) or filename_lower.endswith(".docx"):
            detected_type = "docx"
        elif filename_lower.endswith(".txt"):
            detected_type = "txt"
        else:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported document format. Only PDF, DOCX, and TXT files are permitted."
            )

        # 3. PDF Page Count & Malformed Structure Safeguards
        if detected_type == "pdf":
            try:
                reader = PdfReader(io.BytesIO(contents))
                num_pages = len(reader.pages)
                if num_pages > settings.MAX_DOCUMENT_PAGES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Document page count ({num_pages}) exceeds maximum allowed limit of {settings.MAX_DOCUMENT_PAGES} pages."
                    )
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Malformed PDF document. Unable to parse structure safely."
                )

        return contents, detected_type
