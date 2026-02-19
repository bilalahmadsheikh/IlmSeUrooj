/**
 * Generate Baseline Snapshot
 * Reads current universities.js and creates a JSON baseline for comparison.
 * Run this whenever current data is verified as correct.
 *
 * Usage: node scripts/generate-baseline.js
 */

const fs = require('fs');
const path = require('path');
const { parseUniversities } = require('./utils/parse-universities');

const BASELINE_DIR = path.join(__dirname, 'baselines');

function generateBaseline() {
    console.log('📸 Generating Baseline Snapshot');
    console.log('================================\n');

    const universities = parseUniversities();
    if (!universities || universities.length === 0) {
        console.log('❌ Failed to parse universities');
        process.exit(1);
    }

    const baseline = {
        metadata: {
            generatedAt: new Date().toISOString(),
            universityCount: universities.length,
            version: 1,
            description: 'Known-good data snapshot. New data is compared against this.'
        },
        universities,
        summary: {
            totalUniversities: universities.length,
            cities: [...new Set(universities.map(u => u.city).filter(Boolean))].sort(),
            types: [...new Set(universities.map(u => u.type).filter(Boolean))].sort(),
            rankingRange: {
                min: Math.min(...universities.map(u => u.ranking).filter(Boolean)),
                max: Math.max(...universities.map(u => u.ranking).filter(Boolean))
            },
            idRange: {
                min: Math.min(...universities.map(u => u.id).filter(Boolean)),
                max: Math.max(...universities.map(u => u.id).filter(Boolean))
            }
        }
    };

    if (!fs.existsSync(BASELINE_DIR)) {
        fs.mkdirSync(BASELINE_DIR, { recursive: true });
    }

    const outputPath = path.join(BASELINE_DIR, 'universities-baseline.json');
    fs.writeFileSync(outputPath, JSON.stringify(baseline, null, 2));

    console.log(`✅ Baseline generated: ${outputPath}`);
    console.log(`   Universities: ${baseline.summary.totalUniversities}`);
    console.log(`   Cities: ${baseline.summary.cities.join(', ')}`);
    console.log(`   Rankings: ${baseline.summary.rankingRange.min}-${baseline.summary.rankingRange.max}`);
    console.log(`   IDs: ${baseline.summary.idRange.min}-${baseline.summary.idRange.max}`);

    return baseline;
}

generateBaseline();
