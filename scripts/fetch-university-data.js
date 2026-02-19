/**
 * University Data Fetcher
 * Fetches admission deadlines, fees, and test dates from official sources
 */

const fs = require('fs');
const path = require('path');
const BaseScraper = require('./scrapers/base-scraper');
const { updateUniversityField } = require('./utils/ast-manipulator');
const { delay } = require('./utils/rate-limiter');

// University source configurations
const UNIVERSITY_SOURCES = {
    FAST: {
        name: 'FAST-NUCES',
        admissionUrl: 'https://www.nu.edu.pk/Admissions',
        feeUrl: 'https://www.nu.edu.pk/Admissions/FeeStructure',
        campuses: ['Islamabad', 'Lahore', 'Karachi', 'Peshawar', 'Chiniot-Faisalabad']
    },
    NUST: {
        name: 'NUST',
        admissionUrl: 'https://ugadmissions.nust.edu.pk',
        feeUrl: 'https://nust.edu.pk/admissions/ugfee'
    },
    COMSATS: {
        name: 'COMSATS',
        admissionUrl: 'https://admissions.comsats.edu.pk',
        campuses: ['Islamabad', 'Lahore', 'Wah', 'Abbottabad', 'Sahiwal', 'Attock', 'Vehari']
    },
    LUMS: {
        name: 'LUMS',
        admissionUrl: 'https://admissions.lums.edu.pk',
        feeUrl: 'https://lums.edu.pk/student-financial-aid'
    },
    GIKI: {
        name: 'GIKI',
        admissionUrl: 'https://giki.edu.pk/admissions',
        feeUrl: 'https://giki.edu.pk/admissions/fee-structure'
    },
    IBA: {
        name: 'IBA Karachi',
        admissionUrl: 'https://iba.edu.pk/admissions',
        feeUrl: 'https://iba.edu.pk/fee-structure'
    },
    UET: {
        name: 'UET Lahore',
        admissionUrl: 'https://uet.edu.pk/admissions',
        feeUrl: 'https://uet.edu.pk/home/fee_schedule'
    }
};

// Data type to fetch
const dataType = process.env.DATA_TYPE || 'all';

async function fetchUniversityData() {
    console.log(`\n🎓 University Data Fetcher`);
    console.log(`========================`);
    console.log(`Data Type: ${dataType}`);
    console.log(`Date: ${new Date().toISOString()}\n`);

    const results = {
        timestamp: new Date().toISOString(),
        universities: {},
        errors: []
    };

    for (const [key, config] of Object.entries(UNIVERSITY_SOURCES)) {
        console.log(`📍 Fetching data for ${config.name}...`);

        try {
            const data = await fetchUniversityInfo(config);
            results.universities[key] = data;
            console.log(`   ✅ ${config.name} - Success`);
        } catch (error) {
            console.log(`   ❌ ${config.name} - Error: ${error.message}`);
            results.errors.push({
                university: key,
                error: error.message
            });
        }
    }

    // Save results
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(reportsDir, 'fetch-results.json'),
        JSON.stringify(results, null, 2)
    );

    console.log(`\n📊 Fetch Complete`);
    console.log(`   Universities: ${Object.keys(results.universities).length}`);
    console.log(`   Errors: ${results.errors.length}`);

    // Update data files if changes detected
    if (Object.keys(results.universities).length > 0) {
        await updateDataFiles(results.universities);
    }

    return results;
}

async function fetchUniversityInfo(config) {
    const scraper = new BaseScraper({ rateLimitDelay: 2000 });
    
    try {
        let deadline = null;
        let testDate = null;
        let testName = null;
        let avgFee = null;
        
        // Fetch admission page
        try {
            const $ = await scraper.fetchWithCheerio(config.admissionUrl);
            
            // Try to extract deadline
            const deadlineText = $('body').text();
            deadline = scraper.extractDate(deadlineText);
            
            // Try to find test date
            testDate = scraper.extractDate(deadlineText);
            
            // Try to find test name
            const testNamePatterns = ['NET', 'LCAT', 'ECAT', 'NAT', 'Entry Test', 'Aptitude Test'];
            for (const pattern of testNamePatterns) {
                if (deadlineText.includes(pattern)) {
                    testName = pattern;
                    break;
                }
            }
        } catch (error) {
            console.log(`   ⚠️ Could not scrape admission page: ${error.message}`);
        }
        
        // Fetch fee page if available
        if (config.feeUrl) {
            try {
                await delay(1000);
                const $ = await scraper.fetchWithCheerio(config.feeUrl);
                const feeText = $('body').text();
                avgFee = scraper.extractFee(feeText);
            } catch (error) {
                console.log(`   ⚠️ Could not scrape fee page: ${error.message}`);
            }
        }
        
        await scraper.cleanup();
        
        return {
            name: config.name,
            shortName: config.name.split(' ')[0], // Extract short name
            sourceUrl: config.admissionUrl,
            deadline,
            testDate,
            testName: testName || 'Entry Test',
            avgFee,
            applyUrl: config.admissionUrl,
            lastChecked: new Date().toISOString(),
            status: deadline || avgFee ? 'success' : 'partial'
        };
    } catch (error) {
        await scraper.cleanup();
        throw error;
    }
}

async function updateDataFiles(universitiesData) {
    console.log(`\n📝 Updating data files...`);

    const universitiesPath = path.join(process.cwd(), 'src/data/universities.js');

    if (!fs.existsSync(universitiesPath)) {
        console.log(`   ⚠️ universities.js not found`);
        return;
    }

    let updateCount = 0;

    for (const [key, data] of Object.entries(universitiesData)) {
        try {
            // Skip if no useful data was scraped
            if (data.status === 'pending_implementation' || (!data.deadline && !data.avgFee)) {
                console.log(`   ⏭️  Skipping ${data.name} - no data to update`);
                continue;
            }

            // Update admissions data if available
            if (data.deadline || data.testDate || data.testName) {
                const admissionsData = {};
                if (data.deadline) admissionsData.deadline = data.deadline;
                if (data.testDate) admissionsData.testDate = data.testDate;
                if (data.testName) admissionsData.testName = data.testName;
                if (data.applyUrl) admissionsData.applyUrl = data.applyUrl;

                try {
                    updateUniversityField(universitiesPath, data.shortName || key, 'admissions', admissionsData);
                    console.log(`   ✅ Updated admissions for ${data.name}`);
                    updateCount++;
                } catch (error) {
                    console.log(`   ⚠️  Could not update admissions for ${data.name}: ${error.message}`);
                }
            }

            // Update fee if available
            if (data.avgFee) {
                try {
                    updateUniversityField(universitiesPath, data.shortName || key, 'avgFee', data.avgFee);
                    console.log(`   ✅ Updated fee for ${data.name}`);
                    if (!data.deadline) updateCount++;
                } catch (error) {
                    console.log(`   ⚠️  Could not update fee for ${data.name}: ${error.message}`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Error updating ${data.name}: ${error.message}`);
        }
    }

    console.log(`\n   📊 Updated ${updateCount} universities`);
}

// Run the fetcher
fetchUniversityData().catch(console.error);
