/**
 * Data Comparison Engine
 * Compares current data against the known-good baseline.
 * Flags anomalies with severity levels: INFO, WARNING, ERROR.
 *
 * Usage: node scripts/validators/compare-data.js
 */

const fs = require('fs');
const path = require('path');
const { parseUniversities } = require('../utils/parse-universities');

const BASELINE_PATH = path.join(__dirname, '..', 'baselines', 'universities-baseline.json');

const THRESHOLDS = {
    maxRankingShift: 3,
    maxFeeChangePercent: 30,
    maxUniversityCountChange: 3,
    pastDeadlineDaysAllowed: 30
};

class DataComparator {
    constructor() {
        this.findings = [];
    }

    addFinding(severity, category, message, details = {}) {
        this.findings.push({ severity, category, message, details, timestamp: new Date().toISOString() });
        const icon = severity === 'ERROR' ? '❌' : severity === 'WARNING' ? '⚠️' : 'ℹ️';
        console.log(`  ${icon} [${severity}] ${message}`);
    }

    loadBaseline() {
        if (!fs.existsSync(BASELINE_PATH)) {
            console.log('⚠️  No baseline found. Run `node scripts/generate-baseline.js` first.');
            return null;
        }
        return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    }

    extractFeeNumber(feeStr) {
        if (!feeStr) return null;
        const m = feeStr.match(/([\d,]+)/);
        return m ? parseInt(m[1].replace(/,/g, '')) : null;
    }

    compare() {
        console.log('\n🔍 Data Comparison Engine');
        console.log('=========================\n');

        const baseline = this.loadBaseline();
        if (!baseline) {
            this.addFinding('INFO', 'baseline', 'No baseline exists — creating one now is recommended');
            return this.generateReport(false);
        }

        const currentData = parseUniversities();
        if (!currentData) {
            this.addFinding('ERROR', 'file', 'Failed to parse universities.js');
            return this.generateReport(true);
        }

        const baselineMap = new Map(baseline.universities.map(u => [u.id, u]));
        const currentMap = new Map(currentData.map(u => [u.id, u]));

        // 1. University count change
        const countDiff = currentData.length - baseline.universities.length;
        if (Math.abs(countDiff) > THRESHOLDS.maxUniversityCountChange) {
            this.addFinding('ERROR', 'count',
                `University count changed significantly: ${baseline.universities.length} → ${currentData.length} (${countDiff > 0 ? '+' : ''}${countDiff})`);
        } else if (countDiff !== 0) {
            this.addFinding('INFO', 'count',
                `University count changed: ${baseline.universities.length} → ${currentData.length}`);
        }

        // 2. Check for removed universities
        for (const [id, baseUni] of baselineMap) {
            if (!currentMap.has(id)) {
                this.addFinding('ERROR', 'removed', `University removed: ${baseUni.shortName} (ID: ${id})`);
            }
        }

        // 3. Check for new universities
        for (const [id, curUni] of currentMap) {
            if (!baselineMap.has(id)) {
                this.addFinding('INFO', 'added', `New university added: ${curUni.shortName} (ID: ${id})`);
            }
        }

        // 4. Per-university comparison
        for (const [id, curUni] of currentMap) {
            const baseUni = baselineMap.get(id);
            if (!baseUni) continue;

            const prefix = `[${curUni.shortName || 'ID:' + id}]`;

            // Ranking shift
            if (baseUni.ranking && curUni.ranking) {
                const shift = Math.abs(curUni.ranking - baseUni.ranking);
                if (shift > THRESHOLDS.maxRankingShift) {
                    this.addFinding('WARNING', 'ranking',
                        `${prefix} Ranking shifted: ${baseUni.ranking} → ${curUni.ranking} (${shift} positions)`);
                }
            }

            // Fee change
            const baseFee = this.extractFeeNumber(baseUni.avgFee);
            const curFee = this.extractFeeNumber(curUni.avgFee);
            if (baseFee && curFee) {
                const changePct = Math.abs((curFee - baseFee) / baseFee) * 100;
                if (changePct > THRESHOLDS.maxFeeChangePercent) {
                    this.addFinding('WARNING', 'fee',
                        `${prefix} Fee changed by ${changePct.toFixed(1)}%: PKR ${baseFee.toLocaleString()} → PKR ${curFee.toLocaleString()}`);
                }
            }

            // Website domain change
            if (baseUni.website && curUni.website) {
                try {
                    const baseDomain = new URL(baseUni.website).hostname;
                    const curDomain = new URL(curUni.website).hostname;
                    if (baseDomain !== curDomain) {
                        this.addFinding('ERROR', 'website',
                            `${prefix} Website domain changed: ${baseDomain} → ${curDomain}`);
                    }
                } catch { }
            }

            // Name change
            if (baseUni.name && curUni.name && baseUni.name !== curUni.name) {
                this.addFinding('WARNING', 'name', `${prefix} Name changed: "${baseUni.name}" → "${curUni.name}"`);
            }

            // City change
            if (baseUni.city && curUni.city && baseUni.city !== curUni.city) {
                this.addFinding('ERROR', 'city', `${prefix} City changed: ${baseUni.city} → ${curUni.city}`);
            }

            // Admission date sanity
            if (curUni.admissions?.deadline) {
                const deadline = new Date(curUni.admissions.deadline);
                const now = new Date();
                const daysPast = (now - deadline) / (1000 * 60 * 60 * 24);
                if (daysPast > THRESHOLDS.pastDeadlineDaysAllowed) {
                    this.addFinding('WARNING', 'date',
                        `${prefix} Deadline ${Math.floor(daysPast)} days past: ${curUni.admissions.deadline}`);
                }
            }

            if (curUni.admissions?.testDate && curUni.admissions?.deadline) {
                if (curUni.admissions.testDate < curUni.admissions.deadline) {
                    this.addFinding('WARNING', 'date',
                        `${prefix} Test date (${curUni.admissions.testDate}) before deadline (${curUni.admissions.deadline})`);
                }
            }

            // Missing required fields
            const requiredFields = ['name', 'shortName', 'city', 'website', 'avgFee', 'ranking'];
            for (const field of requiredFields) {
                if (baseUni[field] && !curUni[field]) {
                    this.addFinding('ERROR', 'missing',
                        `${prefix} Required field "${field}" was removed`);
                }
            }
        }

        return this.generateReport(this.findings.some(f => f.severity === 'ERROR'));
    }

    generateReport(hasCritical) {
        const report = {
            status: hasCritical ? 'NEEDS_REVIEW' : 'OK',
            findings: this.findings,
            summary: {
                errors: this.findings.filter(f => f.severity === 'ERROR').length,
                warnings: this.findings.filter(f => f.severity === 'WARNING').length,
                info: this.findings.filter(f => f.severity === 'INFO').length,
                total: this.findings.length
            },
            timestamp: new Date().toISOString()
        };

        console.log('\n📊 Comparison Summary');
        console.log('---------------------');
        console.log(`Status: ${report.status === 'OK' ? '✅ OK' : '🔍 NEEDS REVIEW'}`);
        console.log(`Errors: ${report.summary.errors} | Warnings: ${report.summary.warnings} | Info: ${report.summary.info}`);

        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
        fs.writeFileSync(path.join(reportsDir, 'comparison-report.json'), JSON.stringify(report, null, 2));

        let md = `## 🔍 Data Comparison Report\n\n`;
        md += `**Status:** ${report.status === 'OK' ? '✅ All Clear' : '⚠️ Review Needed'}\n\n`;
        if (report.findings.length > 0) {
            md += `| Severity | Category | Finding |\n|----------|----------|----------|\n`;
            for (const f of report.findings) {
                const icon = f.severity === 'ERROR' ? '❌' : f.severity === 'WARNING' ? '⚠️' : 'ℹ️';
                md += `| ${icon} ${f.severity} | ${f.category} | ${f.message} |\n`;
            }
        } else {
            md += `No changes detected. Data matches baseline.\n`;
        }
        fs.writeFileSync(path.join(reportsDir, 'comparison-report.md'), md);

        if (hasCritical) {
            console.log('\n❌ Critical issues found — manual review required.');
            process.exit(1);
        }

        return report;
    }
}

const comparator = new DataComparator();
comparator.compare();
