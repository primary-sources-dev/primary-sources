import pytest
import requests
import json
import os

# Configuration for local testing
BASE_URL = "http://127.0.0.1:5000"
FEEDBACK_API = f"{BASE_URL}/api/feedback"
REVIEW_API = f"{BASE_URL}/api/review"

def is_server_running():
    try:
        requests.get(BASE_URL)
        return True
    except:
        return False

@pytest.mark.skipif(not is_server_running(), reason="Server not running at http://localhost:5000")
class TestClassifierAPI:
    """End-to-end tests for the Document Classifier APIs."""

    def test_post_feedback_valid(self):
        """Verify that valid feedback is successfully stored."""
        payload = {
            "page": 9991,
            "source": "test_document.pdf",
            "status": "correct",
            "predictedType": "FBI_302",
            "selectedType": "FBI_302",
            "selectedAgency": "FBI",
            "selectedClass": "REPORT",
            "selectedFormat": "FD-302",
            "selectedContent": ["INTERVIEW"],
            "newTypeFlag": False,
            "textSample": "Test OCR text sample for validation."
        }
        
        response = requests.post(FEEDBACK_API, json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_post_feedback_skipped_requires_reason(self):
        """Verify skipped/non-approved requires reason_code or noteType."""
        payload = {
            "page": 9992,
            "source": "test_document.pdf",
            "status": "skipped",
            "notes": "Need follow-up review"
        }
        response = requests.post(FEEDBACK_API, json=payload)
        assert response.status_code == 400
        assert "reason_code" in response.json().get("error", "")

    def test_post_feedback_skipped_with_reason(self):
        """Verify skipped status is accepted when reason is provided."""
        payload = {
            "page": 9993,
            "source": "test_document.pdf",
            "status": "skipped",
            "reason_code": "AMBIGUOUS_DOC_TYPE",
            "notes": "Mixed language on page."
        }
        response = requests.post(FEEDBACK_API, json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_get_feedback_all(self):
        """Verify that all feedback entries can be retrieved and contain our test record."""
        response = requests.get(FEEDBACK_API)
        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
        assert "summary" in data
        
        # Verify the existence of the test record we just added
        test_entries = [e for e in data["entries"] if e.get("page") == 9991]
        assert len(test_entries) > 0
        assert test_entries[0]["source"] == "test_document.pdf"
        assert test_entries[0]["textSample"] == "Test OCR text sample for validation."

    def test_post_feedback_missing_required(self):
        """Verify that missing required fields (page/status) return a 400."""
        payload = {
            "source": "broken.pdf"
            # Missing "page" and "status"
        }
        response = requests.post(FEEDBACK_API, json=payload)
        assert response.status_code == 400
        assert "error" in response.json()

    def test_get_review_data(self):
        """Verify that the review API returns classification data for a known file."""
        # Use a file we expect to be in the processed folder
        filename = "ralphleonyatesdocumentsfull_searchable.pdf"
        response = requests.get(f"{REVIEW_API}/{filename}")
        
        if response.status_code == 200:
            data = response.json()
            # The API returns a dict with 'pages' list, not a raw list
            assert "pages" in data
            pages = data["pages"]
            assert isinstance(pages, list)
            if len(pages) > 0:
                # Per-page payload supports classifier fields (doc_type + confidence baseline)
                assert "doc_type" in pages[0]
                assert "confidence" in pages[0]
        else:
            # If the file doesn't exist yet, we expect a 404 or similar
            assert response.status_code in [404, 500]

    def test_feedback_deduplication(self):
        """Verify that posting feedback for the same page updates the record instead of creating a duplicate."""
        source = "dedupe_test.pdf"
        page = 777
        
        # 1. Post initial feedback (correct)
        p1 = {"page": page, "source": source, "status": "correct", "selectedClass": "REPORT"}
        requests.post(FEEDBACK_API, json=p1)
        
        # 2. Post updated feedback (incorrect)
        p2 = {
            "page": page,
            "source": source,
            "status": "incorrect",
            "selectedClass": "MEMO",
            "reason_code": "AMBIGUOUS_DOC_TYPE"
        }
        requests.post(FEEDBACK_API, json=p2)
        
        # 3. Verify only one record exists for this source/page in the latest list
        response = requests.get(FEEDBACK_API)
        entries = [e for e in response.json()["entries"] if e.get("source") == source and e.get("page") == page]
        assert len(entries) == 1
        assert entries[0]["status"] == "incorrect"
        assert entries[0]["selectedClass"] == "MEMO"

    def test_feedback_get_includes_skipped_summary_key(self):
        """Verify summary now includes skipped bucket for current workflow."""
        response = requests.get(FEEDBACK_API)
        assert response.status_code == 200
        summary = response.json().get("summary", {})
        assert "skipped" in summary

if __name__ == "__main__":
    pytest.main([__file__])
