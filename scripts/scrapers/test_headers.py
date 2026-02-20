import requests
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

urls = {
    "FAST": "https://nu.edu.pk/Admissions/Schedule",
    "LUMS": "https://admission.lums.edu.pk/critical-dates-all-programmes",
    "Habib": "https://habib.edu.pk/admissions/international-examination-board/admission-schedule/",
    "AKU": "https://www.aku.edu/admissions/key-dates/Pages/home.aspx",
    "PIEAS": "https://admissions.pieas.edu.pk/Admissions/schedule.html",
    "Bahria": "https://www.bahria.edu.pk/page/PageTemplate4?pageContentId=5546&WebsiteID=1",
    "COMSATS": "https://admissions.comsats.edu.pk/Home/Keydates",
    "ITU": "https://itu.edu.pk/admissions/",
    "NED": "https://www.neduet.edu.pk/sites/default/files/Admissions-2025/ADMISSION_SCHEDULE_2025.pdf",
    "Air": "https://webdata.au.edu.pk/Pages/Admission/admission_schedule.aspx",
    "SZABIST": "https://szabist.edu.pk/admission-schedule"
}

for name, url in urls.items():
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5, verify=False)
        soup = BeautifulSoup(r.content, 'html.parser')
        
        # very basic attempt to find headings
        headings = soup.find_all(['h1', 'h2', 'h3', 'h4'])
        found = [h.text.strip() for h in headings if any(word in h.text.lower() for word in ['date', 'schedule', 'deadline', 'important'])]
        
        print(f"--- {name} ---")
        print(f"Status: {r.status_code}")
        print(f"Potential Headings: {found[:5]}")
    except Exception as e:
        print(f"--- {name} ---")
        print(f"Error: {e}")
