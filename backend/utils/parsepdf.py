import fitz

def parse_pdf(file) -> str:

    print("Parsing PDF file...")

    try:
        doc = fitz.open(stream=file.read(), filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        print("Extracted resume: ", text)
        return text
    except Exception as e:
        return str(e)
