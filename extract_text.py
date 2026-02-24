
import fitz
import sys

def main():
    try:
        doc = fitz.open('raw-material/yates/yates_searchable.pdf')
        text = ""
        for page in doc:
            text += f"\n--- PAGE {page.number + 1} ---\n"
            text += page.get_text()
        print(text)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
