import sys
with open('src/data/universities.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    '"https://habib.edu.pk/apply"': '"https://habib.edu.pk/admissions/international-examination-board/admission-schedule/"',
    '"https://habib.edu.pk/admissions"': '"https://habib.edu.pk/admissions/international-examination-board/admission-schedule/"',
    '"https://aku.edu.pk/admissions"': '"https://www.aku.edu/admissions/key-dates/Pages/home.aspx"',
    '"https://aku.edu/admissions"': '"https://www.aku.edu/admissions/key-dates/Pages/home.aspx"',
    '"https://neduet.edu.pk/admissions"': '"https://www.neduet.edu.pk/sites/default/files/Admissions-2025/ADMISSION_SCHEDULE_2025.pdf"',
    '"https://admissions.comsats.edu.pk"': '"https://admissions.comsats.edu.pk/Home/Keydates"',
    '"https://bahria.edu.pk/admissions"': '"https://www.bahria.edu.pk/page/PageTemplate4?pageContentId=5546&WebsiteID=1"',
    '"https://pieas.edu.pk/admissions"': '"https://admissions.pieas.edu.pk/Admissions/schedule.html"',
    '"https://au.edu.pk/admissions"': '"https://webdata.au.edu.pk/Pages/Admission/admission_schedule.aspx"'
}

for old, new in replacements.items():
    content = content.replace(f'applyUrl: {old}', f'applyUrl: {new}')

with open('src/data/universities.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated universities.js URLs successfully.")
