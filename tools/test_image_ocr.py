
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Add project roots to path
TOOLS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(TOOLS_DIR, "tools", "ocr-gui"))

try:
    from ocr_worker import OCRWorker
except ImportError:
    print("Error: Could not import OCRWorker. Ensure paths are correct.")
    sys.exit(1)

def create_test_image(text, filename):
    """Create a simple image with text for OCR testing."""
    img = Image.new('RGB', (400, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    # Use default font since we don't know what's on the system
    d.text((10, 40), text, fill=(0, 0, 0))
    img.save(filename)
    print(f"Created test image: {filename}")
    return os.path.abspath(filename)

def test_formats():
    test_dir = os.path.join(TOOLS_DIR, "temp_tests")
    os.makedirs(test_dir, exist_ok=True)
    
    output_dir = os.path.join(test_dir, "output")
    os.makedirs(output_dir, exist_ok=True)
    
    formats = [
        ("OCR TEST JPG", "test_jpg.jpg"),
        ("OCR TEST PNG", "test_png.png"),
        ("OCR TEST TIFF", "test_tiff.tiff")
    ]
    
    worker = OCRWorker(
        backend="python", # Use python backend for local test reliability
        output_dir=output_dir,
        output_pdf=False,
        output_txt=True,
        output_md=True
    )
    
    success_count = 0
    
    for text, filename in formats:
        filepath = os.path.join(test_dir, filename)
        abs_path = create_test_image(text, filepath)
        
        print(f"\n--- Testing Format: {filename.split('.')[-1].upper()} ---")
        
        def on_complete(success, msg):
            nonlocal success_count
            if success:
                print(f"✓ Success: {msg}")
                # Verify files exist
                base = os.path.splitext(filename)[0]
                txt_path = os.path.join(output_dir, f"{base}.txt")
                md_path = os.path.join(output_dir, f"{base}.md")
                
                if os.path.exists(txt_path) and os.path.exists(md_path):
                    print(f"✓ Output files verified: {txt_path}, {md_path}")
                    success_count += 1
                else:
                    print(f"✗ Output files missing!")
            else:
                print(f"✗ Failed: {msg}")

        worker.process_file(abs_path, on_complete=on_complete)
        
    print(f"\nSummary: {success_count}/{len(formats)} formats passed.")
    if success_count == len(formats):
        print("RESULT: ALL FORMATS ACCEPTED AND PROCESSED SUCCESSFULLY.")
    else:
        print("RESULT: TEST FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    test_formats()
