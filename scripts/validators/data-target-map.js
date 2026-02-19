/**
 * Data Target Map
 * Defines which data types go to which files, and verifies that
 * modifications during automated updates only touch expected targets.
 *
 * Usage: node scripts/validators/data-target-map.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the allowed mapping: data type → target files
const DATA_TARGET_MAP = {
    universities: {
        targets: ['src/data/universities.js'],
        description: 'University list, rankings, fees, admissions info',
        schema: ['id', 'name', 'shortName', 'city', 'ranking', 'avgFee', 'website', 'admissions']
    },
    scholarships: {
        targets: ['src/data/scholarships.js'],
        description: 'Scholarship information',
        schema: ['id', 'name', 'amount', 'eligibility']
    },
    departments: {
        targets: ['src/data/departmentData.js'],
        description: 'Department-specific data',
        schema: ['name', 'programs']
    },
    meritCutoffs: {
        targets: ['src/components/AdmissionPredictor/AdmissionPredictor.js'],
        description: 'Merit cutoff values used in admission prediction',
        validRange: { min: 40, max: 95 }
    }
};

// Files that should NEVER be modified by automated workflows
const PROTECTED_FILES = [
    'package.json',
    'package-lock.json',
    'next.config.js',
    '.env',
    '.env.local',
    '.github/workflows/',
    'src/app/',
    'src/components/',   // except AdmissionPredictor
    'src/context/',
    'src/utils/',        // except ranking.js
    'public/'
];

// Exceptions: components that CAN be modified
const ALLOWED_EXCEPTIONS = [
    'src/components/AdmissionPredictor/AdmissionPredictor.js'
];

class DataTargetVerifier {
    constructor() {
        this.violations = [];
        this.verified = [];
    }

    verify() {
        console.log('🗺️  Data Target Map Verification');
        console.log('================================\n');

        // Get list of changed files from git
        let changedFiles = [];
        try {
            const diff = execSync('git diff --name-only HEAD', { encoding: 'utf8' }).trim();
            if (diff) changedFiles = diff.split('\n').filter(f => f);

            // Also check staged files
            const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
            if (staged) changedFiles.push(...staged.split('\n').filter(f => f));

            changedFiles = [...new Set(changedFiles)]; // deduplicate
        } catch {
            console.log('   ℹ️  Git not available or no changes — checking file existence only\n');
        }

        if (changedFiles.length === 0) {
            console.log('   ✅ No files changed\n');
            this.verifyTargetFilesExist();
            return this.generateReport();
        }

        console.log(`   📁 Changed files: ${changedFiles.length}`);
        changedFiles.forEach(f => console.log(`      - ${f}`));
        console.log();

        // Check each changed file against allowed targets
        for (const file of changedFiles) {
            this.checkFile(file);
        }

        // Verify target files exist
        this.verifyTargetFilesExist();

        return this.generateReport();
    }

    checkFile(file) {
        // Is it an allowed data target?
        const isTarget = Object.values(DATA_TARGET_MAP).some(mapping =>
            mapping.targets.some(t => file === t || file.startsWith(t))
        );

        // Is it an allowed exception?
        const isException = ALLOWED_EXCEPTIONS.some(e => file === e);

        // Is it protected?
        const isProtected = PROTECTED_FILES.some(p => file.startsWith(p));

        if (isTarget || isException) {
            this.verified.push({ file, status: 'ALLOWED', reason: 'Valid data target' });
            console.log(`   ✅ ${file} — valid data target`);
        } else if (isProtected) {
            this.violations.push({ file, status: 'VIOLATION', reason: 'Protected file modified' });
            console.log(`   ❌ ${file} — PROTECTED FILE MODIFIED`);
        } else if (file.startsWith('reports/') || file.startsWith('scripts/baselines/')) {
            this.verified.push({ file, status: 'ALLOWED', reason: 'Reports/baselines are OK' });
            console.log(`   ✅ ${file} — reports/baselines`);
        } else {
            this.violations.push({ file, status: 'UNEXPECTED', reason: 'File not in target map' });
            console.log(`   ⚠️  ${file} — unexpected modification`);
        }
    }

    verifyTargetFilesExist() {
        console.log('\n📂 Target File Existence Check:');
        for (const [type, mapping] of Object.entries(DATA_TARGET_MAP)) {
            for (const target of mapping.targets) {
                const fullPath = path.join(process.cwd(), target);
                const exists = fs.existsSync(fullPath);
                const icon = exists ? '✅' : '❌';
                console.log(`   ${icon} ${target} (${type})`);
                if (!exists) {
                    this.violations.push({ file: target, status: 'MISSING', reason: `Target file for ${type} does not exist` });
                }
            }
        }
    }

    generateReport() {
        const report = {
            status: this.violations.length === 0 ? 'PASS' : 'FAIL',
            verified: this.verified,
            violations: this.violations,
            targetMap: DATA_TARGET_MAP,
            timestamp: new Date().toISOString()
        };

        console.log('\n📊 Target Map Report');
        console.log('--------------------');
        console.log(`Status: ${report.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Verified: ${this.verified.length} | Violations: ${this.violations.length}`);

        if (this.violations.length > 0) {
            console.log('\nViolations:');
            this.violations.forEach(v => console.log(`  ❌ ${v.file}: ${v.reason}`));
        }

        // Save report
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
        fs.writeFileSync(path.join(reportsDir, 'target-map-report.json'), JSON.stringify(report, null, 2));

        if (this.violations.some(v => v.status === 'VIOLATION')) {
            process.exit(1);
        }

        return report;
    }
}

const verifier = new DataTargetVerifier();
verifier.verify();
