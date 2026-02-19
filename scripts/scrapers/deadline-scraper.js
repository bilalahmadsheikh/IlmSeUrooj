/**
 * Deadline Verification Scraper v2
 * 
 * Per-university custom extractors with multi-tier fetch strategy:
 *   Tier 1: Static fetch + Cheerio (IBA, AKU, Habib, NED, PIEAS)
 *   Tier 2: Puppeteer headless browser (LUMS, COMSATS, Bahria, ITU)
 *   Tier 3: Published schedule data (NUST, FAST, UET, GIKI, Air, SZABIST)
 * 
 * Usage:
 *   node scripts/scrapers/deadline-scraper.js              # All universities
 *   node scripts/scrapers/deadline-scraper.js --uni IBA     # Single university
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// ─── Date parsing utility ───
const MONTHS = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04',
    june: '06', july: '07', august: '08', september: '09',
    october: '10', november: '11', december: '12',
};

function parseDate(str) {
    if (!str) return null;
    const cleaned = str.replace(/,/g, '').replace(/\s+/g, ' ').trim();

    // "Month DD YYYY" — e.g. "January 21, 2026"
    let m = cleaned.match(/(\w+)\s+(\d{1,2})\s+(\d{4})/);
    if (m) {
        const mon = MONTHS[m[1].toLowerCase()] || MONTHS[m[1].substring(0, 3).toLowerCase()];
        if (mon) return `${m[3]}-${mon}-${String(m[2]).padStart(2, '0')}`;
    }

    // "DD Month YYYY" — e.g. "21 January 2026"
    m = cleaned.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)\s+(\d{4})/);
    if (m) {
        const mon = MONTHS[m[2].toLowerCase()] || MONTHS[m[2].substring(0, 3).toLowerCase()];
        if (mon) return `${m[3]}-${mon}-${String(m[1]).padStart(2, '0')}`;
    }

    // "YYYY-MM-DD"
    m = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[0];

    return null;
}

// ─── Fetch with retry + realistic browser headers ───
async function fetchPage(url, retries = 2) {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    ];
    const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000);
            const res = await fetch(url, {
                headers: {
                    'User-Agent': ua,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1',
                },
                signal: controller.signal,
                redirect: 'follow',
            });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        } catch (err) {
            if (attempt === retries) throw err;
            const delay = (2000 * (attempt + 1)) + Math.random() * 1000;
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

// ─── Puppeteer fetch (for JS-rendered sites) ───
async function fetchWithPuppeteer(url, waitSelector, waitMs = 3000) {
    let browser;
    try {
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        if (waitSelector) {
            try { await page.waitForSelector(waitSelector, { timeout: 8000 }); } catch { }
        }
        await new Promise(r => setTimeout(r, waitMs));

        const html = await page.content();
        const bodyText = await page.evaluate(() => document.body.innerText);
        return { html, bodyText };
    } finally {
        if (browser) await browser.close();
    }
}

// ════════════════════════════════════════════════════
// ██ PER-UNIVERSITY EXTRACTORS
// ════════════════════════════════════════════════════

// ── IBA (Tier 1: Static) ──
async function extractIBA() {
    const currentYear = new Date().getFullYear();
    // IBA uses dynamic URL with year/semester
    const urls = [
        `https://admissions.iba.edu.pk/admission-schedule-fall${currentYear}.php`,
        `https://admissions.iba.edu.pk/admission-schedule-fall${currentYear + 1}.php`,
    ];

    for (const url of urls) {
        try {
            const html = await fetchPage(url);
            const text = cheerio.load(html)('body').text().replace(/\s+/g, ' ');

            // IBA has: "Form Submission Deadline Wednesday, January 21, 2026"
            const deadlineMatch = text.match(
                /Form\s*Submission\s*Deadline\s*\w+day,?\s*(\w+\s+\d{1,2},?\s*\d{4})/i
            );
            const testMatch = text.match(
                /Aptitude\s*Test\s*Date\s*\w+day,?\s*(\w+\s+\d{1,2},?\s*\d{4})/i
            );

            const deadline = deadlineMatch ? parseDate(deadlineMatch[1]) : null;
            const testDate = testMatch ? parseDate(testMatch[1]) : null;

            if (deadline || testDate) {
                return { deadline, testDate, url, method: 'static' };
            }
        } catch (err) {
            console.log(`   ⚠️  ${url}: ${err.message.substring(0, 60)}`);
        }
    }
    return null;
}

// ── LUMS (Tier 2: Puppeteer) ──
async function extractLUMS() {
    const urls = [
        'https://lums.edu.pk/critical-dates-all-programmes',
        'https://lums.edu.pk/undergraduate-programmes',
        'https://admissions.lums.edu.pk',
    ];

    for (const url of urls) {
        try {
            const result = await fetchWithPuppeteer(url, 'table, .field-items, .views-table', 5000);
            const text = result.bodyText;

            // LUMS patterns: "Application Deadline: January 27, 2026" or table rows
            const deadlinePatterns = [
                /(?:application|submission)\s*deadline[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date\s*(?:to\s*)?apply)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:deadline)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
            ];

            const testPatterns = [
                /(?:LCAT|LUMS\s*(?:Common|Admission)\s*(?:Admission\s*)?Test)[^.]*?(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:test\s*date|exam\s*date)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            let deadline = null, testDate = null;
            for (const p of deadlinePatterns) {
                const m = text.match(p);
                if (m) { deadline = parseDate(m[1]); if (deadline) break; }
            }
            for (const p of testPatterns) {
                const m = text.match(p);
                if (m) { testDate = parseDate(m[1]); if (testDate) break; }
            }

            if (deadline || testDate) {
                return { deadline, testDate, url, method: 'puppeteer' };
            }
        } catch (err) {
            console.log(`   ⚠️  ${url}: ${err.message.substring(0, 60)}`);
        }
    }
    return null;
}

// ── Habib (Tier 1: Static) ──
async function extractHabib() {
    const urls = [
        'https://habib.edu.pk/admissions/',
        'https://habib.edu.pk/admissions/national-examination-boards/',
        'https://habib.edu.pk/admissions/international-examination-board/',
    ];

    for (const url of urls) {
        try {
            const html = await fetchPage(url);
            const text = cheerio.load(html)('body').text().replace(/\s+/g, ' ');

            const deadlinePatterns = [
                /(?:application|submission)\s*deadline[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date\s*(?:to\s*)?apply)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:apply\s*(?:before|by))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:deadline)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:closing\s*date)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            const testPatterns = [
                /(?:Habib\s*(?:Entrance|Admission)\s*(?:Exam|Test))[^.]*?(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:test\s*date|exam\s*date)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            let deadline = null, testDate = null;
            for (const p of deadlinePatterns) {
                const m = text.match(p);
                if (m) { deadline = parseDate(m[1]); if (deadline) break; }
            }
            for (const p of testPatterns) {
                const m = text.match(p);
                if (m) { testDate = parseDate(m[1]); if (testDate) break; }
            }

            if (deadline || testDate) {
                return { deadline, testDate, url, method: 'static' };
            }
        } catch (err) {
            console.log(`   ⚠️  ${url}: ${err.message.substring(0, 60)}`);
        }
    }
    return null;
}

// ── AKU (Tier 1: Static) ──
async function extractAKU() {
    const urls = [
        'https://www.aku.edu/admissions/Pages/home.aspx',
        'https://www.aku.edu/admissions/pakistan/Pages/home.aspx',
    ];

    for (const url of urls) {
        try {
            const html = await fetchPage(url);
            const text = cheerio.load(html)('body').text().replace(/\s+/g, ' ');

            const deadlinePatterns = [
                /(?:application|submission)\s*deadline[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date\s*(?:to\s*)?apply)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:deadline)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:apply\s*(?:before|by|until))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            const testPatterns = [
                /(?:AKU\s*(?:Entry|Admission)\s*Test)[^.]*?(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:test\s*date|exam\s*date)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            let deadline = null, testDate = null;
            for (const p of deadlinePatterns) {
                const m = text.match(p);
                if (m) { deadline = parseDate(m[1]); if (deadline) break; }
            }
            for (const p of testPatterns) {
                const m = text.match(p);
                if (m) { testDate = parseDate(m[1]); if (testDate) break; }
            }

            if (deadline || testDate) {
                return { deadline, testDate, url, method: 'static' };
            }
        } catch (err) {
            console.log(`   ⚠️  ${url}: ${err.message.substring(0, 60)}`);
        }
    }
    return null;
}

// ── PIEAS (Tier 2: Puppeteer — content on anchor sections) ──
async function extractPIEAS() {
    const urls = [
        'https://www.pieas.edu.pk/admissions',
        'https://www.pieas.edu.pk/',
    ];

    for (const url of urls) {
        try {
            const result = await fetchWithPuppeteer(url, '#menu3, .admission-schedule', 4000);
            const text = result.bodyText;

            const deadlinePatterns = [
                /(?:last\s*date\s*(?:of|for|to)\s*(?:submission|application|apply))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:application\s*deadline|deadline)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
                /(?:apply\s*(?:before|by))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            const testPatterns = [
                /(?:PIEAS\s*(?:Written|Entry)\s*Test)[^.]*?(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:written\s*test\s*date|entry\s*test)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:test\s*date)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            let deadline = null, testDate = null;
            for (const p of deadlinePatterns) {
                const m = text.match(p);
                if (m) { deadline = parseDate(m[1]); if (deadline) break; }
            }
            for (const p of testPatterns) {
                const m = text.match(p);
                if (m) { testDate = parseDate(m[1]); if (testDate) break; }
            }

            if (deadline || testDate) {
                return { deadline, testDate, url, method: 'puppeteer' };
            }
        } catch (err) {
            console.log(`   ⚠️  ${url}: ${err.message.substring(0, 60)}`);
        }
    }
    return null;
}

// ── Bahria (Tier 2: Puppeteer) ──
async function extractBahria() {
    const urls = [
        'https://bahria.edu.pk/admissions/',
        'https://bahria.edu.pk/Home/AdmissionRoadmap?programType=UnderGraduate',
    ];

    for (const url of urls) {
        try {
            const result = await fetchWithPuppeteer(url, '.dates-to-remember, .admission-dates, table', 5000);
            const text = result.bodyText;

            const deadlinePatterns = [
                /(?:last\s*date\s*(?:of|for|to)\s*(?:submission|application|apply))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:application\s*deadline|deadline)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:form\s*submission)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
            ];

            const testPatterns = [
                /(?:BUET|Bahria\s*(?:Entry|CBT|Admission)\s*Test)[^.]*?(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:test\s*(?:date|on))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            let deadline = null, testDate = null;
            for (const p of deadlinePatterns) {
                const m = text.match(p);
                if (m) { deadline = parseDate(m[1]); if (deadline) break; }
            }
            for (const p of testPatterns) {
                const m = text.match(p);
                if (m) { testDate = parseDate(m[1]); if (testDate) break; }
            }

            if (deadline || testDate) {
                return { deadline, testDate, url, method: 'puppeteer' };
            }
        } catch (err) {
            console.log(`   ⚠️  ${url}: ${err.message.substring(0, 60)}`);
        }
    }
    return null;
}

// ── COMSATS (Tier 2: Puppeteer) ──
async function extractCOMSATS() {
    const urls = [
        'https://admissions.comsats.edu.pk',
        'https://www.comsats.edu.pk/Admissions.aspx',
    ];

    for (const url of urls) {
        try {
            const result = await fetchWithPuppeteer(url, '.admission-dates, table, .card', 4000);
            const text = result.bodyText;

            const deadlinePatterns = [
                /(?:last\s*date\s*(?:of|for|to)\s*(?:submission|application|apply))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:application\s*deadline|deadline)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
                /(?:apply\s*(?:before|by))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            const testPatterns = [
                /(?:NTS\s*NAT|NAT\s*Test)[^.]*?(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:test\s*date|entry\s*test)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            let deadline = null, testDate = null;
            for (const p of deadlinePatterns) {
                const m = text.match(p);
                if (m) { deadline = parseDate(m[1]); if (deadline) break; }
            }
            for (const p of testPatterns) {
                const m = text.match(p);
                if (m) { testDate = parseDate(m[1]); if (testDate) break; }
            }

            if (deadline || testDate) {
                return { deadline, testDate, url, method: 'puppeteer' };
            }
        } catch (err) {
            console.log(`   ⚠️  ${url}: ${err.message.substring(0, 60)}`);
        }
    }
    return null;
}

// ── ITU (Tier 2: Puppeteer) ──
async function extractITU() {
    const urls = [
        'https://itu.edu.pk/admissions/',
        'https://itu.edu.pk/',
    ];

    for (const url of urls) {
        try {
            const result = await fetchWithPuppeteer(url, '#admissions-calendar, table, .admission', 4000);
            const text = result.bodyText;

            const deadlinePatterns = [
                /(?:application|submission)\s*deadline[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date\s*(?:to\s*)?apply)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
                /(?:deadline)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            const testPatterns = [
                /(?:ITU\s*(?:Admission|Entry)\s*Test)[^.]*?(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:test\s*date)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            let deadline = null, testDate = null;
            for (const p of deadlinePatterns) {
                const m = text.match(p);
                if (m) { deadline = parseDate(m[1]); if (deadline) break; }
            }
            for (const p of testPatterns) {
                const m = text.match(p);
                if (m) { testDate = parseDate(m[1]); if (testDate) break; }
            }

            if (deadline || testDate) {
                return { deadline, testDate, url, method: 'puppeteer' };
            }
        } catch (err) {
            console.log(`   ⚠️  ${url}: ${err.message.substring(0, 60)}`);
        }
    }
    return null;
}

// ── NED (Tier 1/2: Static first, then Puppeteer) ──
async function extractNED() {
    const urls = [
        'https://www.neduet.edu.pk/key_admission_date',
        'https://www.neduet.edu.pk/admission',
    ];

    // Try static first
    for (const url of urls) {
        try {
            const html = await fetchPage(url);
            const text = cheerio.load(html)('body').text().replace(/\s+/g, ' ');

            const deadlinePatterns = [
                /(?:last\s*date\s*(?:of|for|to)\s*(?:submission|application|apply))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:application\s*deadline|deadline)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
            ];

            const testPatterns = [
                /(?:NED\s*(?:Entry|Admission)\s*Test)[^.]*?(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:test\s*date|entry\s*test)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            let deadline = null, testDate = null;
            for (const p of deadlinePatterns) {
                const m = text.match(p);
                if (m) { deadline = parseDate(m[1]); if (deadline) break; }
            }
            for (const p of testPatterns) {
                const m = text.match(p);
                if (m) { testDate = parseDate(m[1]); if (testDate) break; }
            }

            if (deadline || testDate) {
                return { deadline, testDate, url, method: 'static' };
            }
        } catch (err) {
            console.log(`   ⚠️  ${url}: ${err.message.substring(0, 60)}`);
        }
    }

    // Fallback to Puppeteer
    for (const url of urls) {
        try {
            const result = await fetchWithPuppeteer(url, 'table, .key-dates', 4000);
            const text = result.bodyText;

            const deadlinePatterns = [
                /(?:last\s*date\s*(?:of|for|to)\s*(?:submission|application|apply))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:application\s*deadline|deadline)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
            ];

            const testPatterns = [
                /(?:NED\s*(?:Entry|Admission)\s*Test)[^.]*?(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:test\s*date|entry\s*test)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            let deadline = null, testDate = null;
            for (const p of deadlinePatterns) {
                const m = text.match(p);
                if (m) { deadline = parseDate(m[1]); if (deadline) break; }
            }
            for (const p of testPatterns) {
                const m = text.match(p);
                if (m) { testDate = parseDate(m[1]); if (testDate) break; }
            }

            if (deadline || testDate) {
                return { deadline, testDate, url, method: 'puppeteer' };
            }
        } catch (err) {
            console.log(`   ⚠️  Puppeteer ${url}: ${err.message.substring(0, 60)}`);
        }
    }
    return null;
}

// ── Generic Puppeteer extractor (for NUST, FAST, UET, GIKI, Air, SZABIST) ──
async function extractWithPuppeteer(urls, universityName, testKeyword) {
    for (const url of urls) {
        try {
            const result = await fetchWithPuppeteer(url, 'table, .admission, .content', 5000);
            const text = result.bodyText;

            const deadlinePatterns = [
                /(?:last\s*date\s*(?:of|for|to)\s*(?:submission|application|registration|apply))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:application|submission|registration)\s*deadline[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:apply\s*(?:before|by|until))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
                /(?:deadline)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:closing\s*date)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:last\s*date\s*to\s*generate\s*(?:challan|token))[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ];

            const testPatterns = testKeyword ? [
                new RegExp(`(?:${testKeyword})[^.]{0,80}?(\\w+\\s+\\d{1,2},?\\s*\\d{4})`, 'i'),
                /(?:entry\s*test|admission\s*test|test\s*date|exam\s*date)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
                /(?:test\s*(?:will\s*be\s*)?(?:held|conducted|scheduled)\s*(?:on)?)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
            ] : [];

            let deadline = null, testDate = null;
            for (const p of deadlinePatterns) {
                const m = text.match(p);
                if (m) { deadline = parseDate(m[1]); if (deadline) break; }
            }
            for (const p of testPatterns) {
                const m = text.match(p);
                if (m) { testDate = parseDate(m[1]); if (testDate) break; }
            }

            if (deadline || testDate) {
                return { deadline, testDate, url, method: 'puppeteer' };
            }
        } catch (err) {
            console.log(`   ⚠️  ${url}: ${err.message.substring(0, 60)}`);
        }
    }
    return null;
}

// ════════════════════════════════════════════════════
// ██ UNIVERSITY CONFIGURATION
// ════════════════════════════════════════════════════

const DEADLINE_SOURCES = {
    'IBA': {
        extractor: extractIBA,
        sharedKey: null,
    },
    'LUMS': {
        extractor: extractLUMS,
        sharedKey: null,
    },
    'Habib': {
        extractor: extractHabib,
        sharedKey: null,
    },
    'AKU': {
        extractor: extractAKU,
        sharedKey: null,
    },
    'PIEAS': {
        extractor: extractPIEAS,
        sharedKey: null,
    },
    'Bahria Isb': {
        extractor: extractBahria,
        sharedKey: 'Bahria',
    },
    'Bahria Lhr': {
        extractor: extractBahria,
        sharedKey: 'Bahria',
    },

    'COMSATS Isb': {
        extractor: extractCOMSATS,
        sharedKey: 'COMSATS',
    },
    'COMSATS Lhr': {
        extractor: extractCOMSATS,
        sharedKey: 'COMSATS',
    },
    'COMSATS Wah': {
        extractor: extractCOMSATS,
        sharedKey: 'COMSATS',
    },
    'COMSATS Abbottabad': {
        extractor: extractCOMSATS,
        sharedKey: 'COMSATS',
    },
    'ITU': {
        extractor: extractITU,
        sharedKey: null,
    },
    'NED': {
        extractor: extractNED,
        sharedKey: null,
    },
    'FAST Isb': {
        extractor: () => extractWithPuppeteer(
            ['https://nu.edu.pk/Admissions', 'https://nu.edu.pk'],
            'FAST', 'FAST|NU'
        ),
        sharedKey: 'FAST',
    },
    'FAST Lhr': {
        extractor: () => extractWithPuppeteer(
            ['https://nu.edu.pk/Admissions', 'https://nu.edu.pk'],
            'FAST', 'FAST|NU'
        ),
        sharedKey: 'FAST',
    },
    'FAST Khi': {
        extractor: () => extractWithPuppeteer(
            ['https://nu.edu.pk/Admissions', 'https://nu.edu.pk'],
            'FAST', 'FAST|NU'
        ),
        sharedKey: 'FAST',
    },
    'FAST Psh': {
        extractor: () => extractWithPuppeteer(
            ['https://nu.edu.pk/Admissions', 'https://nu.edu.pk'],
            'FAST', 'FAST|NU'
        ),
        sharedKey: 'FAST',
    },
    'NUST': {
        extractor: () => extractWithPuppeteer(
            ['https://ugadmissions.nust.edu.pk', 'https://nust.edu.pk/admissions/'],
            'NUST', 'NET'
        ),
        sharedKey: null,
    },
    'UET Lahore': {
        extractor: () => extractWithPuppeteer(
            ['https://admission.uet.edu.pk', 'https://www.uet.edu.pk/'],
            'UET', 'ECAT'
        ),
        sharedKey: null,
    },
    'UET Taxila': {
        extractor: () => extractWithPuppeteer(
            ['https://admissions.uettaxila.edu.pk', 'https://www.uettaxila.edu.pk/'],
            'UET Taxila', 'ECAT'
        ),
        sharedKey: null,
    },
    'GIKI': {
        extractor: () => extractWithPuppeteer(
            ['https://giki.edu.pk/admissions/', 'https://giki.edu.pk/'],
            'GIKI', 'GIKI'
        ),
        sharedKey: null,
    },
    'Air': {
        extractor: () => extractWithPuppeteer(
            ['https://au.edu.pk/', 'https://webdata.au.edu.pk/Pages/Admission/newpages/Bachelor_programs.aspx'],
            'Air', 'Air'
        ),
        sharedKey: null,
    },
    'SZABIST': {
        extractor: () => extractWithPuppeteer(
            ['https://szabist.edu.pk/admissions/', 'https://szabist.edu.pk/'],
            'SZABIST', 'SZABIST'
        ),
        sharedKey: null,
    },
};

// ════════════════════════════════════════════════════
// ██ MAIN SCRAPER LOGIC
// ════════════════════════════════════════════════════

async function scrapeDeadlines(filterUni) {
    const today = new Date().toISOString().split('T')[0];
    const report = {
        runDate: today,
        totalEntries: 0,
        universitiesScraped: 0,
        datesExtracted: 0,
        timestampsUpdated: 0,
        changes: [],
        errors: [],
        skipped: [],
        methods: {},  // Track which method was used per university
    };

    // Read current universities.js
    const uniFilePath = path.join(__dirname, '..', '..', 'src', 'data', 'universities.js');
    let fileContent = fs.readFileSync(uniFilePath, 'utf8');

    // Parse upcomingDeadlines
    const deadlineArrayMatch = fileContent.match(/export\s+const\s+upcomingDeadlines\s*=\s*\[([\s\S]*?)\];/);
    if (!deadlineArrayMatch) {
        console.error('❌ Could not find upcomingDeadlines in universities.js');
        process.exit(1);
    }

    // Extract entries
    const entries = [];
    const entryRegex = /\{\s*id:\s*(\d+),\s*university:\s*"([^"]+)",\s*shortName:\s*"([^"]+)"[\s\S]*?\}/g;
    let entryMatch;
    while ((entryMatch = entryRegex.exec(deadlineArrayMatch[1])) !== null) {
        entries.push({
            id: parseInt(entryMatch[1]),
            university: entryMatch[2],
            shortName: entryMatch[3],
            fullMatch: entryMatch[0],
        });
    }

    // Filter if --uni flag is used
    const filteredEntries = filterUni
        ? entries.filter(e => e.shortName.toLowerCase().includes(filterUni.toLowerCase()))
        : entries;

    report.totalEntries = filteredEntries.length;
    console.log(`\n📋 Deadline Verification Scraper v2`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Date: ${today}`);
    console.log(`Entries: ${filteredEntries.length}${filterUni ? ` (filtered: "${filterUni}")` : ''}\n`);

    // Shared cache for multi-campus universities
    const sharedCache = {};

    for (const entry of filteredEntries) {
        const source = DEADLINE_SOURCES[entry.shortName];
        if (!source) {
            console.log(`⚠️  ${entry.shortName}: No extractor configured, skipping`);
            report.skipped.push(entry.shortName);
            continue;
        }

        const cacheKey = source.sharedKey || entry.shortName;
        let scrapedData = sharedCache[cacheKey];

        if (!scrapedData) {
            console.log(`🔍 ${entry.shortName}: Scraping...`);
            try {
                const result = await source.extractor();
                if (result) {
                    scrapedData = result;
                    report.universitiesScraped++;
                    console.log(`   ✅ Method: ${result.method} | URL: ${result.url || 'N/A'}`);
                    if (result.deadline) {
                        console.log(`   📅 Deadline: ${result.deadline}`);
                        report.datesExtracted++;
                    }
                    if (result.testDate) {
                        console.log(`   📝 Test Date: ${result.testDate}`);
                        report.datesExtracted++;
                    }
                    report.methods[cacheKey] = result.method;
                } else {
                    scrapedData = { deadline: null, testDate: null };
                    console.log(`   ⚠️  No dates extracted`);
                    report.errors.push({ shortName: entry.shortName, error: 'No dates found on any URL' });
                }
            } catch (err) {
                scrapedData = { deadline: null, testDate: null };
                console.log(`   ❌ Error: ${err.message.substring(0, 80)}`);
                report.errors.push({ shortName: entry.shortName, error: err.message.substring(0, 80) });
            }
            sharedCache[cacheKey] = scrapedData;
        } else {
            console.log(`♻️  ${entry.shortName}: Using cached data from ${cacheKey}`);
        }

        // Update entry
        let entryText = entry.fullMatch;
        let updated = false;

        // Only update lastVerified when dates were successfully extracted
        const hasVerifiedDates = scrapedData.deadline || scrapedData.testDate;
        if (hasVerifiedDates) {
            if (entryText.includes('lastVerified:')) {
                entryText = entryText.replace(/lastVerified:\s*"[^"]*"/, `lastVerified: "${today}"`);
            } else {
                entryText = entryText.replace(
                    /(\s*applyUrl:\s*"[^"]*")\s*\}/,
                    `$1,\n    lastVerified: "${today}"\n  }`
                );
            }
            updated = true;
            report.timestampsUpdated++;
        }

        // Update deadline if scraped and valid
        if (scrapedData.deadline) {
            const currentDeadline = entryText.match(/deadline:\s*"([^"]+)"/);
            const sessionMatch = entryText.match(/session:\s*"([^"]+)"/);
            const session = sessionMatch ? sessionMatch[1] : '';

            let isValid = true;
            const scrapedDate = new Date(scrapedData.deadline);
            const todayDate = new Date(today);

            // Reject past dates
            if (scrapedDate < todayDate) {
                isValid = false;
                console.log(`   ⏭️  Skipping deadline ${scrapedData.deadline} (already passed)`);
            }

            // For Fall sessions, reject dates too far from current
            if (isValid && session.toLowerCase().includes('fall') && currentDeadline) {
                const currentDate = new Date(currentDeadline[1]);
                const diffMonths = (currentDate - scrapedDate) / (1000 * 60 * 60 * 24 * 30);
                if (diffMonths > 3) {
                    isValid = false;
                    console.log(`   ⏭️  Skipping ${scrapedData.deadline} (likely Spring date)`);
                }
            }

            if (isValid && currentDeadline && currentDeadline[1] !== scrapedData.deadline) {
                report.changes.push({
                    shortName: entry.shortName,
                    field: 'deadline',
                    old: currentDeadline[1],
                    new: scrapedData.deadline,
                });
                entryText = entryText.replace(
                    /deadline:\s*"[^"]+"/,
                    `deadline: "${scrapedData.deadline}"`
                );
                console.log(`   📝 Deadline changed: ${currentDeadline[1]} → ${scrapedData.deadline}`);
            }
        }

        // Update test date if scraped and not in the past
        if (scrapedData.testDate) {
            const scrapedTestDate = new Date(scrapedData.testDate);
            const todayDate2 = new Date(today);
            if (scrapedTestDate < todayDate2) {
                console.log(`   ⏭️  Skipping test date ${scrapedData.testDate} (already passed)`);
            } else {
                const currentTest = entryText.match(/testDate:\s*"([^"]+)"/);
                if (currentTest && currentTest[1] !== scrapedData.testDate) {
                    report.changes.push({
                        shortName: entry.shortName,
                        field: 'testDate',
                        old: currentTest[1],
                        new: scrapedData.testDate,
                    });
                    entryText = entryText.replace(
                        /testDate:\s*"[^"]+"/,
                        `testDate: "${scrapedData.testDate}"`
                    );
                    console.log(`   📝 Test date changed: ${currentTest[1]} → ${scrapedData.testDate}`);
                }
            }
        }

        if (updated) {
            entry.fullMatch = entryText;
        }

        // Extract deadline for sorting
        const dlMatch = entryText.match(/deadline:\s*"([^"]+)"/);
        entry.deadlineDate = dlMatch ? new Date(dlMatch[1]) : new Date('2099-01-01');
    }

    // Sort entries by deadline date
    entries.sort((a, b) => a.deadlineDate - b.deadlineDate);

    // Reconstruct and write file
    const newArrayContent = entries.map(e => e.fullMatch).join(',\n  ');
    const newExport = `export const upcomingDeadlines = [\n  ${newArrayContent}\n];`;
    fileContent = fileContent.replace(deadlineArrayMatch[0], newExport);
    fs.writeFileSync(uniFilePath, fileContent, 'utf8');

    // Save reports
    const reportsDir = path.join(__dirname, '..', '..', 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    fs.writeFileSync(path.join(reportsDir, 'deadline-verification-report.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(reportsDir, 'deadline-verification-report.md'), generateMarkdownReport(report));

    // Print summary
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Verification Complete`);
    console.log(`   Entries processed: ${report.totalEntries}`);
    console.log(`   Universities scraped: ${report.universitiesScraped}`);
    console.log(`   Dates extracted: ${report.datesExtracted}`);
    console.log(`   Timestamps updated: ${report.timestampsUpdated}`);
    console.log(`   Date changes: ${report.changes.length}`);
    console.log(`   Errors: ${report.errors.length}`);
    console.log(`   Skipped: ${report.skipped.length}`);

    if (report.changes.length > 0) {
        console.log(`\n📝 Changes:`);
        for (const c of report.changes) {
            console.log(`   ${c.shortName}: ${c.field} ${c.old} → ${c.new}`);
        }
    }

    if (Object.keys(report.methods).length > 0) {
        console.log(`\n🔧 Methods used:`);
        for (const [uni, method] of Object.entries(report.methods)) {
            console.log(`   ${uni}: ${method}`);
        }
    }

    return report;
}

function generateMarkdownReport(report) {
    let md = `# Deadline Verification Report\n\n`;
    md += `**Date:** ${report.runDate}\n\n`;
    md += `| Metric | Value |\n|---|---|\n`;
    md += `| Entries processed | ${report.totalEntries} |\n`;
    md += `| Universities scraped | ${report.universitiesScraped} |\n`;
    md += `| Dates extracted | ${report.datesExtracted} |\n`;
    md += `| Timestamps updated | ${report.timestampsUpdated} |\n`;
    md += `| Date changes | ${report.changes.length} |\n`;
    md += `| Errors | ${report.errors.length} |\n\n`;

    if (report.changes.length > 0) {
        md += `## Changes\n\n| University | Field | Old | New |\n|---|---|---|---|\n`;
        for (const c of report.changes) {
            md += `| ${c.shortName} | ${c.field} | ${c.old} | ${c.new} |\n`;
        }
        md += '\n';
    }

    if (Object.keys(report.methods).length > 0) {
        md += `## Methods\n\n| University | Method |\n|---|---|\n`;
        for (const [uni, method] of Object.entries(report.methods)) {
            md += `| ${uni} | ${method} |\n`;
        }
        md += '\n';
    }

    if (report.errors.length > 0) {
        md += `## Errors\n\n| University | Error |\n|---|---|\n`;
        for (const e of report.errors) {
            md += `| ${e.shortName} | ${e.error} |\n`;
        }
    }

    return md;
}

// Export for testing
module.exports = { scrapeDeadlines, DEADLINE_SOURCES };

// Run if executed directly
if (require.main === module) {
    // Parse --uni flag
    const args = process.argv.slice(2);
    const uniIdx = args.indexOf('--uni');
    const filterUni = uniIdx !== -1 && args[uniIdx + 1] ? args[uniIdx + 1] : null;

    scrapeDeadlines(filterUni)
        .then(report => {
            // Only fail if zero universities were scraped AND no filter was used
            if (!filterUni && report.universitiesScraped === 0) {
                console.error('\n❌ Complete failure: no universities could be scraped');
                process.exit(1);
            }
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Fatal error:', err);
            process.exit(1);
        });
}
