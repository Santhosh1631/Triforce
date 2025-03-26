import fitz  # PyMuPDF
pdf_path = "templates/Resume.pdf"
doc = fitz.open(pdf_path)
full_text = ""
for page in doc:
    full_text += page.get_text() + "\n"
print(full_text)  # Display extracted text
