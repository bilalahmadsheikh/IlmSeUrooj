/**
 * University Scraper Engine
 * Scrapes admission deadlines, test dates, fees, and other info from official university websites.
 * Uses Cheerio for HTML parsing (no browser required).
 *
 * Usage:
 *   const { scrapeUniversities } = require('./university-scraper');
 *   const results = await scrapeUniversities({ tier: 'critical' }); // or 'general'
 */

const cheerio = require('cheerio');

// ---------------------------------------------------------------------------
// Per-university scraping configurations
// Each config defines:
//   - urls: pages to fetch for this university
//   - extract(html, url): returns partial data extracted from the page
//   - idFilter: which university IDs in universities.js this maps to
// ---------------------------------------------------------------------------

const SCRAPE_CONFIGS = [
    // === NUST ===
    {
        key: 'NUST',
        idFilter: [1],
        urls: {
            admissions: 'https://ugadmissions.nust.edu.pk',
            fees: 'https://nust.edu.pk/admissions/fee-structure/',
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};

            if (tier === 'critical' || tier === 'all') {
                // Look for deadline / test date patterns in the page text
                const text = $('body').text();
                Object.assign(data, extractDates(text, 'NET'));
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
    {
        key: 'LUMS',
        idFilter: [2],
        urls: {
            admissions: 'https://admissions.lums.edu.pk',
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'LCAT'));
            }

            return data;
        },
    },

    // === FAST-NUCES (all campuses) ===
    {
        key: 'FAST',
        idFilter: [3, 4, 5, 6, 7],
        urls: {
            admissions: 'https://www.nu.edu.pk/Admissions',
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
            }

            return data;
        },
    },

    // === COMSATS (all campuses) ===
    {
        key: 'COMSATS',
        idFilter: [8, 9, 10, 11, 12, 13, 14],
        urls: {
            admissions: 'https://admissions.comsats.edu.pk',
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'NTS NAT'));
            }

            return data;
        },
    },

    // === IBA ===
    {
        key: 'IBA',
        idFilter: [15],
        urls: {
            admissions: 'https://iba.edu.pk/admissions',
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'IBA'));
            }

            return data;
        },
    },

    // === UET Lahore ===
    {
        key: 'UET_LAHORE',
        idFilter: [16],
        urls: {
            admissions: 'https://uet.edu.pk/admissions',
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

    // === UET Taxila ===
    {
        key: 'UET_TAXILA',
        idFilter: [17],
        urls: {
            admissions: 'https://uettaxila.edu.pk',
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
    {
        key: 'GIKI',
        idFilter: [18],
        urls: {
            admissions: 'https://giki.edu.pk/admissions/',
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'GIKI'));
            }

            if (tier === 'general' || tier === 'all') {
                const fee = extractFee(text);
                if (fee) data.avgFee = fee;
            }

            return data;
        },
    },

    // === PIEAS ===
    {
        key: 'PIEAS',
        idFilter: [19],
        urls: {
            admissions: 'https://pieas.edu.pk/admissions',
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
            admissions: 'https://bahria.edu.pk/admissions',
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
            admissions: 'https://habib.edu.pk/apply/',
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
    {
        key: 'AKU',
        idFilter: [24],
        urls: {
            admissions: 'https://www.aku.edu/admissions/Pages/home.aspx',
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
    {
        key: 'NED',
        idFilter: [25],
        urls: {
            admissions: 'https://www.neduet.edu.pk/admissions',
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'NED'));
            }

            return data;
        },
    },

    // === Air University ===
    {
        key: 'AIR',
        idFilter: [26],
        urls: {
            admissions: 'https://www.au.edu.pk/Pages/Admissions/Admissions.aspx',
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'Air'));
            }

            return data;
        },
    },

    // === SZABIST ===
    {
        key: 'SZABIST',
        idFilter: [27],
        urls: {
            admissions: 'https://www.szabist.edu.pk/admissions',
        },
        extract(html, url, tier) {
            const $ = cheerio.load(html);
            const data = {};
            const text = $('body').text();

            if (tier === 'critical' || tier === 'all') {
                Object.assign(data, extractDates(text, 'SZABIST'));
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
            admissions: 'https://itu.edu.pk/admissions/',
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
        new RegExp(`(?:${escapeRegex(testNameHint)})[^.]*?(?:date|scheduled|held)[:\\s]*(\\d{1,2}[\\s\\-\\/]?\\w+[\\s\\-\\/,]?\\d{4})`, 'i'),
        /(?:entry\s*test|admission\s*test|test\s*date|exam\s*date)[:\s]*(\d{1,2}[\s\-\/]?\w+[\s\-\/,]?\d{4})/i,
        /(?:test\s*(?:will\s*be\s*)?(?:held|conducted|scheduled)\s*(?:on)?)[:\s]*(\d{1,2}[\s\-\/]?\w+[\s\-\/,]?\d{4})/i,
        /(?:test\s*date)[:\s]*(\w+\s+\d{1,2}[,\s]+\d{4})/i,
    ];
    for (const pat of testPatterns) {
        const m = t.match(pat);
        if (m) {
            const parsed = parseFlexibleDate(m[1]);
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
 */
async function fetchPage(url, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; IlmSeUrooj-Bot/1.0; +https://github.com/bilalahmadsheikh/IlmSeUrooj)',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }

            return await response.text();
        } catch (err) {
            if (attempt === retries) throw err;
            // Wait before retry (1s, then 3s)
            await new Promise(r => setTimeout(r, (attempt + 1) * 1500));
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
 * @param {Object} options
 * @param {'critical'|'general'|'all'} options.tier - Which data fields to scrape
 * @returns {Object} - { results: [{key, ids, data, status}], errors: [...], timestamp }
 */
async function scrapeUniversities({ tier = 'critical' } = {}) {
    console.log(`\n🕷️  University Scraper`);
    console.log(`=====================`);
    console.log(`Tier: ${tier}`);
    console.log(`Date: ${new Date().toISOString()}`);
    console.log(`Universities: ${SCRAPE_CONFIGS.length}\n`);

    const results = [];
    const errors = [];

    for (const config of SCRAPE_CONFIGS) {
        console.log(`📍 ${config.key}...`);

        const urlsToFetch = tier === 'critical'
            ? { admissions: config.urls.admissions }       // Only admissions page for critical
            : tier === 'general'
                ? config.urls                                  // All URLs for general
                : config.urls;                                 // All URLs for 'all'

        let combinedData = {};
        let status = 'success';
        const fetchErrors = [];

        for (const [urlType, url] of Object.entries(urlsToFetch)) {
            try {
                const html = await fetchPage(url);
                const extracted = config.extract(html, url, tier);
                Object.assign(combinedData, extracted);
                console.log(`   ✅ ${urlType}: ${Object.keys(extracted).length} fields extracted`);
            } catch (err) {
                console.log(`   ⚠️  ${urlType} (${url}): ${err.message}`);
                fetchErrors.push({ url, error: err.message });
                status = 'partial';
            }
        }

        if (fetchErrors.length === Object.keys(urlsToFetch).length) {
            status = 'failed';
        }

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
