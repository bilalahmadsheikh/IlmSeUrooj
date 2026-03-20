import os
import re
import math
import logging
from datetime import datetime
from dateutil import parser as date_parser
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import io
import PyPDF2

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

def parse_date(date_str):
    # Reject month-only strings like "Jun 2026" or "Apr 2026" — no specific day.
    # dateutil(fuzzy=True) would fill in today's day number, producing a wrong date.
    # \b\d{1,2}\b matches standalone 1-2 digit numbers (days) but not 4-digit years.
    if not re.search(r'\b\d{1,2}\b', date_str):
        return None
    try:
        # Handle formats like "July 04, 2026", "21 Jan 2026", "01/21/2026"
        dt = date_parser.parse(date_str, fuzzy=True)
        return dt.strftime('%Y-%m-%d')
    except Exception:
        return None

def fetch_with_playwright(page, url, wait_selector, timeout=5000):
    try:
        page.goto(url, timeout=timeout, wait_until="domcontentloaded")
        if wait_selector:
            page.wait_for_selector(wait_selector, timeout=timeout)
        # Give a little extra time for dynamic frameworks to settle
        page.wait_for_timeout(1000)
        return page.content()
    except PlaywrightTimeoutError:
        logger.warning(f"   ⚠️  Playwright timeout for {url}")
        return page.content() # Return whatever loaded
    except Exception as e:
        logger.warning(f"   ⚠️  Playwright error for {url}: {str(e)[:60]}")
        return None

def extract_iba(page):
    """Extract UG-only per-program testSeries from IBA admission schedule tables.

    The IBA page has two tables (Round-1, Round-2), each with columns for every
    program.  Row 2 (Level) has 'Undergraduate'/'Graduate' per column — we only
    keep Undergraduate columns.  Each unique (deadline, testDate) pair becomes
    one testSeries entry so that rounds and schools with different dates are
    shown separately.
    """
    url = "https://admissions.iba.edu.pk/admission-schedule-fall2026.php"
    html = fetch_with_playwright(page, url, 'table', timeout=15000)
    if not html:
        return None
    soup = BeautifulSoup(html, 'html.parser')

    def expand_row(row):
        """Return cell texts with colspan expansion so column indices align."""
        result = []
        for cell in row.find_all(['td', 'th']):
            t = cell.get_text(separator=' ', strip=True).replace('\xa0', ' ').strip()
            result.extend([t] * int(cell.get('colspan', 1)))
        return result

    all_series = []
    seen_keys = set()

    for table in soup.find_all('table'):
        rows_exp = [expand_row(r) for r in table.find_all('tr')]
        if len(rows_exp) < 5:
            continue

        def find_row(label_re):
            for r in rows_exp:
                if r and re.search(label_re, r[0], re.IGNORECASE):
                    return r
            return None

        level_row    = find_row(r'^\s*level\s*$')
        program_row  = find_row(r'^\s*programs?\s*$')
        deadline_row = find_row(r'form\s+submission\s+deadline')
        test_row     = find_row(r'aptitude\s+test\s+date')

        if not all([level_row, deadline_row, test_row]):
            continue

        for col in range(1, len(deadline_row)):
            level = level_row[col] if col < len(level_row) else ''
            if 'undergraduate' not in level.lower():
                continue

            prog = re.sub(r'\s+', ' ', program_row[col]).strip() if program_row and col < len(program_row) else ''
            d_text = deadline_row[col] if col < len(deadline_row) else ''
            t_text = test_row[col] if col < len(test_row) else ''

            d_dates = _extract_dates_from_text(d_text)
            t_dates = _extract_dates_from_text(t_text)
            deadline  = d_dates[0] if d_dates else None
            test_date = t_dates[0] if t_dates else None

            if not deadline:
                continue
            key = (deadline, test_date)
            if key in seen_keys:
                continue
            seen_keys.add(key)

            # Build a short label: use first acronym-like token or first word
            acronyms = re.findall(r'\b(BS\w*|BBA|MBA|MS\w*|BSACF|BSBA|BSECO|BSEM|BSEDS|BSSS)\b', prog)
            prog_short = acronyms[0] if acronyms else prog.split(',')[0].strip()[:20]

            all_series.append({'series': prog_short, 'deadline': deadline, 'testDate': test_date})

    if not all_series:
        return None

    all_series.sort(key=lambda s: s['deadline'] or '9999-99-99')
    today_str = datetime.today().strftime('%Y-%m-%d')
    upcoming = [s for s in all_series if (s.get('deadline') or '') >= today_str]
    next_s = upcoming[0] if upcoming else all_series[-1]

    return {
        'testSeries': all_series,
        'deadline':   next_s.get('deadline'),
        'testDate':   next_s.get('testDate'),
        'method': 'playwright/iba-table',
        'url': url,
    }

def _parse_generic_text(text, url, test_keyword=""):
    """Extract next upcoming deadline and test date from free-form page text.

    Uses context markers (keyword → 300-char window) + _extract_dates_from_text,
    then picks the earliest future date.  This handles day-of-week prefixes
    ("Tuesday, April 15, 2026"), non-breaking spaces, and multiple rounds.
    """
    today_str = datetime.today().strftime('%Y-%m-%d')
    # Normalize non-breaking and zero-width spaces
    text = text.replace('\xa0', ' ').replace('\u200b', '')

    def first_upcoming_in(section):
        dates = _extract_dates_from_text(section)
        upcoming = [d for d in sorted(dates) if d >= today_str]
        return upcoming[0] if upcoming else None

    # --- DEADLINE ---
    DEADLINE_MARKERS = [
        r'last\s+date\s+(?:of|for|to)\s+(?:submission|application|registration|apply)',
        r'form\s+submission\s+deadline',
        r'(?:application|submission|registration)\s+deadline',
        r'apply\s+(?:before|by|until)',
        r'closing\s+date',
        r'deadline\s+to\s+(?:apply|submit|upload|take)',
        r'submission\s+of\s+admissions?\s+application',  # Habib style
        r'last\s+date',
        r'deadline',
    ]
    deadline = None
    for marker in DEADLINE_MARKERS:
        for m in re.finditer(marker, text, re.IGNORECASE):
            d = first_upcoming_in(text[m.start():m.start() + 300])
            if d:
                deadline = d
                break
        if deadline:
            break

    # --- TEST DATE ---
    TEST_MARKERS = []
    if test_keyword:
        TEST_MARKERS.append(test_keyword)
    TEST_MARKERS.extend([
        r'aptitude\s+test',
        r'entry\s+test',
        r'admission\s+test',
        r'entrance\s+exam(?:ination)?',  # Habib University Entrance Examinations
        r'written\s+test',
        r'test\s+date',
        r'exam\s+date',
        r'ECAT',
        r'w\.e\.f',
    ])
    test_date = None
    for marker in TEST_MARKERS:
        for m in re.finditer(marker, text, re.IGNORECASE):
            d = first_upcoming_in(text[m.start():m.start() + 300])
            if d:
                test_date = d
                break
        if test_date:
            break

    if not (deadline or test_date):
        return None

    session_str = None
    spring_fall = re.search(r'(Spring|Fall)\s*(20\d{2})', text, re.IGNORECASE)
    if spring_fall:
        session_str = f"{spring_fall.group(1).capitalize()} {spring_fall.group(2)}"
    round_m = re.search(r'(Round|Phase|Series)\s*(\d+|[IVX]+)', text, re.IGNORECASE)
    if round_m:
        r_str = f"{round_m.group(1).capitalize()} {round_m.group(2)}"
        session_str = f"{session_str} - {r_str}" if session_str else r_str

    return {'deadline': deadline, 'testDate': test_date, 'session': session_str, 'method': 'playwright/pdf', 'url': url}

def extract_with_playwright_generic(page, urls, test_keyword=""):
    for url in urls:
        html = fetch_with_playwright(page, url, 'body', timeout=10000)
        if not html:
            continue
        soup = BeautifulSoup(html, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)
        res = _parse_generic_text(text, url, test_keyword)
        if res: return res
    return None

def _extract_dates_from_text(text):
    """Extract all parseable dates from a text string, return sorted list of YYYY-MM-DD strings.

    Handles ranges like '31 Jan - 15 Feb 2026' where the first date has no year.
    Strategy: find the year in the string, then back-fill it onto partial dates.
    """
    found = []

    # Normalize ordinal suffixes: "31 st March" → "31 March", "08 th September" → "08 September"
    text = re.sub(r'\b(\d+)\s*(?:st|nd|rd|th)\b', r'\1', text, flags=re.IGNORECASE)

    # Step 1a: "DD Mon - DD Mon YYYY" (e.g. "31 Jan - 15 Feb 2026")
    RANGE_RE = r'(\d{1,2})\s+(\w+)\s*[-–]\s*(\d{1,2})\s+(\w+)\s+(\d{4})'
    for m in re.finditer(RANGE_RE, text, re.IGNORECASE):
        year = m.group(5)
        d1 = parse_date(f"{m.group(1)} {m.group(2)} {year}")
        d2 = parse_date(f"{m.group(3)} {m.group(4)} {year}")
        for d in [d1, d2]:
            if d and d not in found:
                found.append(d)

    # Step 1b: "Mon DD - DD, YYYY" (e.g. "July 6 – 10, 2026")
    RANGE_RE2 = r'([A-Za-z]+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2}),?\s+(\d{4})'
    for m in re.finditer(RANGE_RE2, text, re.IGNORECASE):
        month = m.group(1); year = m.group(4)
        for day in [m.group(2), m.group(3)]:
            d = parse_date(f"{month} {day} {year}")
            if d and d not in found:
                found.append(d)

    # Step 1c: "DD-DD Month YYYY" (e.g. "6-08 April, 2026" → Apr 6 and Apr 8)
    RANGE_RE3 = r'(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})'
    for m in re.finditer(RANGE_RE3, text, re.IGNORECASE):
        month = m.group(3); year = m.group(4)
        for day in [m.group(1), m.group(2)]:
            d = parse_date(f"{day} {month} {year}")
            if d and d not in found:
                found.append(d)

    # Step 1d: "D, D, ..., D Month YYYY" (e.g. "27, 28, 29 January, 2026" → Jan 27)
    # Captures the FIRST day in a comma-separated list before a month name + year.
    MULTI_DAY_RE = r'(\d{1,2})(?:,\s*\d{1,2})*\s+([A-Za-z]+),?\s+(\d{4})'
    for m in re.finditer(MULTI_DAY_RE, text, re.IGNORECASE):
        d = parse_date(f"{m.group(1)} {m.group(2)} {m.group(3)}")
        if d and d not in found:
            found.append(d)

    # Step 2: standard standalone date patterns
    # Includes DD-Mon-YYYY (e.g. "15-Mar-2026" used by GIKI)
    DATE_RE = (
        r'(\d{1,2}\s+\w+,?\s*\d{4}'        # 15 Mar 2026 / 15 March, 2026
        r'|\w+\s+\d{1,2},?\s*\d{4}'         # March 15, 2026 / March 15 2026
        r'|\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*-\d{4}'  # 15-Mar-2026
        r'|\d{1,2}[-/]\d{1,2}[-/]\d{4}'     # 15/03/2026 or 15-03-2026
        r'|\w+\s+\d{4})'                     # March 2026 (month-only, rejected by parse_date)
    )
    for raw in re.findall(DATE_RE, text, re.IGNORECASE):
        d = parse_date(raw.strip())
        if d and d not in found:
            found.append(d)

    return sorted(found)

# Maps digits/words to canonical roman-numeral series label
_SERIES_NUM_MAP = {'1': 'I', '2': 'II', '3': 'III', '4': 'IV',
                   'i': 'I', 'ii': 'II', 'iii': 'III', 'iv': 'IV',
                   'one': 'I', 'two': 'II', 'three': 'III', 'four': 'IV'}

def extract_nust(page):
    """Extract all NET series (I–IV) from NUST admissions portal.

    The NUST portal table looks like:
      | Series - 1 | 05 Oct - 25 Nov 2025 | 22 Nov - 10 Dec 2025 | ... |
      | Series - 2 | 14 Dec 2025 - 01 Feb 2026 | 31 Jan - 15 Feb 2026 | ... |
    Column 0 = series label, Column 1 = online registration dates (range),
    Column 2+ = test dates by city (Islamabad, Karachi, Quetta, Gilgit).
    We take the LAST date from col 1 as registration deadline and the
    FIRST date from col 2 (Islamabad) as test date.
    """
    url = "https://ugadmissions.nust.edu.pk/"
    html = fetch_with_playwright(page, url, 'table', timeout=15000)
    if not html:
        return None
    soup = BeautifulSoup(html, 'html.parser')

    all_series = []

    for table in soup.find_all('table'):
        for row in table.find_all('tr'):
            cells = [c.get_text(separator=' ', strip=True) for c in row.find_all(['td', 'th'])]
            if len(cells) < 2:
                continue

            # Check first cell for a series identifier: "Series - 1", "Series-2", "Series 3", "Series I" etc.
            series_match = re.search(
                r'series\s*[-–]?\s*([1-4]|i{1,3}v?|iv)',
                cells[0], re.IGNORECASE
            )
            if not series_match:
                continue

            key = series_match.group(1).strip().lower()
            series_label = f"Series {_SERIES_NUM_MAP.get(key, key.upper())}"

            # Column 1 = registration date range → take the LAST date as deadline
            reg_dates = _extract_dates_from_text(cells[1]) if len(cells) > 1 else []
            deadline = reg_dates[-1] if reg_dates else None  # end of registration window

            # Column 2 = Islamabad test dates → take the FIRST date as test date
            test_dates = _extract_dates_from_text(cells[2]) if len(cells) > 2 else []
            # Fall back to any remaining city column if Islamabad column is empty/month-only
            if not test_dates:
                for cell in cells[3:]:
                    test_dates = _extract_dates_from_text(cell)
                    if test_dates:
                        break
            test_date = test_dates[0] if test_dates else None

            if not any(s['series'] == series_label for s in all_series):
                all_series.append({'series': series_label, 'deadline': deadline, 'testDate': test_date})

    if all_series:
        all_series.sort(key=lambda s: s['deadline'] or '9999-99-99')
        today_str = datetime.today().strftime('%Y-%m-%d')
        upcoming = [s for s in all_series if (s['deadline'] or '') >= today_str]
        next_series = upcoming[0] if upcoming else all_series[-1]
        logger.info(f"   📅 NET series found: {[s['series'] for s in all_series]}")
        return {
            'testSeries': all_series,
            'deadline': next_series.get('deadline'),
            'testDate': next_series.get('testDate'),
            'method': 'playwright/series-table',
            'url': url,
        }

    # Fallback: generic single-date extraction from full page text
    logger.warning(f"   ⚠️  No series table found, falling back to generic text extraction")
    target_heading = soup.find(lambda t: t.name in ['h2', 'h3', 'h4', 'p', 'strong']
                               and 'NET will be conducted' in t.text)
    text = (target_heading.find_next('table').get_text(separator=' ', strip=True)
            if target_heading and target_heading.find_next('table')
            else soup.get_text(separator=' ', strip=True))
    return _parse_generic_text(text, url, 'NET')

def extract_uet_lahore(page):
    """Extract ECAT (UET Lahore) Fall admission dates.

    The ECAT portal (ecat.uet.edu.pk) has the most up-to-date schedule:
    application deadline, exam dates, and result date.  Fall back to the
    main admission page if the portal is unavailable.
    """
    ecat_url = "https://ecat.uet.edu.pk"
    html = fetch_with_playwright(page, ecat_url, 'body', timeout=15000)
    if html:
        soup = BeautifulSoup(html, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)
        # "appear in exam" is just before the exam dates in the ECAT portal layout
        result = _parse_generic_text(text, ecat_url, r'appear\s+in\s+exam|appear\s+for.*exam|exam\s+date')
        if result and (result.get('deadline') or result.get('testDate')):
            return result

    # Fallback: main admission page
    url = "https://admission.uet.edu.pk"
    html = fetch_with_playwright(page, url, 'body', timeout=10000)
    if not html: return None
    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text(separator=' ', strip=True)
    return _parse_generic_text(text, url, 'ECAT')

def extract_uet_taxila(page):
    """Extract UET Taxila admission deadline from their schedule table.

    Table format: Sr# | Event | Date | Time
    Target row: "Last date of Online Submission of Admission Forms"
    (other rows like "Last Date of Depositing Dues..." are intentionally skipped)

    UET Taxila does not publish ECAT test dates on this page — students take
    ECAT via UET system.  testDate is left as None so the stored value is kept.
    """
    url = "https://admissions.uettaxila.edu.pk/Schedule.php"
    html = fetch_with_playwright(page, url, 'table', timeout=10000)
    if not html:
        return None
    soup = BeautifulSoup(html, 'html.parser')

    deadline = None

    # Walk every table looking for the schedule — row structure: Sr# | Event | Date | Time
    for table in soup.find_all('table'):
        for row in table.find_all('tr'):
            cells = row.find_all(['td', 'th'])
            if len(cells) < 3:
                continue
            event_text = cells[1].get_text(separator=' ', strip=True)
            date_text  = cells[2].get_text(separator=' ', strip=True)

            # Only match the application submission deadline row, not merit list / dues rows
            if re.search(
                r'last\s+date\s+of\s+online\s+submission'
                r'|online\s+submission\s+of\s+admission\s+forms',
                event_text, re.IGNORECASE
            ):
                dates = _extract_dates_from_text(date_text)
                if dates:
                    deadline = dates[0]
                    break
        if deadline:
            break

    # Fallback: generic parse with a tight keyword so we still avoid merit-list rows
    if not deadline:
        text = soup.get_text(separator=' ', strip=True)
        result = _parse_generic_text(
            text, url,
            test_keyword=r'ECAT|entry\s+test|aptitude\s+test'
        )
        if result:
            # Override deadline with only the submission-deadline match to avoid
            # picking up "Last Date of Depositing Dues"
            for m in re.finditer(
                r'online\s+submission\s+of\s+admission|last\s+date\s+of\s+online',
                text, re.IGNORECASE
            ):
                dates = _extract_dates_from_text(text[m.start():m.start() + 200])
                if dates:
                    result['deadline'] = dates[0]
                    break
            return result

    if not deadline:
        return None

    return {
        'deadline': deadline,
        'testDate': None,  # ECAT date not on this page; kept from stored value
        'method': 'playwright/uet-taxila-table',
        'url': url,
    }

def extract_giki(page):
    url = "https://giki.edu.pk/admissions/admissions-undergraduates/"
    html = fetch_with_playwright(page, url, 'body', timeout=10000)
    if not html: return None
    soup = BeautifulSoup(html, 'html.parser')
    # Get full page text — GIKI puts "IMPORTANT DATES:" inline in a paragraph,
    # not in a heading tag, so heading-tag search is unreliable.
    text = soup.get_text(separator=' ', strip=True)
    return _parse_generic_text(text, url)

def extract_fast(page):
    url = "https://nu.edu.pk/Admissions/Schedule"
    html = fetch_with_playwright(page, url, 'table', timeout=15000)
    if not html: return None
    soup = BeautifulSoup(html, 'html.parser')
    
    text = ""
    for table in soup.find_all('table'):
        headers = [th.get_text(separator=' ', strip=True) for th in table.find_all(['th', 'td']) if th.name == 'th' or th.find('strong')]
        if not headers and table.find('tr'):
            headers = [td.get_text(separator=' ', strip=True) for td in table.find('tr').find_all(['th', 'td'])]

        for row in table.find_all('tr'):
            cells = row.find_all(['th', 'td'])
            for i, cell in enumerate(cells):
                header_prefix = headers[i] if i < len(headers) else ""
                text += f" {header_prefix} {cell.get_text(separator=' ', strip=True)}"
                
    if not text:
        text = soup.get_text(separator=' ', strip=True)
    return _parse_generic_text(text, url, 'FAST|NU')

def extract_lums(page):
    """Extract UG application deadline, LCAT test date, and SAT/ACT deadlines from LUMS critical dates page.

    LUMS critical dates page has:
    - UG Online Application Deadline: January 27, 2026
    - LUMS Common Admission Test (LCAT): February 15, 2026
    - Deadline to take SAT: March 14, 2026
    - Deadline to take ACT: April 11, 2026
    """
    url = "https://admission.lums.edu.pk/critical-dates-all-programmes"
    html = fetch_with_playwright(page, url, 'body', timeout=20000)
    if not html:
        return None
    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text(separator=' ', strip=True).replace('\xa0', ' ').replace('\u200b', '')

    def all_dates_after(keyword, window=300):
        dates = []
        for m in re.finditer(keyword, text, re.IGNORECASE):
            dates.extend(_extract_dates_from_text(text[m.start():m.start() + window]))
        return sorted(set(dates))

    # UG application deadline — take first date regardless of whether it's past
    ug_dates = all_dates_after(r'UG\s+Online\s+Application\s+Deadline')
    ug_deadline = ug_dates[0] if ug_dates else None

    # LCAT test date — take first date
    lcat_dates = all_dates_after(r'LUMS\s+Common\s+Admission\s+Test|LCAT')
    lcat_date = lcat_dates[0] if lcat_dates else None

    # SAT deadline — take first date
    sat_dates = all_dates_after(r'Deadline\s+to\s+take\s+SAT|to\s+take\s+SAT')
    sat_date = sat_dates[0] if sat_dates else None

    # ACT deadline — take first date
    act_dates = all_dates_after(r'Deadline\s+to\s+take\s+ACT|to\s+take\s+ACT')
    act_date = act_dates[0] if act_dates else None

    if not (ug_deadline or lcat_date):
        return None

    # Build testSeries for LCAT, SAT, ACT
    test_series = []
    if lcat_date:
        test_series.append({'series': 'LCAT', 'deadline': None, 'testDate': lcat_date})
    if sat_date:
        test_series.append({'series': 'SAT', 'deadline': None, 'testDate': sat_date})
    if act_date:
        test_series.append({'series': 'ACT', 'deadline': None, 'testDate': act_date})

    result = {'deadline': ug_deadline, 'testDate': lcat_date, 'method': 'playwright/lums-ug', 'url': url}
    if test_series:
        result['testSeries'] = test_series
    return result

def extract_habib(page):
    """Extract Habib University multi-series admission schedule.

    Table structure (columns = series, rows = events):
      Header row:  "Important Steps" | "For October Series Test-takers" | "For November..." | …
      Deadline row: "Submission of Admissions Application"  → per-series application deadline
      Test row:     "Habib University Entrance Examinations" → per-series test date (first date if multi-day)

    Builds testSeries[] with one entry per column, e.g.:
      [{ series: "Oct", deadline: "2025-10-21", testDate: "2025-10-28" }, …]

    The top-level deadline/testDate are taken from the next upcoming series so the
    scraper's skip logic works correctly.
    """
    url = "https://habib.edu.pk/admissions/international-examination-board/admission-schedule/"
    html = fetch_with_playwright(page, url, 'body', timeout=10000)
    if not html:
        return None
    soup = BeautifulSoup(html, 'html.parser')

    MONTH_MAP = {
        'january': 'Jan', 'february': 'Feb', 'march': 'Mar', 'april': 'Apr',
        'may': 'May', 'june': 'Jun', 'july': 'Jul', 'august': 'Aug',
        'september': 'Sep', 'october': 'Oct', 'november': 'Nov', 'december': 'Dec',
    }

    test_series = []

    for table in soup.find_all('table'):
        rows = [r for r in table.find_all('tr') if r.find_all(['td', 'th'])]
        if len(rows) < 3:
            continue

        # Locate the header row — it mentions "Series" or "Test-takers"
        header_row = None
        for row in rows[:4]:
            texts = [c.get_text(' ', strip=True) for c in row.find_all(['td', 'th'])]
            if any(re.search(r'series|test.takers', t, re.IGNORECASE) for t in texts):
                header_row = row
                break
        if not header_row:
            continue

        # Extract one series name per column (skip column 0 = row-label column)
        series_names = []
        for cell in header_row.find_all(['td', 'th'])[1:]:
            cell_text = cell.get_text(' ', strip=True)
            m = re.search(
                r'\b(january|february|march|april|may|june|july|august'
                r'|september|october|november|december)\b',
                cell_text, re.IGNORECASE
            )
            series_names.append(MONTH_MAP[m.group(1).lower()] if m else cell_text[:10].strip())

        if not series_names:
            continue

        # Per-series buckets
        deadlines = [None] * len(series_names)
        test_dates = [None] * len(series_names)

        for row in rows:
            if row is header_row:
                continue
            cells = row.find_all(['td', 'th'])
            if not cells:
                continue
            row_label = cells[0].get_text(' ', strip=True)

            is_deadline = bool(re.search(
                r'submission\s+of\s+admissions?\s+application', row_label, re.IGNORECASE
            ))
            is_test = bool(re.search(
                r'habib\s+university\s+entrance\s+exam(?:ination)?', row_label, re.IGNORECASE
            ))
            if not (is_deadline or is_test):
                continue

            for i, cell in enumerate(cells[1:]):
                if i >= len(series_names):
                    break
                dates = _extract_dates_from_text(cell.get_text(' ', strip=True))
                if not dates:
                    continue
                if is_deadline and deadlines[i] is None:
                    deadlines[i] = dates[0]   # earliest date in cell
                elif is_test and test_dates[i] is None:
                    test_dates[i] = dates[0]  # first day of the test window

        # Build testSeries — include every series that has at least one date
        found = []
        for i, name in enumerate(series_names):
            if deadlines[i] or test_dates[i]:
                found.append({
                    'series': name,
                    'deadline': deadlines[i],
                    'testDate': test_dates[i],
                })
        if found:
            test_series = found
            break  # Correct table found; stop searching

    if not test_series:
        # Fallback if page structure changed
        text = soup.get_text(separator=' ', strip=True)
        return _parse_generic_text(text, url, r'habib.*entrance\s+exam|entrance\s+exam(?:ination)?')

    # Pick next upcoming series for the top-level deadline/testDate fields
    today_str = datetime.today().strftime('%Y-%m-%d')
    upcoming = [
        s for s in test_series
        if max(s.get('deadline') or '', s.get('testDate') or '') >= today_str
    ]
    next_s = upcoming[0] if upcoming else test_series[-1]

    return {
        'deadline': next_s.get('deadline'),
        'testDate': next_s.get('testDate'),
        'testSeries': test_series,
        'method': 'playwright/habib-table',
        'url': url,
    }

def extract_aku(page):
    """Extract Pakistan-only undergraduate programs from AKU key dates page.

    The AKU page is structured as country → level → program blocks.
    We find the Pakistan > Undergraduate section and parse each program block
    (Application Acceptance + Admission Test) into separate testSeries entries.
    """
    url = "https://www.aku.edu/admissions/key-dates/Pages/home.aspx"
    html = fetch_with_playwright(page, url, 'body', timeout=15000)
    if not html:
        return None
    soup = BeautifulSoup(html, 'html.parser')
    raw = soup.get_text(separator='\n', strip=True).replace('\xa0', ' ').replace('\u200b', '')
    lines = [l.strip() for l in raw.split('\n') if l.strip()]

    # Markers that indicate we've left Pakistan → stop parsing
    FOREIGN_MARKERS = ['East Africa', 'Afghanistan', 'Kenya', 'Uganda', 'Tanzania',
                       'Global Institute', 'MBChB', 'Post-RN']

    # Find the Pakistan Undergraduate section start
    pk_ug_start = None
    for i, line in enumerate(lines):
        if line == 'Undergraduate':
            # confirm we're in the Pakistan block (no foreign marker in preceding 30 lines)
            ctx = ' '.join(lines[max(0, i - 30):i])
            if not any(m in ctx for m in FOREIGN_MARKERS):
                pk_ug_start = i
                break

    if pk_ug_start is None:
        return _parse_generic_text(raw.replace('\n', ' '), url, 'AKU Admission Test')

    # Find end of Pakistan UG section (next foreign country or graduate section)
    pk_ug_end = len(lines)
    for i in range(pk_ug_start + 1, len(lines)):
        if any(m in lines[i] for m in FOREIGN_MARKERS):
            pk_ug_end = i
            break

    pk_lines = lines[pk_ug_start:pk_ug_end]
    today_str = datetime.today().strftime('%Y-%m-%d')
    all_series = []

    # Lines that signal we've gone back into a previous program block
    DATE_LINE_RE = re.compile(
        r'^\s*(?:[A-Za-z]+\s+\d{4}'           # "January 2027" / "August 2026"
        r'|[A-Za-z]+\s+\d{1,2},?\s+\d{4}'    # "March 8, 2026"
        r'|\d{1,2}\s+[A-Za-z]+\s+\d{4}'      # "8 March 2026"
        r'|.*\d{4}\s*[-–]\s*.*\d{4})',        # any date range "X 2026 - Y 2026"
        re.IGNORECASE)
    BACK_STOP = ['Application Acceptance', 'Admission Cycle', 'Undergraduate',
                 'Admission Test', 'AKU Admission Test', 'Interviews',
                 'Class Commencement', 'Admission Offers']
    FACULTY_RE = re.compile(r'^(Faculty|Institute|School|Department|Centre)\s+(of|for)\b', re.IGNORECASE)

    def shorten_program(name):
        """Build a short readable label from a full degree name without parenthetical acronym."""
        m = re.match(r'Bachelor\s+of\s+Education\b', name, re.IGNORECASE)
        if m: return 'BEd'
        m = re.match(r'Bachelor\s+of\s+(?:Science|Studies)\s+in\s+(.+)', name, re.IGNORECASE)
        if m: return ('BSc ' + m.group(1))[:25]
        m = re.match(r'Bachelor\s+of\s+(.+)', name, re.IGNORECASE)
        if m: return ('B' + m.group(1))[:25]
        m = re.match(r'Associate\s+of\s+Science\s+in\s+(.+)', name, re.IGNORECASE)
        if m: return ('ASc ' + m.group(1))[:25]
        return name[:25]

    i = 0
    while i < len(pk_lines):
        if 'Application Acceptance' in pk_lines[i]:
            # Acceptance date range is always the very next line — use just 2 lines
            # (more would bleed into Admission Test dates which follow immediately after)
            app_text = ' '.join(pk_lines[i:min(i + 2, len(pk_lines))])
            app_dates = _extract_dates_from_text(app_text)
            deadline = app_dates[-1] if app_dates else None  # last day of range

            # Program name: look back — stop at date lines, section boundaries,
            # or any marker from the previous program block.
            prog_lines = []
            j = i - 1
            while j >= 0 and len(prog_lines) < 6:
                l = pk_lines[j]
                if any(m in l for m in BACK_STOP):
                    break
                if DATE_LINE_RE.match(l):
                    break
                if FACULTY_RE.match(l):
                    j -= 1
                    continue  # skip faculty/institute labels
                if l and not any(x in l for x in ['Pakistan', 'Graduate', ':']):
                    prog_lines.insert(0, l)
                j -= 1

            # Prefer parenthetical acronyms; fall back to degree shortener
            acronyms = re.findall(r'\(([A-Z][^)]{0,15})\)', ' '.join(prog_lines))
            if acronyms:
                prog_short = ' / '.join(acronyms[:3])
            elif prog_lines:
                prog_short = shorten_program(prog_lines[-1])
            else:
                prog_short = 'AKU UG'

            # Admission Test: look ahead
            test_date = None
            for k in range(i + 1, min(i + 12, len(pk_lines))):
                if 'Admission Test' in pk_lines[k] or 'AKU Admission Test' in pk_lines[k]:
                    test_text = ' '.join(pk_lines[k:min(k + 4, len(pk_lines))])
                    t_dates = _extract_dates_from_text(test_text)
                    test_date = t_dates[0] if t_dates else None
                    break

            if deadline or test_date:
                all_series.append({
                    'series': prog_short.strip() or 'AKU UG',
                    'deadline': deadline,
                    'testDate': test_date,
                })
        i += 1

    if not all_series:
        return _parse_generic_text(raw.replace('\n', ' '), url, 'AKU Admission Test')

    all_series.sort(key=lambda s: s.get('deadline') or s.get('testDate') or '9999-99-99')
    upcoming = [s for s in all_series if (s.get('deadline') or '') >= today_str]
    next_s = upcoming[0] if upcoming else all_series[-1]

    return {
        'testSeries': all_series,
        'deadline':   next_s.get('deadline'),
        'testDate':   next_s.get('testDate'),
        'method': 'playwright/aku-pk-ug',
        'url': url,
    }

def extract_pieas(page):
    """Extract all 3 PIEAS BS Written Test rounds as testSeries.

    PIEAS has First/Second/Third Written Test for undergrad, each with its own
    'Last date to Apply' deadline.  We only parse the BS section (before MS).
    """
    url = "https://admissions.pieas.edu.pk/Admissions/schedule.html"
    html = fetch_with_playwright(page, url, 'body', timeout=10000)
    if not html:
        return None
    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text(separator=' ', strip=True).replace('\xa0', ' ')
    today_str = datetime.today().strftime('%Y-%m-%d')

    def first_upcoming_or_any(section):
        dates = _extract_dates_from_text(section)
        upcoming = [d for d in sorted(dates) if d >= today_str]
        return upcoming[0] if upcoming else (sorted(dates)[0] if dates else None)

    # Use full text — ordinal-specific patterns distinguish UG from MS/MPhil tests.
    # "First Written Test for Undergraduate" is UG-specific (MS section says "Written Test for MS").
    ORDINALS = ['first', 'second', 'third', 'fourth']
    ROMAN    = ['I', 'II', 'III', 'IV']
    all_series = []

    for idx, ordinal in enumerate(ORDINALS):
        # Test date: "First Written Test for Undergraduate Admissions April 12, 2026"
        test_m = re.search(
            rf'{ordinal}\s+Written\s+Test\s+for\s+Undergraduate.{{0,250}}',
            text, re.IGNORECASE
        )
        test_date = first_upcoming_or_any(test_m.group(0)) if test_m else None

        # Deadline: "Last date to Apply for First Test" (NOT "(with Late Fee)" variant)
        dl_m = re.search(
            rf'Last\s+date\s+to\s+Apply\s+for\s+{ordinal}\s+Test(?!\s*\(with)',
            text, re.IGNORECASE
        )
        deadline = first_upcoming_or_any(text[dl_m.start():dl_m.start() + 300]) if dl_m else None

        if test_date or deadline:
            all_series.append({'series': f'Test {ROMAN[idx]}', 'deadline': deadline, 'testDate': test_date})

    if not all_series:
        return _parse_generic_text(text, url)

    all_series.sort(key=lambda s: s.get('deadline') or s.get('testDate') or '9999-99-99')
    upcoming = [s for s in all_series if (s.get('deadline') or s.get('testDate') or '') >= today_str]
    next_s = upcoming[0] if upcoming else all_series[-1]

    return {
        'testSeries': all_series,
        'deadline':   next_s.get('deadline'),
        'testDate':   next_s.get('testDate'),
        'method': 'playwright/pieas-tests',
        'url': url,
    }

def extract_bahria(page):
    url = "https://www.bahria.edu.pk/page/PageTemplate4?pageContentId=5546&WebsiteID=1"
    html = fetch_with_playwright(page, url, 'body', timeout=10000)
    if not html: return None
    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text(separator=' ', strip=True)
    return _parse_generic_text(text, url)

def extract_comsats(page, campus="Islamabad"):
    url = "https://admissions.comsats.edu.pk/Home/Keydates"
    html = fetch_with_playwright(page, url, 'table', timeout=10000)
    if not html: return None
    soup = BeautifulSoup(html, 'html.parser')
    
    text = ""
    for table in soup.find_all('table'):
        headers = [th.get_text(separator=' ', strip=True) for th in table.find_all(['th', 'td']) if th.name == 'th' or th.find('strong')]
        if not headers and table.find('tr'):
            headers = [td.get_text(separator=' ', strip=True) for td in table.find('tr').find_all(['th', 'td'])]

        for row in table.find_all('tr'):
            if campus.lower() in row.get_text(separator=' ', strip=True).lower():
                cells = row.find_all(['th', 'td'])
                for i, cell in enumerate(cells):
                    header_prefix = headers[i] if i < len(headers) else ""
                    text += f" {header_prefix} {cell.get_text(separator=' ', strip=True)}"
    
    if not text:
        text = soup.get_text(separator=' ', strip=True)
    return _parse_generic_text(text, url, 'NTS')

def extract_itu(page):
    url = "https://itu.edu.pk/admissions/"
    html = fetch_with_playwright(page, url, 'body', timeout=10000)
    if not html: return None
    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text(separator=' ', strip=True)
    return _parse_generic_text(text, url)

def extract_ned_pdf():
    """Try 2026 PDF first, then 2025 as fallback, returning only upcoming dates."""
    year = datetime.today().year
    # Try current year first, then fall back to previous year
    for y in [year, year - 1]:
        url = f"https://www.neduet.edu.pk/sites/default/files/Admissions-{y}/ADMISSION_SCHEDULE_{y}.pdf"
        try:
            r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, verify=False, timeout=15)
            r.raise_for_status()
            pdf_file = io.BytesIO(r.content)
            reader = PyPDF2.PdfReader(pdf_file)
            text = " ".join([p.extract_text() for p in reader.pages])
            result = _parse_generic_text(text, url, 'NED')
            if result:
                return result
        except Exception:
            pass
    return None

def extract_air(_page):
    """Air University: schedule page redirects to homepage — use homepage directly.

    The webdata.au.edu.pk/Pages/Admission/admission_schedule.aspx redirects to
    the main www.au.edu.pk site.  Use requests (faster than Playwright for this
    static page) to grab the homepage which has admission announcements.
    """
    url = "https://www.au.edu.pk"
    try:
        import urllib3; urllib3.disable_warnings()
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, verify=False, timeout=15)
        r.raise_for_status()
        r.encoding = 'utf-8'
        soup = BeautifulSoup(r.text, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)
        return _parse_generic_text(text, url, r'admission.*test|entry.*test|ECAT|last.*date.*admission')
    except Exception as e:
        logger.warning(f"   ⚠️  Air University request failed: {str(e)[:60]}")
        return None

def extract_szabist(page):
    """Extract SZABIST multi-session/multi-round admission schedule.

    Page contains multiple titled sections, each with a two-column table (EVENTS | DATES):
      "Admission Schedule Fall 2026 For All Programs (Round 1)"
      "Admission Schedule Spring 2026"
      "Admission Schedule Spring 2026 For CertHE and LLB programs."

    Strategy:
      1. Find every NavigableString that contains "Admission Schedule" — each is a heading.
      2. From that heading, find the next <table> in document order.
      3. In the table, extract "Form Submission Deadline" → deadline
                                "Test Dates"              → testDate (first date if range)
      4. Build testSeries[] sorted by deadline; top-level fields = next upcoming series.
    """
    url = "https://szabist.edu.pk/admission-schedule"
    html = fetch_with_playwright(page, url, 'body', timeout=20000)
    if not html:
        return None
    soup = BeautifulSoup(html, 'html.parser')

    def _series_label(text):
        """Convert heading text → short label e.g. 'Fall 2026 R1', 'Spring 2026 LLB'."""
        m = re.search(r'(Fall|Spring|Summer|Winter)\s+(\d{4})', text, re.IGNORECASE)
        if not m:
            return text[:20].strip()
        label = f"{m.group(1).capitalize()} {m.group(2)}"
        round_m = re.search(r'[Rr]ound\s*(\d+)', text)
        if round_m:
            label += f" R{round_m.group(1)}"
        if re.search(r'CertHE|LLB', text, re.IGNORECASE):
            label += " LLB"
        return label

    def _parse_schedule_table(table):
        """Return (deadline, testDate) from a SZABIST schedule table."""
        deadline = test_date = None
        for row in table.find_all('tr'):
            cells = row.find_all(['td', 'th'])
            if len(cells) < 2:
                continue
            event = cells[0].get_text(' ', strip=True)
            date_text = cells[1].get_text(' ', strip=True)
            if re.search(r'form\s+submission\s+deadline|submission\s+deadline', event, re.IGNORECASE):
                dates = _extract_dates_from_text(date_text)
                if dates and not deadline:
                    deadline = dates[0]
            elif re.search(r'\btest\s+dates?\b', event, re.IGNORECASE):
                dates = _extract_dates_from_text(date_text)
                if dates and not test_date:
                    test_date = dates[0]
        return deadline, test_date

    test_series = []
    seen_tables = set()

    # Find every "Admission Schedule ..." string node in the document
    for node in soup.find_all(string=re.compile(r'Admission\s+Schedule', re.IGNORECASE)):
        parent = node.parent
        heading_text = parent.get_text(' ', strip=True)
        # Skip if this node is inside a table cell (not a real heading)
        if parent.find_parent('table'):
            continue
        table = parent.find_next('table')
        if table is None or id(table) in seen_tables:
            continue
        seen_tables.add(id(table))
        deadline, test_date = _parse_schedule_table(table)
        if deadline or test_date:
            test_series.append({
                'series':   _series_label(heading_text),
                'deadline': deadline,
                'testDate': test_date,
            })

    if not test_series:
        # Fallback: generic parse if page structure changed
        text = soup.get_text(separator=' ', strip=True)
        return _parse_generic_text(text, url)

    # Sort by deadline so series are in chronological order
    test_series.sort(key=lambda s: s.get('deadline') or s.get('testDate') or '9999-99-99')

    # Top-level fields = next upcoming series (or last if all past)
    today_str = datetime.today().strftime('%Y-%m-%d')
    upcoming = [
        s for s in test_series
        if max(s.get('deadline') or '', s.get('testDate') or '') >= today_str
    ]
    next_s = upcoming[0] if upcoming else test_series[-1]

    return {
        'deadline':   next_s.get('deadline'),
        'testDate':   next_s.get('testDate'),
        'testSeries': test_series,
        'method': 'playwright/szabist-multi',
        'url': url,
    }

import argparse

def main():
    parser = argparse.ArgumentParser(description="Deadline Scraper")
    parser.add_argument('--uni', type=str, help="Filter by university shortName")
    args = parser.parse_args()
    filter_uni = args.uni.lower() if args.uni else None
    
    today = datetime.now()
    today_str = today.strftime('%Y-%m-%d')
    report = {
        'totalEntries': 0,
        'universitiesScraped': 0,
        'datesExtracted': 0,
        'timestampsUpdated': 0,
        'changes': [],
        'errors': [],
        'skipped': [],
        'methods': {}
    }

    uni_file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'universities.js')
    
    with open(uni_file_path, 'r', encoding='utf-8') as f:
        file_content = f.read()

    # Parse the universities array directly (upcomingDeadlines is now dynamically built)
    uni_array_match = re.search(r'export\s+const\s+universities\s*=\s*\[([\s\S]*?)\];\s*\n', file_content)
    if not uni_array_match:
        logger.error('❌ Could not find universities array in universities.js')
        return

    entries = []
    # Each university entry: { id: N, name: "...", shortName: "...", ... admissions: { ... } }
    # We match the full university object up to the closing brace+comma pattern
    entry_regex = r'\{\s*id:\s*(\d+),\s*name:\s*"([^"]+)",\s*shortName:\s*"([^"]+)"[\s\S]*?(?=\n  \},|\n\])'
    for match in re.finditer(entry_regex, uni_array_match.group(1)):
        entries.append({
            'id': int(match.group(1)),
            'university': match.group(2),
            'shortName': match.group(3),
            'fullMatch': match.group(0),
        })

    if filter_uni:
        entries = [e for e in entries if filter_uni in e['shortName'].lower()]

    report['totalEntries'] = len(entries)
    logger.info(f"\n📋 Python Deadline Verification Scraper")
    logger.info(f"{'='*50}")
    logger.info(f"Date: {today_str}")
    logger.info(f"Entries: {len(entries)}\n")

    sources = {
        'IBA': {'extractor': extract_iba, 'sharedKey': None},
        'NUST': {'extractor': extract_nust, 'sharedKey': 'NUST'},
        'UET Lahore': {'extractor': extract_uet_lahore, 'sharedKey': 'UET Lahore'},
        'UET Taxila': {'extractor': extract_uet_taxila, 'sharedKey': 'UET Taxila'},
        'GIKI': {'extractor': extract_giki, 'sharedKey': 'GIKI'},
        'FAST Isb': {'extractor': extract_fast, 'sharedKey': 'FAST'},
        'FAST Lhr': {'extractor': extract_fast, 'sharedKey': 'FAST'},
        'FAST Khi': {'extractor': extract_fast, 'sharedKey': 'FAST'},
        'FAST Psh': {'extractor': extract_fast, 'sharedKey': 'FAST'},
        'LUMS': {'extractor': extract_lums, 'sharedKey': None},
        'Habib': {'extractor': extract_habib, 'sharedKey': None},
        'AKU': {'extractor': extract_aku, 'sharedKey': None},
        'PIEAS': {'extractor': extract_pieas, 'sharedKey': None},
        'Bahria Isb': {'extractor': extract_bahria, 'sharedKey': 'Bahria'},
        'Bahria Lhr': {'extractor': extract_bahria, 'sharedKey': 'Bahria'},
        'COMSATS Isb': {'extractor': lambda p: extract_comsats(p, "Islamabad"), 'sharedKey': 'COMSATS_Islamabad'},
        'COMSATS Lhr': {'extractor': lambda p: extract_comsats(p, "Lahore"), 'sharedKey': 'COMSATS_Lahore'},
        'COMSATS Wah': {'extractor': lambda p: extract_comsats(p, "Wah"), 'sharedKey': 'COMSATS_Wah'},
        'COMSATS Abbottabad': {'extractor': lambda p: extract_comsats(p, "Abbottabad"), 'sharedKey': 'COMSATS_Abbottabad'},
        'ITU': {'extractor': extract_itu, 'sharedKey': None},
        'NED': {'extractor': lambda p: extract_ned_pdf(), 'sharedKey': None},
        'Air': {'extractor': extract_air, 'sharedKey': None},
        'SZABIST': {'extractor': extract_szabist, 'sharedKey': None},
    }

    shared_cache = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'])
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        page = context.new_page()
        page.set_default_timeout(10000)

        for entry in entries:
            source = sources.get(entry['shortName'])
            if not source:
                logger.info(f"⚠️  {entry['shortName']}: No extractor configured, skipping")
                report['skipped'].append(entry['shortName'])
                continue

            cache_key = source['sharedKey'] or entry['shortName']
            scraped_data = shared_cache.get(cache_key)

            if not scraped_data:
                logger.info(f"🔍 {entry['shortName']}: Scraping...")
                try:
                    extractor_func = source['extractor']
                    result = extractor_func(page)
                    
                    if result:
                        scraped_data = result
                        report['universitiesScraped'] += 1
                        logger.info(f"   ✅ Method: {result['method']} | URL: {result['url']}")
                        if result.get('deadline'):
                            logger.info(f"   📅 Deadline: {result['deadline']}")
                            report['datesExtracted'] += 1
                        if result.get('testDate'):
                            logger.info(f"   📝 Test Date: {result['testDate']}")
                            report['datesExtracted'] += 1
                        report['methods'][cache_key] = result['method']
                    else:
                        scraped_data = {'deadline': None, 'testDate': None}
                        logger.warning(f"   ⚠️  No dates extracted")
                        report['errors'].append({'shortName': entry['shortName'], 'error': 'No dates found'})
                except Exception as e:
                    scraped_data = {'deadline': None, 'testDate': None}
                    logger.error(f"   ❌ Error: {str(e)[:80]}")
                    report['errors'].append({'shortName': entry['shortName'], 'error': str(e)[:80]})
                
                shared_cache[cache_key] = scraped_data
            else:
                logger.info(f"♻️  {entry['shortName']}: Using cached data from {cache_key}")

            # Update entry logic
            entry_text = entry['fullMatch']
            has_verified_dates = bool(scraped_data['deadline'] or scraped_data['testDate'])
            
            if has_verified_dates:
                if 'lastVerified:' in entry_text:
                    entry_text = re.sub(r'lastVerified:\s*"[^"]*"', f'lastVerified: "{today_str}"', entry_text)
                else:
                    entry_text = re.sub(r'(\s*applyUrl:\s*"[^"]*")\s*\}', rf'\1,\n    lastVerified: "{today_str}"\n  }}', entry_text)
                report['timestampsUpdated'] += 1

            # Update deadline if scraped
            if scraped_data['deadline']:
                current_match = re.search(r'deadline:\s*"([^"]+)"', entry_text)
                scraped_date_obj = datetime.strptime(scraped_data['deadline'], "%Y-%m-%d")
                current_deadline = current_match.group(1) if current_match else None
                current_date_obj = datetime.strptime(current_deadline, "%Y-%m-%d") if current_deadline else None
                current_deadline_is_future = current_date_obj is not None and current_date_obj >= today
                if scraped_date_obj < today and current_deadline_is_future:
                    logger.info(f"   ⏭️  Keeping future deadline {current_deadline} (scraped {scraped_data['deadline']} is past)")
                elif current_match and current_deadline != scraped_data['deadline']:
                    report['changes'].append({
                        'shortName': entry['shortName'],
                        'field': 'deadline',
                        'old': current_deadline,
                        'new': scraped_data['deadline']
                    })
                    entry_text = re.sub(r'deadline:\s*"[^"]+"', f'deadline: "{scraped_data["deadline"]}"', entry_text)
                    logger.info(f"   📝 Deadline changed: {current_deadline} -> {scraped_data['deadline']}")

            # Update testDate if scraped
            if scraped_data.get('testDate'):
                current_match = re.search(r'testDate:\s*"([^"]+)"', entry_text)
                scraped_date_obj = datetime.strptime(scraped_data['testDate'], "%Y-%m-%d")
                current_test_date = current_match.group(1) if current_match else None
                current_date_obj = datetime.strptime(current_test_date, "%Y-%m-%d") if current_test_date else None
                current_testdate_is_future = current_date_obj is not None and current_date_obj >= today
                if scraped_date_obj < today and current_testdate_is_future:
                    logger.info(f"   ⏭️  Keeping future test date {current_test_date} (scraped {scraped_data['testDate']} is past)")
                elif current_match and current_test_date != scraped_data['testDate']:
                    report['changes'].append({
                        'shortName': entry['shortName'],
                        'field': 'testDate',
                        'old': current_test_date,
                        'new': scraped_data['testDate']
                    })
                    entry_text = re.sub(r'testDate:\s*"[^"]+"', f'testDate: "{scraped_data["testDate"]}"', entry_text)
                    logger.info(f"   📝 Test date changed: {current_test_date} -> {scraped_data['testDate']}")

            # Update session if scraped
            if scraped_data.get('session'):
                current_match = re.search(r'session:\s*"([^"]+)"', entry_text)
                if current_match and current_match.group(1) != scraped_data['session']:
                    report['changes'].append({
                        'shortName': entry['shortName'],
                        'field': 'session',
                        'old': current_match.group(1),
                        'new': scraped_data['session']
                    })
                    entry_text = re.sub(r'session:\s*"[^"]+"', f'session: "{scraped_data["session"]}"', entry_text)
                    logger.info(f"   📝 Session updated: {current_match.group(1)} -> {scraped_data['session']}")

            # Update testSeries array if scraper returned series data (e.g. NUST NET I–IV)
            if scraped_data.get('testSeries') and len(scraped_data['testSeries']) > 0:
                series_list = scraped_data['testSeries']
                # Build the JS testSeries array literal
                series_lines = []
                for s in series_list:
                    d_val = f'"{s["deadline"]}"' if s.get('deadline') else 'null'
                    t_val = f'"{s["testDate"]}"' if s.get('testDate') else 'null'
                    series_lines.append(f'        {{ series: "{s["series"]}",   deadline: {d_val}, testDate: {t_val} }}')
                new_series_js = 'testSeries: [\n' + ',\n'.join(series_lines) + '\n      ]'

                existing_series = re.search(r'testSeries:\s*\[[\s\S]*?\]', entry_text)
                if existing_series:
                    entry_text = entry_text.replace(existing_series.group(0), new_series_js)
                else:
                    # Insert testSeries before applyUrl (works for unis that didn't have it)
                    entry_text = re.sub(
                        r'(applyUrl:\s*"[^"]+")',
                        new_series_js + ',\n      ' + r'\1',
                        entry_text, count=1
                    )
                report['changes'].append({
                    'shortName': entry['shortName'],
                    'field': 'testSeries',
                    'old': f'{len(series_list)} series updated',
                    'new': ', '.join(s["series"] for s in series_list)
                })
                report['datesExtracted'] += len(series_list)
                logger.info(f"   📅 testSeries updated: {len(series_list)} series scraped")

            # Replace block in file content
            if entry_text != entry['fullMatch']:
                file_content = file_content.replace(entry['fullMatch'], entry_text)

        browser.close()

    # ── Validation Summary ──
    total_success = report['universitiesScraped']
    total_failed = len(report['errors'])
    total_skipped = len(report['skipped'])
    total_changes = len(report['changes'])

    logger.info(f"\n{'='*50}")
    logger.info(f"📋 VERIFICATION SUMMARY")
    logger.info(f"{'='*50}")
    logger.info(f"  ✅ Universities successfully scraped: {total_success}")
    logger.info(f"  ❌ Universities failed to extract:    {total_failed}")
    logger.info(f"  ⏭️  Universities skipped (no config):  {total_skipped}")
    logger.info(f"  📅 Total dates extracted:             {report['datesExtracted']}")
    logger.info(f"  🔄 Data changes detected:             {total_changes}")
    logger.info(f"  🕐 Timestamps updated:                {report['timestampsUpdated']}")

    if total_changes > 0:
        logger.info(f"\n📝 CHANGES DETAIL:")
        for c in report['changes']:
            logger.info(f"  • {c['shortName']}: {c['field']} {c['old']} → {c['new']}")

    if total_failed > 0:
        logger.info(f"\n⚠️  FAILED EXTRACTIONS:")
        for e in report['errors']:
            logger.info(f"  • {e['shortName']}: {e['error']}")

    # ── Save or Rollback Logic ──
    # Only write the file if we actually extracted at least 1 date
    if report['datesExtracted'] > 0:
        # Update the lastScraperRun timestamp
        file_content = re.sub(
            r'export const lastScraperRun\s*=\s*"[^"]*"',
            f'export const lastScraperRun = "{today_str}"',
            file_content
        )
        with open(uni_file_path, 'w', encoding='utf-8') as f:
            f.write(file_content)
        logger.info(f"\n✅ universities.js updated with new data.")
    else:
        logger.info(f"\n⚠️  No dates extracted at all — keeping existing data untouched.")

    # ── Save JSON report ──
    import json
    reports_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'reports')
    os.makedirs(reports_dir, exist_ok=True)
    report_path = os.path.join(reports_dir, 'deadline-verification-report.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump({
            'runDate': today_str,
            'totalEntries': report['totalEntries'],
            'universitiesScraped': total_success,
            'failedExtractions': total_failed,
            'skipped': total_skipped,
            'datesExtracted': report['datesExtracted'],
            'dataChanges': total_changes,
            'timestampsUpdated': report['timestampsUpdated'],
            'changes': report['changes'],
            'errors': report['errors'],
            'methods': report['methods'],
        }, f, indent=2)
    logger.info(f"📄 Report saved to {report_path}")

    # ── Exit code for CI ──
    # Exit 0 = success (new data written or no changes needed)
    # Exit 1 = total failure (zero dates extracted, old data kept)
    if report['datesExtracted'] == 0:
        logger.error("\n❌ PIPELINE FAILED: Zero dates extracted from any university.")
        exit(1)
    
if __name__ == '__main__':
    main()
