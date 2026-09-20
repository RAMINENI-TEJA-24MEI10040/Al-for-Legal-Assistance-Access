import os
import io
import uuid
import openpyxl
from icalendar import Calendar, Event
from typing import Dict, Any
from app.services.lawyer_brief_service import LawyerBriefService
from app.db.database import db_manager


class ExportService:
    """Use Case 6: Export Engine supporting PDF, Excel, ICS calendar, and Email Draft formats."""

    @staticmethod
    async def generate_export(
        document_id: str,
        export_format: str,
        organization_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        brief_data = await LawyerBriefService.generate_brief(document_id, organization_id)
        if not brief_data:
            return {"error": "Document not found"}

        export_dir = os.path.join(os.path.dirname(__file__), "..", "exports_store")
        os.makedirs(export_dir, exist_ok=True)
        export_id = f"exp_{uuid.uuid4().hex[:12]}"

        if export_format == "excel":
            file_path = os.path.join(export_dir, f"{export_id}.xlsx")
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Legal Brief Summary"

            ws.append(["LegalEase AI Brief Export"])
            ws.append(["Filename", brief_data["document_metadata"]["filename"]])
            ws.append([])
            ws.append(["Risk Issue", "Severity", "Explanation", "Suggested Action"])

            for r in brief_data.get("unresolved_issues", []):
                ws.append([r.get("issue_title"), r.get("severity"), r.get("explanation"), r.get("potential_consideration")])

            wb.save(file_path)

        elif export_format == "ics":
            file_path = os.path.join(export_dir, f"{export_id}.ics")
            cal = Calendar()
            cal.add('prodid', '-//LegalEase AI Enterprise//NONSGML v1.0//EN')
            cal.add('version', '2.0')

            event = Event()
            event.add('summary', f"Legal Deadline: Non-Renewal Window for {brief_data['document_metadata']['filename']}")
            event.add('description', "Critical notice deadline to prevent automatic renewal of contract.")
            cal.add_component(event)

            with open(file_path, 'wb') as f:
                f.write(cal.to_ical())

        elif export_format == "email_draft":
            file_path = os.path.join(export_dir, f"{export_id}.txt")
            content = (
                f"SUBJECT: Legal Review Request: {brief_data['document_metadata']['filename']}\n\n"
                f"Dear Legal Counsel,\n\n"
                f"Please review the attached contract brief for '{brief_data['document_metadata']['filename']}'.\n\n"
                f"Key Questions for Counsel:\n"
                + "\n".join([f"- {q}" for q in brief_data.get("questions_for_lawyer", [])]) + "\n\n"
                f"Best regards,\n"
                f"LegalEase AI Intelligence Platform\n\n"
                f"Disclaimer: {brief_data.get('disclaimer')}"
            )
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

        else: # Default text/PDF summary
            file_path = os.path.join(export_dir, f"{export_id}.txt")
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(f"{brief_data['one_page_summary']}\n\nQuestions for Lawyer:\n")
                for q in brief_data.get("questions_for_lawyer", []):
                    f.write(f"- {q}\n")

        # Save record in DB
        await db_manager.execute_commit(
            """
            INSERT INTO exports (id, document_id, organization_id, user_id, export_format, file_path)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (export_id, document_id, organization_id, user_id, export_format, file_path)
        )

        return {
            "export_id": export_id,
            "export_format": export_format,
            "file_path": file_path,
            "download_url": f"/api/v1/exports/download/{export_id}"
        }
