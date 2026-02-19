/**
 * University Data Fetcher & Updater
 * Orchestrates the scraping and update pipeline:
 *   1. Determine which tier to run (critical / general / all)
 *   2. Scrape university websites via university-scraper.js
 *   3. Parse current universities.js
 *   4. Merge scraped data into current data (only fields that changed)
 *   5. Write updated universities.js
 *   6. Generate a diff report
 *
 * Environment variables:
 *   DATA_TIER  - 'critical' | 'general' | 'all' (default: 'critical')
 *   DRY_RUN    - 'true' to skip writing changes (default: false)
 */

const fs = require('fs');
const path = require('path');
const { scrapeUniversities } = require('./scrapers/university-scraper');

const DATA_TIER = process.env.DATA_TIER || 'critical';
const DRY_RUN = process.env.DRY_RUN === 'true';

// ---------------------------------------------------------------------------
// Parse universities.js into a structured array
// ---------------------------------------------------------------------------

function parseUniversitiesFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Remove the export statement and extract just the array
    const arrayMatch = content.match(/export\s+const\s+universities\s*=\s*(\[[\s\S]*\]);?\s*(?:export|$)/);
    if (!arrayMatch) {
        throw new Error('Could not find universities array in file');
    }

    // Use Function constructor to safely eval the array literal
    // (it's a plain JS array with no external dependencies)
    const universities = new Function(`return ${arrayMatch[1]}`)();
    return universities;
}

// ---------------------------------------------------------------------------
// Merge scraped data into university objects
// ---------------------------------------------------------------------------

/**
 * Merge scraped data into university entries.
 * Only updates fields that were successfully scraped (non-empty).
 * Returns { updated: [...], changes: [...] }
 */
function mergeScrapedData(universities, scrapeReport) {
    const changes = [];
    const updated = universities.map(uni => ({ ...uni, admissions: { ...uni.admissions } }));

    for (const result of scrapeReport.results) {
        if (result.status === 'failed') continue;
        if (Object.keys(result.data).length === 0) continue;

        for (const id of result.ids) {
            const uniIndex = updated.findIndex(u => u.id === id);
            if (uniIndex === -1) continue;

            const uni = updated[uniIndex];
            const uniChanges = { university: uni.shortName || uni.name, id, fields: [] };

            // Merge flat-dotted keys (e.g., 'admissions.deadline' → uni.admissions.deadline)
            for (const [key, value] of Object.entries(result.data)) {
                if (!value) continue;

                if (key.startsWith('admissions.')) {
                    const subKey = key.replace('admissions.', '');
                    const oldValue = uni.admissions?.[subKey];
                    if (oldValue !== value) {
                        uni.admissions[subKey] = value;
                        uniChanges.fields.push({
                            field: key, old: oldValue || '(none)', new: value,
                        });
                    }
                } else {
                    const oldValue = uni[key];
                    if (oldValue !== value) {
                        uni[key] = value;
                        uniChanges.fields.push({
                            field: key, old: oldValue || '(none)', new: value,
                        });
                    }
                }
            }

            if (uniChanges.fields.length > 0) {
                changes.push(uniChanges);
            }
        }
    }

    return { updated, changes };
}

// ---------------------------------------------------------------------------
// Write updated universities back to the JS file
// ---------------------------------------------------------------------------

function writeUniversitiesFile(filePath, universities) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Reconstruct the file: keep everything before the array, replace the array, keep everything after
    const beforeMatch = content.match(/^([\s\S]*?export\s+const\s+universities\s*=\s*)/);
    const afterMatch = content.match(/\];\s*([\s\S]*?)$/);

    if (!beforeMatch) {
        throw new Error('Could not find array start in universities.js');
    }

    const before = beforeMatch[1];
    const after = afterMatch ? afterMatch[1] : '';

    // Serialize universities array with proper formatting
    const serialized = serializeUniversities(universities);

    const newContent = `${before}${serialized};\n${after}`;
    fs.writeFileSync(filePath, newContent, 'utf-8');
}

/**
 * Serialize the universities array to a formatted JS string.
 * Uses JSON.stringify with custom formatting to maintain readability.
 */
function serializeUniversities(universities) {
    const entries = universities.map(uni => {
        const lines = [];
        lines.push('  {');

        // Serialize each field in order
        const fieldOrder = [
            'id', 'name', 'shortName', 'logo', 'city', 'established', 'type',
            'ranking', 'fieldRankings', 'campusType', 'hostelAvailability',
            'fields', 'programs', 'degreeLevel', 'highlights', 'description',
            'website', 'avgFee', 'admissions',
        ];

        for (const key of fieldOrder) {
            if (!(key in uni)) continue;
            const value = uni[key];

            if (key === 'fieldRankings') {
                lines.push(`    fieldRankings: {`);
                const entries = Object.entries(value);
                entries.forEach(([k, v], i) => {
                    const comma = i < entries.length - 1 ? ',' : '';
                    lines.push(`      "${k}": ${v}${comma}`);
                });
                lines.push(`    },`);
            } else if (key === 'programs') {
                lines.push(`    programs: {`);
                const entries = Object.entries(value);
                entries.forEach(([k, v], i) => {
                    const comma = i < entries.length - 1 ? ',' : '';
                    lines.push(`      "${k}": ${JSON.stringify(v)}${comma}`);
                });
                lines.push(`    },`);
            } else if (key === 'admissions') {
                lines.push(`    admissions: {`);
                const admEntries = Object.entries(value);
                admEntries.forEach(([k, v], i) => {
                    const comma = i < admEntries.length - 1 ? ',' : '';
                    lines.push(`      ${k}: ${JSON.stringify(v)}${comma}`);
                });
                lines.push(`    }`);
            } else if (Array.isArray(value)) {
                lines.push(`    ${key}: ${JSON.stringify(value)},`);
            } else if (typeof value === 'string') {
                lines.push(`    ${key}: ${JSON.stringify(value)},`);
            } else {
                lines.push(`    ${key}: ${JSON.stringify(value)},`);
            }
        }

        lines.push('  }');
        return lines.join('\n');
    });

    return '[\n' + entries.join(',\n') + '\n]';
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function main() {
    console.log('\n🎓 University Data Update Pipeline');
    console.log('==================================');
    console.log(`Tier: ${DATA_TIER}`);
    console.log(`Dry Run: ${DRY_RUN}`);
    console.log(`Date: ${new Date().toISOString()}\n`);

    // 1. Scrape
    console.log('--- Step 1: Scraping ---');
    const scrapeReport = await scrapeUniversities({ tier: DATA_TIER });

    // 2. Save scrape report
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    fs.writeFileSync(
        path.join(reportsDir, 'scrape-results.json'),
        JSON.stringify(scrapeReport, null, 2)
    );

    // Check if any data was scraped
    const hasData = scrapeReport.results.some(r => Object.keys(r.data).length > 0);
    if (!hasData) {
        console.log('\n⚠️  No data could be extracted from any university website.');
        console.log('   This may be due to website changes or network issues.');
        console.log('   Check reports/scrape-results.json for details.');

        // Save empty change report
        fs.writeFileSync(
            path.join(reportsDir, 'change-report.json'),
            JSON.stringify({ changes: [], timestamp: new Date().toISOString(), tier: DATA_TIER }, null, 2)
        );

        process.exit(0);
    }

    // 3. Parse current data
    console.log('\n--- Step 2: Parsing current data ---');
    const universitiesPath = path.join(process.cwd(), 'src', 'data', 'universities.js');
    const universities = parseUniversitiesFile(universitiesPath);
    console.log(`   Loaded ${universities.length} universities`);

    // 4. Merge
    console.log('\n--- Step 3: Merging changes ---');
    const { updated, changes } = mergeScrapedData(universities, scrapeReport);

    // 5. Save change report
    const changeReport = {
        timestamp: new Date().toISOString(),
        tier: DATA_TIER,
        totalChanges: changes.reduce((sum, c) => sum + c.fields.length, 0),
        universitiesChanged: changes.length,
        changes,
    };

    fs.writeFileSync(
        path.join(reportsDir, 'change-report.json'),
        JSON.stringify(changeReport, null, 2)
    );

    console.log(`   Universities changed: ${changes.length}`);
    console.log(`   Total fields updated: ${changeReport.totalChanges}`);

    if (changes.length > 0) {
        console.log('\n   📋 Change Details:');
        for (const change of changes) {
            console.log(`   ${change.university} (ID: ${change.id}):`);
            for (const f of change.fields) {
                console.log(`     • ${f.field}: "${f.old}" → "${f.new}"`);
            }
        }
    }

    // 6. Write updates
    if (changes.length > 0 && !DRY_RUN) {
        console.log('\n--- Step 4: Writing updates ---');
        writeUniversitiesFile(universitiesPath, updated);
        console.log(`   ✅ Updated ${universitiesPath}`);
    } else if (DRY_RUN) {
        console.log('\n--- Step 4: Dry run — skipping write ---');
    } else {
        console.log('\n--- Step 4: No changes to write ---');
    }

    // 7. Summary
    console.log('\n📊 Pipeline Complete');
    console.log(`   Scrape: ${scrapeReport.successful} ok / ${scrapeReport.partial} partial / ${scrapeReport.failed} failed`);
    console.log(`   Changes: ${changeReport.totalChanges} fields across ${changes.length} universities`);
    console.log(`   Reports: reports/scrape-results.json, reports/change-report.json`);

    // Set GitHub Actions output
    if (process.env.GITHUB_OUTPUT) {
        const outputLines = [
            `has_changes=${changes.length > 0}`,
            `changes_count=${changeReport.totalChanges}`,
            `universities_changed=${changes.length}`,
        ];
        fs.appendFileSync(process.env.GITHUB_OUTPUT, outputLines.join('\n') + '\n');
    }
}

main().catch(err => {
    console.error('\n❌ Pipeline failed:', err.message);
    process.exit(1);
});
