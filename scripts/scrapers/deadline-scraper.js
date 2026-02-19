/**
 * Deadline Verification Scraper
 * 
 * Scrapes official university admission pages to verify/update deadlines
 * in the upcomingDeadlines array of universities.js.
 * 
 * Runs via GitHub Actions every 20 days, or manually via:
 *   node scripts/scrapers/deadline-scraper.js
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// ─── Verified URL map: university shortName → official admission URLs ───
const DEADLINE_SOURCES = {
    'IBA': {
        urls: [
            'https://www.iba.edu.pk/undergraduate.php',
            'https://www.iba.edu.pk/',
        ],
        testNameHint: 'IBA',
    },
    'NUST': {
        urls: [
            'https://nust.edu.pk/admissions/',
            'https://ugadmissions.nust.edu.pk',
        ],
        testNameHint: 'NET',
    },
    'LUMS': {
        urls: [
            'https://lums.edu.pk/admissions',
        ],
        testNameHint: 'LCAT',
    },
    'SZABIST': {
        urls: [
            'https://szabist.edu.pk/admissions/',
            'https://szabist.edu.pk/',
        ],
        testNameHint: 'SZABIST',
    },
    'AKU': {
        urls: [
            'https://www.aku.edu/admissions/Pages/home.aspx',
        ],
        testNameHint: 'AKU',
    },
    'Habib': {
        urls: [
            'https://habib.edu.pk/apply/',
            'https://habib.edu.pk/admissions/',
        ],
        testNameHint: 'Habib',
    },
    'FAST Isb': {
        urls: ['https://nu.edu.pk'],
        testNameHint: 'NU',
        sharedKey: 'FAST',
    },
    'FAST Lhr': {
        urls: ['https://nu.edu.pk'],
        testNameHint: 'NU',
        sharedKey: 'FAST',
    },
    'FAST Khi': {
        urls: ['https://nu.edu.pk'],
        testNameHint: 'NU',
        sharedKey: 'FAST',
    },
    'FAST Psh': {
        urls: ['https://nu.edu.pk'],
        testNameHint: 'NU',
        sharedKey: 'FAST',
    },
    'GIKI': {
        urls: [
            'https://giki.edu.pk/admissions/',
            'https://giki.edu.pk/',
        ],
        testNameHint: 'GIKI',
    },
    'PIEAS': {
        urls: [
            'https://www.pieas.edu.pk/admissions',
            'https://www.pieas.edu.pk/',
        ],
        testNameHint: 'PIEAS',
    },
    'Bahria Isb': {
        urls: ['https://bahria.edu.pk/admissions/'],
        testNameHint: 'Bahria',
        sharedKey: 'Bahria',
    },
    'Bahria Lhr': {
        urls: ['https://bahria.edu.pk/admissions/'],
        testNameHint: 'Bahria',
        sharedKey: 'Bahria',
    },
    'COMSATS Isb': {
        urls: [
            'https://admissions.comsats.edu.pk',
            'https://www.comsats.edu.pk/Admissions.aspx',
        ],
        testNameHint: 'NAT',
        sharedKey: 'COMSATS',
    },
    'COMSATS Lhr': {
        urls: ['https://admissions.comsats.edu.pk'],
        testNameHint: 'NAT',
        sharedKey: 'COMSATS',
    },
    'COMSATS Wah': {
        urls: ['https://admissions.comsats.edu.pk'],
        testNameHint: 'NAT',
        sharedKey: 'COMSATS',
    },
    'COMSATS Abbottabad': {
        urls: ['https://admissions.comsats.edu.pk'],
        testNameHint: 'NAT',
        sharedKey: 'COMSATS',
    },
    'Air': {
        urls: [
            'https://au.edu.pk/',
            'https://webdata.au.edu.pk/Pages/Admission/newpages/Bachelor_programs.aspx',
        ],
        testNameHint: 'Air',
    },
    'ITU': {
        urls: [
            'https://itu.edu.pk/admissions/',
            'https://itu.edu.pk/',
        ],
        testNameHint: 'ITU',
    },
    'NED': {
        urls: [
            'https://www.neduet.edu.pk/admission',
            'https://www.neduet.edu.pk/',
        ],
        testNameHint: 'NED',
    },
    'UET Lahore': {
        urls: [
            'https://admission.uet.edu.pk',
            'https://www.uet.edu.pk/',
        ],
        testNameHint: 'ECAT',
    },
    'UET Taxila': {
        urls: [
            'https://admissions.uettaxila.edu.pk',
            'https://www.uettaxila.edu.pk/',
        ],
        testNameHint: 'ECAT',
    },
};

// ─── Fetch with retry + User-Agent ───
async function fetchPage(url, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                signal: controller.signal,
                redirect: 'follow',
            });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        } catch (err) {
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        }
    }
}

// ─── Parse flexible date strings into YYYY-MM-DD ───
function parseDate(str) {
    if (!str) return null;
    const cleaned = str.replace(/(\d+)(st|nd|rd|th)/gi, '$1').trim();

    // Try native Date parse
    const d = new Date(cleaned);
    if (!isNaN(d.getTime()) && d.getFullYear() >= 2025) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // Manual: "DD Month YYYY" or "Month DD, YYYY"
    const months = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };

    // DD Month YYYY
    let m = cleaned.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (m) {
        const mon = months[m[2].substring(0, 3).toLowerCase()];
        if (mon) return `${m[3]}-${mon}-${String(m[1]).padStart(2, '0')}`;
    }

    // Month DD, YYYY
    m = cleaned.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/);
    if (m) {
        const mon = months[m[1].substring(0, 3).toLowerCase()];
        if (mon) return `${m[3]}-${mon}-${String(m[2]).padStart(2, '0')}`;
    }

    return null;
}

// ─── Extract deadline and test dates from page text ───
function extractDeadlineInfo(text, testNameHint) {
    const t = text.replace(/\s+/g, ' ');
    const result = {};

    // Deadline patterns (most specific first)
    const deadlinePatterns = [
        /(?:last\s*date\s*(?:to\s*(?:apply|submit|join)))[:\s]*(\d{1,2}(?:st|nd|rd|th)?\s+\w+,?\s*\d{4})/i,
        /(?:last\s*date\s*(?:of\s*(?:application|submission|registration)))[:\s]*(\d{1,2}\s*\w+\s*\d{4})/i,
        /(?:application\s*deadline|deadline\s*(?:for\s*)?(?:application|submission))[:\s]*(\d{1,2}\s*\w+\s*,?\s*\d{4})/i,
        /(?:apply\s*(?:before|by))[:\s]*(\d{1,2}\s*\w+\s*,?\s*\d{4})/i,
        /(?:last\s*date)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
        /(?:deadline)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
        /(?:last\s*date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
        /(?:closing\s*date|applications?\s*close)[:\s]*(\d{1,2}\s*\w+\s*,?\s*\d{4})/i,
        /(?:last\s*date\s*to\s*generate\s*(?:challan|token))[:\s]*(\d{1,2}\s*\w+\s*,?\s*\d{4})/i,
    ];

    for (const pat of deadlinePatterns) {
        const match = t.match(pat);
        if (match) {
            const parsed = parseDate(match[1]);
            if (parsed) {
                result.deadline = parsed;
                break;
            }
        }
    }

    // Test date patterns
    const testPatterns = [
        new RegExp(`(?:${escapeRegex(testNameHint)})[^.]{0,80}?(?:test|exam)\\s*(?:date|on|scheduled)[:\\s]*(\\d{1,2}\\s*\\w+\\s*,?\\s*\\d{4})`, 'i'),
        /(?:entry\s*test|admission\s*test|test\s*date|exam\s*date)[:\s]*(\d{1,2}\s*\w+\s*,?\s*\d{4})/i,
        /(?:test\s*(?:will\s*be\s*)?(?:held|conducted|scheduled)\s*(?:on)?)[:\s]*(\d{1,2}\s*\w+\s*,?\s*\d{4})/i,
        /(?:test\s*(?:from\s*)?)(\d{1,2}\s+\w+)\s*(?:to|-)\s*\d{1,2}\s+\w+,?\s*(\d{4})/i,
    ];

    for (const pat of testPatterns) {
        const match = t.match(pat);
        if (match) {
            const dateStr = match[2] ? `${match[1]} ${match[2]}` : match[1];
            const parsed = parseDate(dateStr);
            if (parsed) {
                result.testDate = parsed;
                break;
            }
        }
    }

    return result;
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Main scraper logic ───
async function scrapeDeadlines() {
    const today = new Date().toISOString().split('T')[0];
    const report = {
        runDate: today,
        totalEntries: 0,
        urlsChecked: 0,
        urlsReachable: 0,
        datesExtracted: 0,
        timestampsUpdated: 0,
        changes: [],
        errors: [],
    };

    // Read current universities.js
    const uniFilePath = path.join(__dirname, '..', '..', 'src', 'data', 'universities.js');
    let fileContent = fs.readFileSync(uniFilePath, 'utf8');

    // Parse upcomingDeadlines from the file
    const deadlineMatch = fileContent.match(/export\s+const\s+upcomingDeadlines\s*=\s*\[([\s\S]*?)\];/);
    if (!deadlineMatch) {
        console.error('❌ Could not find upcomingDeadlines in universities.js');
        process.exit(1);
    }

    // Track which shared keys we've already scraped (avoid redundant fetches)
    const sharedCache = {};

    // Process each deadline entry
    // We work with objects matched by shortName
    const entries = [];
    const entryRegex = /\{\s*id:\s*(\d+),\s*university:\s*"([^"]+)",\s*shortName:\s*"([^"]+)"[\s\S]*?\}/g;
    let entryMatch;
    while ((entryMatch = entryRegex.exec(deadlineMatch[1])) !== null) {
        entries.push({
            id: parseInt(entryMatch[1]),
            university: entryMatch[2],
            shortName: entryMatch[3],
            fullMatch: entryMatch[0],
        });
    }

    report.totalEntries = entries.length;
    console.log(`\n📋 Deadline Verification Scraper`);
    console.log(`${'='.repeat(40)}`);
    console.log(`Date: ${today}`);
    console.log(`Entries: ${entries.length}\n`);

    for (const entry of entries) {
        const source = DEADLINE_SOURCES[entry.shortName];
        if (!source) {
            console.log(`⚠️  ${entry.shortName}: No source configured, skipping`);
            continue;
        }

        // Use shared cache if applicable
        const cacheKey = source.sharedKey || entry.shortName;
        let scrapedData = sharedCache[cacheKey];

        if (!scrapedData) {
            scrapedData = { deadline: null, testDate: null, reachable: false };

            for (const url of source.urls) {
                report.urlsChecked++;
                try {
                    console.log(`🔍 ${entry.shortName}: fetching ${url}`);
                    const html = await fetchPage(url);
                    report.urlsReachable++;
                    scrapedData.reachable = true;

                    const $ = cheerio.load(html);
                    const text = $('body').text();
                    const extracted = extractDeadlineInfo(text, source.testNameHint);

                    if (extracted.deadline && !scrapedData.deadline) {
                        scrapedData.deadline = extracted.deadline;
                        report.datesExtracted++;
                        console.log(`   ✅ Found deadline: ${extracted.deadline}`);
                    }
                    if (extracted.testDate && !scrapedData.testDate) {
                        scrapedData.testDate = extracted.testDate;
                        report.datesExtracted++;
                        console.log(`   ✅ Found test date: ${extracted.testDate}`);
                    }

                    // If we found deadline, no need to check more URLs
                    if (scrapedData.deadline) break;
                } catch (err) {
                    const errMsg = err.message.substring(0, 60);
                    console.log(`   ⚠️  ${url}: ${errMsg}`);
                    report.errors.push({ shortName: entry.shortName, url, error: errMsg });
                }
            }

            sharedCache[cacheKey] = scrapedData;
        } else {
            console.log(`♻️  ${entry.shortName}: Using cached data from ${cacheKey}`);
        }

        // Update lastVerified timestamp on this entry (always)
        // Also update deadline/testDate if scraped successfully
        let updated = false;
        let entryText = entry.fullMatch;

        // Add or update lastVerified
        if (entryText.includes('lastVerified:')) {
            entryText = entryText.replace(/lastVerified:\s*"[^"]*"/, `lastVerified: "${today}"`);
        } else {
            // Add lastVerified before the closing brace
            entryText = entryText.replace(
                /(\s*applyUrl:\s*"[^"]*")\s*\}/,
                `$1,\n    lastVerified: "${today}"\n  }`
            );
        }
        updated = true;
        report.timestampsUpdated++;

        // Update deadline if scraped one is different and valid
        // Session-aware: only accept dates appropriate for the entry's session
        if (scrapedData.deadline) {
            const currentDeadline = entryText.match(/deadline:\s*"([^"]+)"/);
            const sessionMatch = entryText.match(/session:\s*"([^"]+)"/);
            const session = sessionMatch ? sessionMatch[1] : '';

            // Validate scraped date is reasonable for the session
            let isValidForSession = true;
            if (session.toLowerCase().includes('fall') && currentDeadline) {
                const currentDate = new Date(currentDeadline[1]);
                const scrapedDate = new Date(scrapedData.deadline);
                const todayDate = new Date(today);
                const diffMs = currentDate.getTime() - scrapedDate.getTime();
                const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);

                // Reject scraped dates that are already in the past
                if (scrapedDate < todayDate) {
                    isValidForSession = false;
                    console.log(`   ⏭️  Skipping deadline ${scrapedData.deadline} (date already passed, likely old/Spring entry)`);
                }
                // For Fall entries: reject scraped dates that are >3 months earlier
                // than the current deadline (likely a Spring semester date on the page)
                else if (diffMonths > 3) {
                    isValidForSession = false;
                    console.log(`   ⏭️  Skipping deadline ${scrapedData.deadline} (${Math.round(diffMonths)}mo earlier than current ${currentDeadline[1]}, likely Spring date)`);
                }
            }

            if (isValidForSession && currentDeadline && currentDeadline[1] !== scrapedData.deadline) {
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

        // Update testDate if scraped
        if (scrapedData.testDate) {
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

        // Replace in file content
        if (updated) {
            // We'll update the entries array with the new text for sorting later
            entry.fullMatch = entryText;
        }
        // Update the entry object in our local list so we can sort
        // We need to re-extract the deadline from the text to sort accurately
        const deadlineMatch = entryText.match(/deadline:\s*"([^"]+)"/);
        if (deadlineMatch) {
            entry.deadlineDate = new Date(deadlineMatch[1]);
        } else {
            entry.deadlineDate = new Date('2099-01-01'); // Far future if no deadline
        }
    }

    // Sort entries by deadline date
    entries.sort((a, b) => a.deadlineDate - b.deadlineDate);

    // Reconstruct the array string from sorted entries
    // We need to be careful to preserve the internal formatting of each entry
    // but re-order them in the file.

    // 1. Find the array block in the original content (we already did this: match[0])
    // 2. Map sorted entries to their full text
    // 3. Join them and replace the block

    const newArrayContent = entries.map(e => e.fullMatch).join(',\n  ');
    // The original regex captured the whole array content, we need to replace inside the brackets?
    // Actually, let's just reconstruct the whole export

    // We have the original full match of the array: deadlineMatch[0]
    // But we need to keep the indentation correct.

    const newExport = `export const upcomingDeadlines = [\n  ${newArrayContent}\n];`;

    fileContent = fileContent.replace(deadlineMatch[0], newExport);

    // Write updated file
    fs.writeFileSync(uniFilePath, fileContent, 'utf8');

    // Save report
    const reportsDir = path.join(__dirname, '..', '..', 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const reportPath = path.join(reportsDir, 'deadline-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Also save human-readable markdown report
    const mdReport = generateMarkdownReport(report);
    fs.writeFileSync(path.join(reportsDir, 'deadline-verification-report.md'), mdReport);

    // Print summary
    console.log(`\n${'='.repeat(40)}`);
    console.log(`📊 Verification Complete`);
    console.log(`   Entries processed: ${report.totalEntries}`);
    console.log(`   URLs checked: ${report.urlsChecked}`);
    console.log(`   URLs reachable: ${report.urlsReachable}`);
    console.log(`   Dates extracted: ${report.datesExtracted}`);
    console.log(`   Timestamps updated: ${report.timestampsUpdated}`);
    console.log(`   Date changes: ${report.changes.length}`);
    console.log(`   Errors: ${report.errors.length}`);

    if (report.changes.length > 0) {
        console.log(`\n📝 Changes:`);
        for (const c of report.changes) {
            console.log(`   ${c.shortName}: ${c.field} ${c.old} → ${c.new}`);
        }
    }

    return report;
}

function generateMarkdownReport(report) {
    let md = `# Deadline Verification Report\n\n`;
    md += `**Date:** ${report.runDate}\n\n`;
    md += `| Metric | Value |\n|---|---|\n`;
    md += `| Entries processed | ${report.totalEntries} |\n`;
    md += `| URLs checked | ${report.urlsChecked} |\n`;
    md += `| URLs reachable | ${report.urlsReachable} |\n`;
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

    if (report.errors.length > 0) {
        md += `## Errors\n\n| University | URL | Error |\n|---|---|---|\n`;
        for (const e of report.errors) {
            md += `| ${e.shortName} | ${e.url} | ${e.error} |\n`;
        }
    }

    return md;
}

// Export for testing
module.exports = { scrapeDeadlines, DEADLINE_SOURCES };

// Run if executed directly
if (require.main === module) {
    scrapeDeadlines()
        .then(report => {
            process.exit(report.errors.length > report.totalEntries / 2 ? 1 : 0);
        })
        .catch(err => {
            console.error('❌ Fatal error:', err);
            process.exit(1);
        });
}
