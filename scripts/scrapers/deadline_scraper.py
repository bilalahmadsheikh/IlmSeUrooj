import os
import re
import math
import logging
from datetime import datetime
from dateutil import parser as date_parser
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

def parse_date(date_str):
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

def extract_iba():
    url = "https://admissions.iba.edu.pk/admission-schedule-fall2026.php"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        r = requests.get(url, headers=headers, timeout=10)
        r.raise_for_status()
        
        # Simple extraction using regex on HTML text
        soup = BeautifulSoup(r.content, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)
        
        # Determine closest valid dates for deadline and test
        deadline_patterns = [
            r'(?:last\s*date\s*of\s*submission|application\s*deadline).*?(\w+\s+\d{1,2},?\s*\d{4})',
            r'(?:last\s*date).*?(\w+\s+\d{1,2},?\s*\d{4})'
        ]
        test_patterns = [
            r'(?:aptitude\s*test).*?(\w+\s+\d{1,2},?\s*\d{4})'
        ]
        
        deadline, test_date = None, None
        for p in deadline_patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m:
                d = parse_date(m.group(1))
                if d:
                    deadline = d
                    break
                    
        for p in test_patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m:
                d = parse_date(m.group(1))
                if d:
                    test_date = d
                    break
        
        return {'deadline': deadline, 'testDate': test_date, 'method': 'static', 'url': url}
    except Exception as e:
        logger.warning(f"   ⚠️  IBA Exception: {str(e)[:60]}")
        return None

def _parse_generic_text(text, url, test_keyword=""):
    deadline_patterns = [
        r'(?:last\s*date\s*(?:of|for|to)\s*(?:submission|application|registration|apply))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})',
        r'(?:application|submission|registration)\s*deadline[:\s]*(\w+\s+\d{1,2},?\s*\d{4})',
        r'(?:apply\s*(?:before|by|until))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})',
        r'(?:last\s*date)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})',
        r'(?:last\s*date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})',
        r'(?:deadline)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})',
        r'(?:closing\s*date)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})'
    ]
    
    test_patterns = []
    if test_keyword:
        test_patterns.append(rf'(?:{test_keyword})[^\.]{{0,80}}?(\w+\s+\d{{1,2}},?\s*\d{{4}})')
    test_patterns.extend([
        r'(?:entry\s*test|admission\s*test|test\s*date|exam\s*date|ECAT)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})',
        r'(?:test\s*(?:will\s*be\s*)?(?:held|conducted|scheduled)\s*(?:on)?)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})'
    ])
    
    deadline, test_date = None, None
    for p in deadline_patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            d = parse_date(m.group(1))
            if d:
                deadline = d
                break
                
    for p in test_patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            d = parse_date(m.group(1))
            if d:
                test_date = d
                break
    
    if deadline or test_date:
        return {'deadline': deadline, 'testDate': test_date, 'method': 'playwright', 'url': url}
    return None

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

def extract_nust(page):
    url = "https://ugadmissions.nust.edu.pk/"
    html = fetch_with_playwright(page, url, 'table', timeout=10000)
    if not html: return None
    soup = BeautifulSoup(html, 'html.parser')
    
    # User requested: under heading "NET will be conducted as per (Tentative) schedule mentioned below:"
    target_heading = soup.find(lambda t: t.name in ['h2','h3','h4','p','strong'] and 'NET will be conducted' in t.text)
    text = ""
    if target_heading:
        table = target_heading.find_next('table')
        if table:
            text = table.get_text(separator=' ', strip=True)
    if not text:
        text = soup.get_text(separator=' ', strip=True) # fallback

    return _parse_generic_text(text, url, 'NET')

def extract_uet_lahore(page):
    url = "https://admission.uet.edu.pk"
    html = fetch_with_playwright(page, url, 'body', timeout=10000)
    if not html: return None
    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text(separator=' ', strip=True)
    return _parse_generic_text(text, url, 'ECAT')

def extract_uet_taxila(page):
    url = "https://admissions.uettaxila.edu.pk/Schedule.php"
    html = fetch_with_playwright(page, url, 'table', timeout=10000)
    if not html: return None
    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text(separator=' ', strip=True)
    return _parse_generic_text(text, url)

def extract_giki(page):
    url = "https://giki.edu.pk/admissions/admissions-undergraduates/"
    html = fetch_with_playwright(page, url, 'body', timeout=10000)
    if not html: return None
    soup = BeautifulSoup(html, 'html.parser')
    
    # User requested: under title "IMPORTANT DATES:"
    target_heading = soup.find(lambda t: t.name in ['h2','h3','h4','h5','strong','span'] and 'IMPORTANT DATES' in t.text.upper())
    text = ""
    if target_heading:
        content_div = target_heading.find_parent('div') or target_heading.find_next('table') or target_heading.find_next('ul')
        if content_div:
            text = content_div.get_text(separator=' ', strip=True)
    if not text:
        text = soup.get_text(separator=' ', strip=True) # fallback
        
    return _parse_generic_text(text, url)

def main():
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

    # Parse upcomingDeadlines
    array_match = re.search(r'export\s+const\s+upcomingDeadlines\s*=\s*\[([\s\S]*?)\];', file_content)
    if not array_match:
        logger.error('❌ Could not find upcomingDeadlines in universities.js')
        return

    entries = []
    # Similar extraction to javascript: find id, university, shortName
    entry_regex = r'\{\s*id:\s*(\d+),\s*university:\s*"([^"]+)",\s*shortName:\s*"([^"]+)"[\s\S]*?\}'
    for match in re.finditer(entry_regex, array_match.group(1)):
        entries.append({
            'id': int(match.group(1)),
            'university': match.group(2),
            'shortName': match.group(3),
            'fullMatch': match.group(0),
        })

    report['totalEntries'] = len(entries)
    logger.info(f"\n📋 Python Deadline Verification Scraper")
    logger.info(f"{'='*50}")
    logger.info(f"Date: {today_str}")
    logger.info(f"Entries: {len(entries)}\n")

    sources = {
        'IBA': {'extractor': lambda p: extract_iba(), 'sharedKey': None},
        'NUST': {'extractor': extract_nust, 'sharedKey': 'NUST'},
        'UET Lahore': {'extractor': extract_uet_lahore, 'sharedKey': 'UET Lahore'},
        'UET Taxila': {'extractor': extract_uet_taxila, 'sharedKey': 'UET Taxila'},
        'GIKI': {'extractor': extract_giki, 'sharedKey': 'GIKI'},
        # Handle FAST like JS did
        'FAST Isb': {'extractor': lambda p: extract_with_playwright_generic(p, ['https://nu.edu.pk/Admissions', 'https://nu.edu.pk'], 'FAST|NU'), 'sharedKey': 'FAST'},
        'FAST Lhr': {'extractor': lambda p: extract_with_playwright_generic(p, ['https://nu.edu.pk/Admissions', 'https://nu.edu.pk'], 'FAST|NU'), 'sharedKey': 'FAST'},
        'FAST Khi': {'extractor': lambda p: extract_with_playwright_generic(p, ['https://nu.edu.pk/Admissions', 'https://nu.edu.pk'], 'FAST|NU'), 'sharedKey': 'FAST'},
        'FAST Psh': {'extractor': lambda p: extract_with_playwright_generic(p, ['https://nu.edu.pk/Admissions', 'https://nu.edu.pk'], 'FAST|NU'), 'sharedKey': 'FAST'},
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
                
                if scraped_date_obj < today:
                    logger.info(f"   ⏭️  Skipping deadline {scraped_data['deadline']} (already passed)")
                else:
                    if current_match and current_match.group(1) != scraped_data['deadline']:
                        report['changes'].append({
                            'shortName': entry['shortName'],
                            'field': 'deadline',
                            'old': current_match.group(1),
                            'new': scraped_data['deadline']
                        })
                        entry_text = re.sub(r'deadline:\s*"[^"]+"', f'deadline: "{scraped_data["deadline"]}"', entry_text)
                        logger.info(f"   📝 Deadline changed: {current_match.group(1)} -> {scraped_data['deadline']}")

            # Update testDate if scraped
            if scraped_data['testDate']:
                current_match = re.search(r'testDate:\s*"([^"]+)"', entry_text)
                scraped_date_obj = datetime.strptime(scraped_data['testDate'], "%Y-%m-%d")
                
                if scraped_date_obj < today:
                    logger.info(f"   ⏭️  Skipping test date {scraped_data['testDate']} (already passed)")
                else:
                    if current_match and current_match.group(1) != scraped_data['testDate']:
                        report['changes'].append({
                            'shortName': entry['shortName'],
                            'field': 'testDate',
                            'old': current_match.group(1),
                            'new': scraped_data['testDate']
                        })
                        entry_text = re.sub(r'testDate:\s*"[^"]+"', f'testDate: "{scraped_data["testDate"]}"', entry_text)
                        logger.info(f"   📝 Test date changed: {current_match.group(1)} -> {scraped_data['testDate']}")

            # Replace block in file content
            if entry_text != entry['fullMatch']:
                file_content = file_content.replace(entry['fullMatch'], entry_text)

        browser.close()

    # Save universities.js
    with open(uni_file_path, 'w', encoding='utf-8') as f:
        f.write(file_content)

    # Save report
    logger.info(f"\n{'='*50}")
    logger.info(f"📋 Verification Complete")
    logger.info(f"   Universities scraped: {report['universitiesScraped']}")
    logger.info(f"   Timestamps updated: {report['timestampsUpdated']}")
    logger.info(f"   Date changes: len({report['changes']})")
    
    # Optional markdown report writing logic can go here (similar to JS)
    
if __name__ == '__main__':
    main()
