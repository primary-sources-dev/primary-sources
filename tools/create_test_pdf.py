import fitz

def create_sample_pdf(output_path):
    doc = fitz.open()
    for i in range(1, 4):
        page = doc.new_page()
        page.insert_text((50, 50), f"This is test page {i} for OCR processing.")
        page.insert_text((50, 100), "It contains some text to be recognized.")
    doc.save(output_path)
    doc.close()

if __name__ == "__main__":
    create_sample_pdf("test_sample.pdf")
    print("Created test_sample.pdf")
