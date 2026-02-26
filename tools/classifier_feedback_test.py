import sys
import os
from pathlib import Path

# Add ocr-gui to path
sys.path.insert(0, str(Path(__file__).parent / "ocr-gui"))

from document_classifier import classify_document, get_agency, DocType

def test_enhancements():
    print("=" * 60)
    print("CLASSIFIER ENHANCEMENT TEST")
    print("=" * 60)

    # 1. Test FBI_TELETYPE
    teletype_text = "COMMUNICATIONS SECTION\nURGENT\nPRECEDENCE: IMMEDIATE\nDE DL\nBT\nUNCLAS\nTELETYPE"
    result = classify_document(teletype_text)
    print(f"Test 1 (Teletype): {result.doc_type}")
    assert result.doc_type == DocType.FBI_TELETYPE
    print(f"  → Agency: {get_agency(result.doc_type)}")
    assert get_agency(result.doc_type) == "FBI"

    # 2. Test Continuity (FBI_302)
    # Page 1: High confidence 302
    p1_text = "FEDERAL BUREAU OF INVESTIGATION\nFD-302\nDate of transcription 11/24/63"
    r1 = classify_document(p1_text)
    print(f"Test 2 (Page 1): {r1.doc_type} (Conf: {r1.confidence:.2f})")
    assert r1.doc_type == DocType.FBI_302

    # Page 2: Ambiguous text (would normally be HANDWRITTEN_NOTES or UNKNOWN)
    # This sample has low character count and common words
    p2_text = "The subject stated he was in Dallas on the day of the assassination. He denies any involvement."
    r2_no_state = classify_document(p2_text)
    print(f"Test 3 (Page 2, No State): {r2_no_state.doc_type} (Conf: {r2_no_state.confidence:.2f})")
    
    r2_with_state = classify_document(p2_text, prev_type="FBI_302")
    print(f"Test 4 (Page 2, With State 'FBI_302'): {r2_with_state.doc_type} (Conf: {r2_with_state.confidence:.2f})")
    assert r2_with_state.doc_type == DocType.FBI_302
    assert any("CONTINUITY_FROM" in p for p in r2_with_state.matched_patterns)

    # 3. Test Agency Mapping
    print("\nTest 5 (Agency Mapping):")
    test_types = [DocType.FBI_302, DocType.CIA_CABLE, DocType.DPD_REPORT, DocType.WC_TESTIMONY, DocType.NARA_RIF]
    for t in test_types:
        agency = get_agency(t)
        print(f"  {t.value:<15} -> {agency}")
        assert agency != "UNKNOWN"

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED")
    print("=" * 60)

if __name__ == "__main__":
    test_enhancements()
