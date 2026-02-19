/**
 * Schema Validator (Enhanced)
 * Validates each university object individually against strict schema.
 * Uses shared bracket-counting parser for reliable object extraction.
 *
 * Usage: node scripts/validators/schema-validator.js
 */

const fs = require('fs');
const path = require('path');
const { parseUniversities } = require('../utils/parse-universities');

const SCHEMAS = {
    university: {
        required: ['id', 'name', 'shortName', 'city', 'type', 'ranking', 'avgFee', 'website'],
        types: {
            id: 'number', name: 'string', shortName: 'string', city: 'string',
            established: 'number', type: 'string', ranking: 'number',
            avgFee: 'string', website: 'string', description: 'string',
            campusType: 'string', hostelAvailability: 'string'
        },
        patterns: {
            avgFee: /PKR/i,
            website: /^https?:\/\//
        },
        enums: {
            type: ['Public', 'Private'],
            hostelAvailability: ['On-Campus with Hostel', 'On-Campus without Hostel', 'Off-Campus'],
            campusType: ['Research-Oriented', 'Industry-Focused', 'Strong Campus Life']
        }
    },
    admissions: {
        required: ['deadline', 'testName', 'applyUrl'],
        types: {
            deadline: 'string', testName: 'string', testDate: 'string', applyUrl: 'string'
        },
        patterns: {
            deadline: /^\d{4}-\d{2}-\d{2}$/,
            testDate: /^\d{4}-\d{2}-\d{2}$/,
            applyUrl: /^https?:\/\//
        }
    }
};

class SchemaValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.validatedCount = 0;
    }

    validateField(data, field, schema, context) {
        if (schema.types && schema.types[field]) {
            if (field in data && data[field] !== null && data[field] !== undefined) {
                if (typeof data[field] !== schema.types[field]) {
                    this.errors.push(`${context}${field}: Expected ${schema.types[field]}, got ${typeof data[field]}`);
                    return false;
                }
            }
        }
        if (schema.patterns && schema.patterns[field]) {
            if (data[field] && !schema.patterns[field].test(data[field])) {
                this.warnings.push(`${context}${field}: "${data[field]}" doesn't match pattern`);
            }
        }
        if (schema.enums && schema.enums[field]) {
            if (data[field] && !schema.enums[field].includes(data[field])) {
                this.warnings.push(`${context}${field}: "${data[field]}" not in allowed values`);
            }
        }
        return true;
    }

    validateObject(data, schemaName, context = '') {
        const schema = SCHEMAS[schemaName];
        if (!schema) return false;
        let valid = true;

        for (const field of schema.required || []) {
            if (!(field in data) || data[field] === null || data[field] === undefined || data[field] === '') {
                this.errors.push(`${context}Missing required field: ${field}`);
                valid = false;
            }
        }

        for (const field of Object.keys(schema.types || {})) {
            if (field in data) {
                if (!this.validateField(data, field, schema, context)) valid = false;
            }
        }

        return valid;
    }

    validateUniversitiesFile() {
        const filePath = path.join(process.cwd(), 'src/data/universities.js');
        if (!fs.existsSync(filePath)) {
            this.errors.push('universities.js not found');
            return false;
        }

        console.log('📋 Validating universities.js...\n');

        const universities = parseUniversities(filePath);
        if (!universities) {
            this.errors.push('Failed to parse universities array');
            return false;
        }

        const ids = new Set();

        for (const uni of universities) {
            this.validatedCount++;
            const ctx = `  [${uni.shortName || 'ID:' + uni.id}] `;

            // Check duplicate IDs
            if (ids.has(uni.id)) {
                this.errors.push(`${ctx}Duplicate ID: ${uni.id}`);
            }
            ids.add(uni.id);

            // Validate university schema
            this.validateObject(uni, 'university', ctx);

            // Validate established year
            if (uni.established) {
                if (uni.established < 1800 || uni.established > new Date().getFullYear()) {
                    this.errors.push(`${ctx}Unreasonable year: ${uni.established}`);
                }
            }

            // Validate admissions
            if (uni.admissions) {
                this.validateObject(uni.admissions, 'admissions', ctx);

                if (uni.admissions.deadline && uni.admissions.testDate) {
                    if (uni.admissions.testDate < uni.admissions.deadline) {
                        this.warnings.push(`${ctx}Test date before deadline`);
                    }
                }

                if (uni.admissions.deadline) {
                    const d = new Date(uni.admissions.deadline);
                    if (isNaN(d.getTime())) {
                        this.errors.push(`${ctx}Invalid deadline: ${uni.admissions.deadline}`);
                    }
                }
            }
        }

        // Check export statement
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('export const universities')) {
            this.errors.push('Missing export statement');
        }
        if (content.match(/:\s*undefined[,\s]/)) {
            this.warnings.push('File contains literal undefined values');
        }

        console.log(`   Validated ${this.validatedCount} universities`);
        return this.errors.length === 0;
    }

    getReport() {
        return {
            valid: this.errors.length === 0,
            universitiesValidated: this.validatedCount,
            errors: this.errors,
            warnings: this.warnings,
            timestamp: new Date().toISOString()
        };
    }
}

// Run validation
const validator = new SchemaValidator();

console.log('🔍 Enhanced Schema Validator');
console.log('============================\n');

const isValid = validator.validateUniversitiesFile();
const report = validator.getReport();

console.log('\n📊 Validation Report');
console.log('-------------------');
console.log(`Status: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
console.log(`Universities: ${report.universitiesValidated}`);
console.log(`Errors: ${report.errors.length}`);
console.log(`Warnings: ${report.warnings.length}`);

if (report.errors.length > 0) {
    console.log('\nErrors:');
    report.errors.forEach(e => console.log(`  ❌ ${e}`));
}
if (report.warnings.length > 0) {
    console.log('\nWarnings:');
    report.warnings.forEach(w => console.log(`  ⚠️ ${w}`));
}

const reportsDir = path.join(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(path.join(reportsDir, 'validation-report.json'), JSON.stringify(report, null, 2));

let md = `## 🔍 Schema Validation Report\n\n`;
md += `**Status:** ${isValid ? '✅ Valid' : '❌ Invalid'} | **Universities:** ${report.universitiesValidated}\n\n`;
if (report.errors.length > 0) {
    md += `### Errors\n`;
    report.errors.forEach(e => { md += `- ❌ ${e}\n`; });
    md += '\n';
}
if (report.warnings.length > 0) {
    md += `### Warnings\n`;
    report.warnings.forEach(w => { md += `- ⚠️ ${w}\n`; });
}
fs.writeFileSync(path.join(reportsDir, 'validation-report.md'), md);

if (!isValid) process.exit(1);
