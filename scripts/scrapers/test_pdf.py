import requests
import io
import PyPDF2

url = "https://www.neduet.edu.pk/sites/default/files/Admissions-2025/ADMISSION_SCHEDULE_2025.pdf"

try:
    r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, verify=False, timeout=10)
    pdf_file = io.BytesIO(r.content)
    reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
        
    print(f"Extracted Text:\n{text[:2000]}")
except Exception as e:
    print(f"Error: {e}")
