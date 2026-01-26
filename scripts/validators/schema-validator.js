/**
 * Schema Validator
 * Validates university data against defined schemas
 */

const fs = require('fs');
const path = require('path');

// Define schemas for different data types
const SCHEMAS = {
    university: {
        required: ['id', 'name', 'shortName', 'city', 'type', 'ranking', 'avgFee', 'website'],
        types: {
            id: 'number',
            name: 'string',
            shortName: 'string',
            city: 'string',
            established: 'number',
            type: 'string',
            ranking: 'number',
            avgFee: 'string',
            website: 'string'
        },
        patterns: {
            avgFee: /^PKR\s[\d,]+/,
            website: /^https?:\/\//
        }
    },

    admissions: {
        required: ['deadline', 'testName', 'applyUrl'],
        types: {
            deadline: 'string',
            testName: 'string',
            testDate: 'string',
            applyUrl: 'string'
        },
        patterns: {
            deadline: /^\d{4}-\d{2}-\d{2}$/,
            testDate: /^\d{4}-\d{2}-\d{2}$/,
            applyUrl: /^https?:\/\//
        }
    },

    admissionCriteria: {
        required: ['minFsc', 'formula', 'cutoffs'],
        types: {
            minFsc: 'number',
            competitiveFsc: 'number',
            formula: 'string',
            description: 'string',
            tips: 'string'
        }
    }
};

class SchemaValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    validate(data, schemaName, context = '') {
        const schema = SCHEMAS[schemaName];
        if (!schema) {
            this.errors.push(`Unknown schema: ${schemaName}`);
            return false;
        }

        let isValid = true;

        // Check required fields
        for (const field of schema.required || []) {
            if (!(field in data) || data[field] === null || data[field] === undefined) {
                this.errors.push(`${context}Missing required field: ${field}`);
                isValid = false;
            }
        }

        // Check types
        for (const [field, expectedType] of Object.entries(schema.types || {})) {
            if (field in data && data[field] !== null && data[field] !== undefined) {
                const actualType = typeof data[field];
                if (actualType !== expectedType) {
                    this.errors.push(`${context}${field}: Expected ${expectedType}, got ${actualType}`);
                    isValid = false;
                }
            }
        }

        // Check patterns
        for (const [field, pattern] of Object.entries(schema.patterns || {})) {
            if (field in data && data[field]) {
                if (!pattern.test(data[field])) {
                    this.warnings.push(`${context}${field}: Does not match expected pattern`);
                }
            }
        }

        return isValid;
    }

    validateUniversitiesFile() {
        const filePath = path.join(process.cwd(), 'src/data/universities.js');

        if (!fs.existsSync(filePath)) {
            this.errors.push('universities.js not found');
            return false;
        }

        console.log('📋 Validating universities.js...\n');

        // Read and parse the file
        const content = fs.readFileSync(filePath, 'utf8');

        // Extract university objects (simplified parsing)
        const universityRegex = /\{\s*id:\s*(\d+)/g;
        const matches = content.matchAll(universityRegex);
        const universityCount = [...matches].length;

        console.log(`   Found ${universityCount} universities`);

        // Basic structure checks
        if (content.includes('export const universities')) {
            console.log('   ✅ Export statement found');
        } else {
            this.errors.push('Missing export statement');
        }

        // Check for common issues
        if (content.includes('undefined')) {
            this.warnings.push('File contains "undefined" values');
        }

        if (content.includes('null,')) {
            this.warnings.push('File contains null values');
        }

        return this.errors.length === 0;
    }

    getReport() {
        return {
            valid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            timestamp: new Date().toISOString()
        };
    }
}

// Run validation
const validator = new SchemaValidator();

console.log('🔍 Schema Validator');
console.log('==================\n');

const isValid = validator.validateUniversitiesFile();

const report = validator.getReport();

console.log('\n📊 Validation Report');
console.log('-------------------');
console.log(`Status: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
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

// Save report
const reportsDir = path.join(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

fs.writeFileSync(
    path.join(reportsDir, 'validation-report.json'),
    JSON.stringify(report, null, 2)
);

// Exit with error if validation failed
if (!isValid) {
    process.exit(1);
}
