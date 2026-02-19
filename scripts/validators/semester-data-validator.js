/**
 * Semester Data Validator
 * Validates scraped recruiter, salary, and facilities data
 */

const fs = require('fs');
const path = require('path');

class SemesterDataValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    validate(data) {
        console.log('🔍 Semester Data Validator');
        console.log('==========================\n');

        // Validate recruiter data
        if (data.recruiters) {
            this.validateRecruiters(data.recruiters);
        }

        // Validate salary data
        if (data.salaries) {
            this.validateSalaries(data.salaries);
        }

        // Validate facilities data
        if (data.facilities) {
            this.validateFacilities(data.facilities);
        }

        return this.generateReport();
    }

    validateRecruiters(recruiters) {
        console.log('📋 Validating recruiter data...');

        Object.entries(recruiters).forEach(([university, data]) => {
            if (!data.recruiters || !Array.isArray(data.recruiters)) {
                this.errors.push(`${university}: Missing or invalid recruiters array`);
                return;
            }

            if (data.recruiters.length === 0) {
                this.warnings.push(`${university}: No recruiters found`);
            }

            if (data.recruiters.length > 20) {
                this.warnings.push(`${university}: Too many recruiters (${data.recruiters.length}), consider limiting`);
            }

            // Check for empty strings
            data.recruiters.forEach((recruiter, index) => {
                if (!recruiter || typeof recruiter !== 'string' || recruiter.trim().length === 0) {
                    this.errors.push(`${university}: Invalid recruiter at index ${index}`);
                }
            });

            console.log(`   ✅ ${university}: ${data.recruiters.length} recruiters`);
        });
    }

    validateSalaries(salaries) {
        console.log('💰 Validating salary data...');

        Object.entries(salaries).forEach(([university, data]) => {
            if (!data.avgStarting || typeof data.avgStarting !== 'number') {
                this.errors.push(`${university}: Missing or invalid avgStarting salary`);
            } else {
                // Check reasonable range (10k - 500k PKR)
                if (data.avgStarting < 10000) {
                    this.warnings.push(`${university}: Very low avgStarting salary: ${data.avgStarting}`);
                }
                if (data.avgStarting > 500000) {
                    this.warnings.push(`${university}: Very high avgStarting salary: ${data.avgStarting}`);
                }
            }

            if (!data.range || typeof data.range !== 'string') {
                this.warnings.push(`${university}: Missing salary range`);
            }

            console.log(`   ✅ ${university}: ${data.avgStarting ? `PKR ${data.avgStarting.toLocaleString()}` : 'N/A'}`);
        });
    }

    validateFacilities(facilities) {
        console.log('🏛️ Validating facilities data...');

        Object.entries(facilities).forEach(([university, data]) => {
            if (!data.facilities || !Array.isArray(data.facilities)) {
                this.errors.push(`${university}: Missing or invalid facilities array`);
                return;
            }

            if (data.facilities.length === 0) {
                this.warnings.push(`${university}: No facilities found`);
            }

            // Check for empty strings
            data.facilities.forEach((facility, index) => {
                if (!facility || typeof facility !== 'string' || facility.trim().length === 0) {
                    this.errors.push(`${university}: Invalid facility at index ${index}`);
                }
            });

            console.log(`   ✅ ${university}: ${data.facilities.length} facilities`);
        });
    }

    generateReport() {
        const report = {
            valid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            timestamp: new Date().toISOString()
        };

        console.log('\n📊 Validation Report');
        console.log('-------------------');
        console.log(`Status: ${report.valid ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`Errors: ${this.errors.length}`);
        console.log(`Warnings: ${this.warnings.length}`);

        if (this.errors.length > 0) {
            console.log('\nErrors:');
            this.errors.forEach(e => console.log(`  ❌ ${e}`));
        }

        if (this.warnings.length > 0) {
            console.log('\nWarnings:');
            this.warnings.forEach(w => console.log(`  ⚠️  ${w}`));
        }

        // Save report
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(reportsDir, 'semester-validation-report.json'),
            JSON.stringify(report, null, 2)
        );

        // Exit with error if validation failed
        if (!report.valid) {
            process.exit(1);
        }

        return report;
    }
}

// If run directly
if (require.main === module) {
    // Load data from reports directory
    const reportsDir = path.join(process.cwd(), 'reports');
    
    let data = {};
    
    try {
        if (fs.existsSync(path.join(reportsDir, 'recruiter-data.json'))) {
            data.recruiters = JSON.parse(fs.readFileSync(path.join(reportsDir, 'recruiter-data.json'), 'utf8'));
        }
        if (fs.existsSync(path.join(reportsDir, 'salary-data.json'))) {
            data.salaries = JSON.parse(fs.readFileSync(path.join(reportsDir, 'salary-data.json'), 'utf8'));
        }
        if (fs.existsSync(path.join(reportsDir, 'facilities-data.json'))) {
            data.facilities = JSON.parse(fs.readFileSync(path.join(reportsDir, 'facilities-data.json'), 'utf8'));
        }
    } catch (error) {
        console.error('Error loading data:', error.message);
        process.exit(1);
    }

    const validator = new SemesterDataValidator();
    validator.validate(data);
}

module.exports = SemesterDataValidator;
