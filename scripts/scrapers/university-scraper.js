/**
 * University Scraper Engine v2.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Scrapes admission deadlines, test dates, fees, and other info from official
 * university websites.  Uses Cheerio for HTML parsing (no browser required).
 *
 * v2.0 Changes:
 *  - Fixed URLs for IBA, Air University, SZABIST, UET, GIKI, NED
 *  - Chrome-like User-Agent to avoid 403 blocks (FAST, NED)
 *  - Multiple fallback URLs per university
 *  - Improved extraction patterns for Pakistani university page formats
 *  - Added `lastVerified` timestamp support
 *
 * Usage:
 *   const { scrapeUniversities } = require('./university-scraper');
 *   const results = await scrapeUniversities({ tier: 'critical' }); // or 'general'
 */

const cheerio = require('cheerio');

// ---------------------------------------------------------------------------
// Per-university scraping configurations
// Each config defines:
//   - urls: pages to fetch for this university (with fallbacks array)
//   - extract(html, url): returns partial data extracted from the page
//   - idFilter: which university IDs in universities.js this maps to
// ---------------------------------------------------------------------------

const SCRAPE_CONFIGS = [
    // === NUST ===
    // NOTE: nust.edu.pk returns 403 (Cloudflare). The pages are correct
    // but depend on network conditions. Keep all URLs as fallbacks.
    {
        key: 'NUST',
        idFilter: [1],
        urls: {
            admissions: [
                'https://nust.edu.pk/admissions/',
                'https://ugadmissions.nust.edu.pk',
            ],
            fees: [
                'https://nust.edu.pk/admissions/fee-structure/',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};

            if (tier === 'critical' || tier === 'all') {
                const text = $('body').text();
                Object.assign(data, extractDates(text, 'NET'));
                // NUST-specific: look for NET schedule tables
                $('table').each((_, table) => {
                    const tableText = $(table).text();
                    if (/NET|entry\s*test/i.test(tableText)) {
                        Object.assign(data, extractDates(tableText, 'NET'));
                    }
                });
            }

            if (tier === 'general' || tier === 'all') {
                const feeText = $('body').text();
                const fee = extractFee(feeText);
                if (fee) data.avgFee = fee;
            }

            return data;
        },
    },

    // === LUMS ===
    // NOTE: admissions.lums.edu.pk times out. Use lums.edu.pk/admissions which works.
    {
        key: 'LUMS',
        idFilter: [2],
        urls: {
            admissions: [
                'https://lums.edu.pk/admissions',
                'https://admissions.lums.edu.pk',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'LCAT'));
                // LUMS specific: look for "Application Deadline" in strong/bold
                $('strong, b, h2, h3, h4').each((_, el) => {
                    const elText = $(el).text() + ' ' + $(el).next().text();
                    if (/deadline|last\s*date|application/i.test(elText)) {
                        Object.assign(data, extractDates(elText, 'LCAT'));
                    }
                });
            }

            return data;
        },
    },

    // === FAST-NUCES (all campuses) ===
    // NOTE: nu.edu.pk/Admissions returns 403 (Cloudflare).
    // /Admissions/UnderGraduateAdmissions returns 404. Homepage (nu.edu.pk) works.
    {
        key: 'FAST',
        idFilter: [3, 4, 5, 6, 7],
        urls: {
            admissions: [
                'https://nu.edu.pk',
                'https://www.nu.edu.pk/Admissions',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'FAST NU Test'));

                // FAST-specific: look for "Last date" or "Application deadline"
                const deadlineMatch = text.match(/(?:last\s*date|deadline|apply\s*before)[:\s]*(\d{1,2}[\s\-/]?\w+[\s\-/]?\d{4})/i);
                if (deadlineMatch) {
                    const parsed = parseFlexibleDate(deadlineMatch[1]);
                    if (parsed) data['admissions.deadline'] = parsed;
                }

                // Look for dates in table cells
                $('table td, table th').each((_, el) => {
                    const cellText = $(el).text().trim();
                    if (/last\s*date|deadline|test\s*date/i.test(cellText)) {
                        const nextCell = $(el).next('td').text().trim();
                        if (nextCell) {
                            const parsed = parseFlexibleDate(nextCell);
                            if (parsed) {
                                if (/test/i.test(cellText)) {
                                    data['admissions.testDate'] = parsed;
                                } else {
                                    data['admissions.deadline'] = parsed;
                                }
                            }
                        }
                    }
                });
            }

            return data;
        },
    },

    // === COMSATS (all campuses) ===
    {
        key: 'COMSATS',
        idFilter: [8, 9, 10, 11, 12, 13, 14],
        urls: {
            admissions: [
                'https://admissions.comsats.edu.pk',
                'https://www.comsats.edu.pk/Admissions.aspx',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'NTS NAT'));

                // COMSATS often has news/marquee with dates
                $('marquee, .news-ticker, .announcement, .notice').each((_, el) => {
                    const notice = $(el).text();
                    Object.assign(data, extractDates(notice, 'NTS NAT'));
                });
            }

            return data;
        },
    },

    // === IBA Karachi ===
    // FIX: /admissions returns 404. Use /undergraduate.php and /fee-structure.php
    {
        key: 'IBA',
        idFilter: [15],
        urls: {
            admissions: [
                'https://www.iba.edu.pk/undergraduate.php',
                'https://www.iba.edu.pk/',
            ],
            fees: [
                'https://www.iba.edu.pk/fee-structure.php',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'IBA'));
                // IBA-specific: look for admission schedules
                $('table').each((_, table) => {
                    const tblText = $(table).text();
                    if (/admission|deadline|aptitude/i.test(tblText)) {
                        Object.assign(data, extractDates(tblText, 'IBA'));
                    }
                });
            }

            if ((tier === 'general' || tier === 'all') && /fee/i.test(url)) {
                // IBA fee page has "Fee Per Credit Hour" format with numbers
                const fee = extractFee(text);
                if (fee) data.avgFee = fee;

                // IBA-specific: look for per-credit-hour fees
                const creditMatch = text.match(/(?:fee\s*per\s*credit\s*hour)[:\s]*(?:PKR|Rs\.?)?\s*([\d,]+)/i);
                if (creditMatch) {
                    const perCredit = parseInt(creditMatch[1].replace(/,/g, ''), 10);
                    if (perCredit > 1000 && perCredit < 200000) {
                        // Typical BS = 15 credit hours per semester
                        const semesterFee = perCredit * 15;
                        data.avgFee = `PKR ${semesterFee.toLocaleString()} per semester (${perCredit.toLocaleString()}/credit hour)`;
                    }
                }
            }

            return data;
        },
    },

    // === UET Lahore ===
    // FIX: /admissions returns 404. Use main page + admission portal
    {
        key: 'UET_LAHORE',
        idFilter: [16],
        urls: {
            admissions: [
                'https://www.uet.edu.pk/',
                'https://admission.uet.edu.pk',
                'https://www.uet.edu.pk/home/',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'ECAT'));

                // UET specific: news/announcement sections about ECAT
                $('.news, .announcement, .marquee, a').each((_, el) => {
                    const elText = $(el).text();
                    if (/ECAT|admission|entry\s*test/i.test(elText)) {
                        Object.assign(data, extractDates(elText, 'ECAT'));
                    }
                });
            }

            return data;
        },
    },

    // === UET Taxila ===
    // FIX: /admission.aspx returns 404. Use admissions portal subdomain.
    {
        key: 'UET_TAXILA',
        idFilter: [17],
        urls: {
            admissions: [
                'https://www.uettaxila.edu.pk/',
                'https://admissions.uettaxila.edu.pk',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'ECAT'));
            }

            return data;
        },
    },

    // === GIKI ===
    // URLs verified working. Added fees and eligibility subpages for richer data.
    // CAUTION: Page mentions "admission fee of Rs. 75,000" which is NOT semester fee.
    // Semester fee is ~427,500. Only accept fee values > 200,000.
    {
        key: 'GIKI',
        idFilter: [18],
        urls: {
            admissions: [
                'https://giki.edu.pk/admissions/',
                'https://giki.edu.pk/admission-overview/admissions-undergraduates/',
            ],
            fees: [
                'https://giki.edu.pk/admissions/admissions-undergraduates/ugrad-fees-and-expenses/',
            ],
            eligibility: [
                'https://giki.edu.pk/admissions/admissions-undergraduates/eligibility-criteria/',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'GIKI'));
                // GIKI uses "Apply for Undergrad Admissions" links
                $('a').each((_, el) => {
                    const linkText = $(el).text();
                    if (/apply.*admission/i.test(linkText)) {
                        // The year in the link text indicates active admissions
                        const yearMatch = linkText.match(/20\d{2}/);
                        if (yearMatch) {
                            data['_activeAdmissionYear'] = yearMatch[0];
                        }
                    }
                });
            }

            if (tier === 'general' || tier === 'all') {
                const fee = extractFee(text);
                // GIKI semester fee is ~427,500. Reject small values like admission fee (75,000)
                if (fee) {
                    const numMatch = fee.match(/([\d,]+)/);
                    const numVal = numMatch ? parseInt(numMatch[1].replace(/,/g, ''), 10) : 0;
                    if (numVal > 200000) {
                        data.avgFee = fee;
                    }
                }

                // GIKI-specific: semester fee pattern
                const semFeeMatch = text.match(/semester\s*(?:\/\s*annual)?\s*fee[^.]*?(?:Rs\.?|PKR)\s*([\d,]+)/i);
                if (semFeeMatch) {
                    const num = parseInt(semFeeMatch[1].replace(/,/g, ''), 10);
                    if (num > 200000) {
                        data.avgFee = `PKR ${num.toLocaleString()} per semester (tuition + accommodation)`;
                    }
                }
            }

            return data;
        },
    },

    // === PIEAS ===
    {
        key: 'PIEAS',
        idFilter: [19],
        urls: {
            admissions: [
                'https://www.pieas.edu.pk/admissions',
                'https://www.pieas.edu.pk/',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'PIEAS'));
            }

            return data;
        },
    },

    // === Bahria (all campuses) ===
    {
        key: 'BAHRIA',
        idFilter: [20, 21, 22],
        urls: {
            admissions: [
                'https://bahria.edu.pk/admissions/',
                'https://www.bahria.edu.pk/admissions',
                'https://bahria.edu.pk/',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'BUET'));
            }

            return data;
        },
    },

    // === Habib ===
    {
        key: 'HABIB',
        idFilter: [23],
        urls: {
            admissions: [
                'https://habib.edu.pk/apply/',
                'https://habib.edu.pk/admissions/',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'Habib'));
            }

            if (tier === 'general' || tier === 'all') {
                const fee = extractFee(text);
                if (fee) data.avgFee = fee;
            }

            return data;
        },
    },

    // === AKU ===
    // NOTE: /admissions/ times out. Use /admissions/Pages/home.aspx which works.
    {
        key: 'AKU',
        idFilter: [24],
        urls: {
            admissions: [
                'https://www.aku.edu/admissions/Pages/home.aspx',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'AKU'));
            }

            return data;
        },
    },

    // === NED ===
    // FIX: /news-events returns 404. /admissions returns 403.
    // Use /admission (singular, 200 OK, 109K chars) + homepage.
    {
        key: 'NED',
        idFilter: [25],
        urls: {
            admissions: [
                'https://www.neduet.edu.pk/admission',
                'https://www.neduet.edu.pk/',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'NED'));

                // NED specific: news/announcement links about admissions
                $('a, .news-item, .announcement').each((_, el) => {
                    const elText = $(el).text();
                    if (/admission|entry\s*test|NED\s*test/i.test(elText)) {
                        Object.assign(data, extractDates(elText, 'NED'));
                    }
                });
            }

            return data;
        },
    },

    // === Air University ===
    // FIX: Old .aspx URL 404. Correct pages at au.edu.pk/ and webdata.au.edu.pk
    {
        key: 'AIR',
        idFilter: [26],
        urls: {
            admissions: [
                'https://au.edu.pk/',
                'https://webdata.au.edu.pk/Pages/Admission/newpages/Bachelor_programs.aspx',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'Air'));

                // Air University specific: events section may have admission dates
                $('a, .event-item, h3, h4').each((_, el) => {
                    const elText = $(el).text();
                    if (/admission|apply\s*now|last\s*date/i.test(elText)) {
                        Object.assign(data, extractDates(elText + ' ' + $(el).next().text(), 'Air'));
                    }
                });
            }

            return data;
        },
    },

    // === SZABIST ===
    // FIX: www.szabist.edu.pk returns 404! Use szabist.edu.pk (no www) and admissions subdomain.
    {
        key: 'SZABIST',
        idFilter: [27],
        urls: {
            admissions: [
                'https://admissions.szabist.edu.pk',
                'https://szabist.edu.pk/',
                'https://szabist.edu.pk/admissions/',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'SZABIST'));

                // SZABIST portal page may have "Fall 2026" dates
                $('table, .admission-info, .deadline').each((_, el) => {
                    const elText = $(el).text();
                    if (/deadline|last\s*date|fall|spring/i.test(elText)) {
                        Object.assign(data, extractDates(elText, 'SZABIST'));
                    }
                });
            }

            if (tier === 'general' || tier === 'all') {
                const fee = extractFee(text);
                if (fee) data.avgFee = fee;
            }

            return data;
        },
    },

    // === ITU ===
    {
        key: 'ITU',
        idFilter: [28],
        urls: {
            admissions: [
                'https://itu.edu.pk/admissions/',
                'https://itu.edu.pk/',
            ],
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'ITU'));
            }

            if (tier === 'general' || tier === 'all') {
                const fee = extractFee(text);
                if (fee) data.avgFee = fee;
            }

            return data;
        },
    },
];

// ---------------------------------------------------------------------------
// Shared extraction helpers
// ---------------------------------------------------------------------------

/** Month name → number mapping */
const MONTHS = {
    january: '01', jan: '01', february: '02', feb: '02', march: '03', mar: '03',
    april: '04', apr: '04', may: '05', june: '06', jun: '06',
    july: '07', jul: '07', august: '08', aug: '08', september: '09', sep: '09',
    october: '10', oct: '10', november: '11', nov: '11', december: '12', dec: '12',
};

/**
 * Attempt to parse flexible date strings like "July 4, 2026" or "04-07-2026" or "4 Jul 2026"
 * Returns ISO date string YYYY-MM-DD or null.
 */
function parseFlexibleDate(str) {
    if (!str) return null;
    const s = str.trim();

    // Format: YYYY-MM-DD (already ISO)
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return s;

    // Format: "Month DD, YYYY" or "Month DD YYYY"
    const mdy = s.match(/^(\w+)\s+(\d{1,2})[,\s]+(\d{4})$/i);
    if (mdy) {
        const m = MONTHS[mdy[1].toLowerCase()];
        if (m) return `${mdy[3]}-${m}-${mdy[2].padStart(2, '0')}`;
    }

    // Format: "DD Month YYYY"
    const dmy = s.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/i);
    if (dmy) {
        const m = MONTHS[dmy[2].toLowerCase()];
        if (m) return `${dmy[3]}-${m}-${dmy[1].padStart(2, '0')}`;
    }

    // Format: DD-MM-YYYY or DD/MM/YYYY
    const dmy2 = s.match(/^(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})$/);
    if (dmy2) {
        return `${dmy2[3]}-${dmy2[2].padStart(2, '0')}-${dmy2[1].padStart(2, '0')}`;
    }

    // Format: "Month DD" (assume current or next year)
    const md = s.match(/^(\w+)\s+(\d{1,2})$/i);
    if (md) {
        const m = MONTHS[md[1].toLowerCase()];
        if (m) {
            const now = new Date();
            const year = now.getFullYear();
            const dateStr = `${year}-${m}-${md[2].padStart(2, '0')}`;
            // If date is in the past, assume next year
            if (new Date(dateStr) < now) {
                return `${year + 1}-${m}-${md[2].padStart(2, '0')}`;
            }
            return dateStr;
        }
    }

    return null;
}

/**
 * Extract deadline and test date from page text using keyword patterns.
 * @param {string} text - Full page text
 * @param {string} testNameHint - Expected test name to look for
 * @returns {Object} - Partial data with admissions.deadline and/or admissions.testDate
 */
function extractDates(text, testNameHint) {
    const data = {};
    // Normalize whitespace
    const t = text.replace(/\s+/g, ' ');

    // --- Deadline patterns ---
    const deadlinePatterns = [
        /(?:last\s*date\s*(?:to\s*apply|of\s*(?:application|submission|registration)))[:\s]*(\d{1,2}[\s\-\/]?\w+[\s\-\/,]?\d{4})/i,
        /(?:application\s*deadline|deadline\s*(?:for\s*)?(?:application|submission))[:\s]*(\d{1,2}[\s\-\/]?\w+[\s\-\/,]?\d{4})/i,
        /(?:apply\s*(?:before|by))[:\s]*(\d{1,2}[\s\-\/]?\w+[\s\-\/,]?\d{4})/i,
        /(?:last\s*date)[:\s]*(\w+\s+\d{1,2}[,\s]+\d{4})/i,
        /(?:deadline)[:\s]*(\w+\s+\d{1,2}[,\s]+\d{4})/i,
        // Pakistani format: "Last date: 4 July 2026" or "Last Date to Apply: July 4, 2026"
        /(?:last\s*date\s*(?:to\s*apply)?)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
        /(?:last\s*date\s*(?:to\s*apply)?)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
        // "Last date to join: 20th February 2026" — common on Pakistani sites
        /(?:last\s*date\s*to\s*(?:join|apply|submit))[:\s]*(\d{1,2}(?:st|nd|rd|th)?\s+\w+,?\s*\d{4})/i,
        // Phase-based: "Phase I ... deadline ... date"
        /(?:phase\s*(?:I|1|II|2))[^.]*?(?:deadline|last\s*date)[:\s]*(\d{1,2}[\s\-\/]?\w+[\s\-\/,]?\d{4})/i,
        // "closing date: DD Mon YYYY" or "applications close: DD Mon YYYY"
        /(?:closing\s*date|applications?\s*close)[:\s]*(\d{1,2}[\s\-\/]?\w+[\s\-\/,]?\d{4})/i,
    ];
    for (const pat of deadlinePatterns) {
        const m = t.match(pat);
        if (m) {
            const parsed = parseFlexibleDate(m[1]);
            if (parsed) {
                data['admissions.deadline'] = parsed;
                break;
            }
        }
    }

    // --- Test date patterns ---
    const testPatterns = [
        new RegExp(`(?:${escapeRegex(testNameHint)})[^.]*?(?:date|scheduled|held)[:\\\\s]*(\\\\d{1,2}[\\\\s\\\\-\\\\/]?\\\\w+[\\\\s\\\\-\\\\/,]?\\\\d{4})`, 'i'),
        /(?:entry\s*test|admission\s*test|test\s*date|exam\s*date)[:\s]*(\d{1,2}[\s\-\/]?\w+[\s\-\/,]?\d{4})/i,
        /(?:test\s*(?:will\s*be\s*)?(?:held|conducted|scheduled)\s*(?:on)?)[:\s]*(\d{1,2}[\s\-\/]?\w+[\s\-\/,]?\d{4})/i,
        /(?:test\s*date)[:\s]*(\w+\s+\d{1,2}[,\s]+\d{4})/i,
        // "ECAT ... March 30 to April 3, 2026" — take the start date
        new RegExp(`(?:${escapeRegex(testNameHint)})[^.]*?(\\d{1,2}\\s+\\w+\\s+\\d{4})`, 'i'),
        // "test from DD Month to DD Month YYYY"
        /(?:test|exam|ECAT|NET)\s*(?:from\s*)?(\d{1,2}\s+\w+)\s*(?:to|-)\s*\d{1,2}\s+\w+,?\s*(\d{4})/i,
    ];
    for (const pat of testPatterns) {
        const m = t.match(pat);
        if (m) {
            // Handle "DD Month" + "YYYY" from test range pattern
            const dateStr = m[2] ? `${m[1]} ${m[2]}` : m[1];
            const parsed = parseFlexibleDate(dateStr);
            if (parsed) {
                data['admissions.testDate'] = parsed;
                break;
            }
        }
    }

    return data;
}

/**
 * Extract fee information from page text.
 * @param {string} text
 * @returns {string|null}
 */
function extractFee(text) {
    const t = text.replace(/\s+/g, ' ');

    // Match patterns like "PKR 180,000" or "Rs. 1,80,000" or "Rs 180000"
    const feePatterns = [
        /(?:tuition\s*fee|semester\s*fee|fee\s*(?:per\s*semester|structure))[:\s]*(?:PKR|Rs\.?)\s*([\d,]+)/i,
        /(?:PKR|Rs\.?)\s*([\d,]+)\s*(?:per\s*semester|\/\s*semester)/i,
        /(?:fee)[:\s]*(?:PKR|Rs\.?)\s*([\d,]+)/i,
        // IBA-style: "Fee Per Credit Hour" followed by number
        /(?:fee\s*per\s*credit\s*hour)[:\s]*(?:PKR|Rs\.?)?\s*([\d,]+)/i,
        // GIKI-style: "annual tuition fee ... US$ 5000" — skip USD, find PKR
        /(?:semester\s*fee|tuition)\s*(?:is\s*)?(?:PKR|Rs\.?)\s*([\d,]+)/i,
    ];

    for (const pat of feePatterns) {
        const m = t.match(pat);
        if (m) {
            const amount = m[1].replace(/,/g, '');
            const num = parseInt(amount, 10);
            if (num > 10000 && num < 5000000) {
                return `PKR ${num.toLocaleString()} per semester`;
            }
        }
    }

    return null;
}

/** Escape special regex characters */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Fetch a URL with timeout and retry logic.
 * Uses native fetch (Node 18+).
 * v2.0: Uses realistic Chrome User-Agent to avoid 403 blocks.
 */
async function fetchPage(url, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

            const response = await fetch(url, {
                signal: controller.signal,
                redirect: 'follow',
                headers: {
                    // Chrome-like User-Agent to avoid 403 blocks from university firewalls
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1',
                },
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }

            return await response.text();
        } catch (err) {
            if (attempt === retries) throw err;
            // Wait before retry (2s, then 4s)
            await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
        }
    }
}

/** Delay helper */
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Main scraping function
// ---------------------------------------------------------------------------

/**
 * Scrape university data based on the specified tier.
 * v2.0: Supports fallback URLs per university.
 * @param {Object} options
 * @param {'critical'|'general'|'all'} options.tier - Which data fields to scrape
 * @returns {Object} - { results: [{key, ids, data, status}], errors: [...], timestamp }
 */
async function scrapeUniversities({ tier = 'critical' } = {}) {
    console.log(`\n🕷️  University Scraper v2.0`);
    console.log(`===========================`);
    console.log(`Tier: ${tier}`);
    console.log(`Date: ${new Date().toISOString()}`);
    console.log(`Universities: ${SCRAPE_CONFIGS.length}\n`);

    const results = [];

    for (const config of SCRAPE_CONFIGS) {
        console.log(`📍 ${config.key}...`);

        // Determine which URL groups to fetch based on tier
        const urlGroupsToFetch = tier === 'critical'
            ? { admissions: config.urls.admissions }
            : config.urls;   // All URL groups for general/all

        let combinedData = {};
        let status = 'success';
        const fetchErrors = [];

        for (const [urlType, urlList] of Object.entries(urlGroupsToFetch)) {
            // urlList is now an array of fallback URLs
            const urls = Array.isArray(urlList) ? urlList : [urlList];
            let fetched = false;

            for (const url of urls) {
                try {
                    const html = await fetchPage(url);
                    const extracted = config.extract(html, url, tier);
                    Object.assign(combinedData, extracted);
                    console.log(`   ✅ ${urlType} (${url}): ${Object.keys(extracted).length} fields extracted`);
                    fetched = true;
                    break; // Stop trying fallback URLs on success
                } catch (err) {
                    console.log(`   ⚠️  ${urlType} (${url}): ${err.message}`);
                    fetchErrors.push({ url, error: err.message });
                }
            }

            if (!fetched) {
                status = 'partial';
            }
        }

        if (fetchErrors.length >= Object.values(urlGroupsToFetch).flat().length) {
            status = 'failed';
        }

        // Add lastVerified timestamp
        combinedData['_lastVerified'] = new Date().toISOString();

        results.push({
            key: config.key,
            ids: config.idFilter,
            data: combinedData,
            status,
            errors: fetchErrors,
        });

        // Rate limiting: wait between universities
        await delay(2000);
    }

    const report = {
        timestamp: new Date().toISOString(),
        tier,
        totalUniversities: SCRAPE_CONFIGS.length,
        successful: results.filter(r => r.status === 'success').length,
        partial: results.filter(r => r.status === 'partial').length,
        failed: results.filter(r => r.status === 'failed').length,
        results,
    };

    console.log(`\n📊 Scrape Complete`);
    console.log(`   ✅ Success: ${report.successful}`);
    console.log(`   ⚠️  Partial: ${report.partial}`);
    console.log(`   ❌ Failed: ${report.failed}`);

    return report;
}

module.exports = { scrapeUniversities, parseFlexibleDate, extractDates, extractFee, SCRAPE_CONFIGS };
