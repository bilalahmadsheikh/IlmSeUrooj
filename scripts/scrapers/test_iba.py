import requests
from bs4 import BeautifulSoup

url = 'https://admissions.iba.edu.pk/admission-schedule-fall2026.php'
# Or 'https://admissions.iba.edu.pk/admission-schedule.php'
headers = {'User-Agent': 'Mozilla/5.0'}
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.content, 'html.parser')

print(soup.get_text()[:2000])
