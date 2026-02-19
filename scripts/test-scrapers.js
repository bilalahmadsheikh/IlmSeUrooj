/**
 * Test Scrapers
 * Test all scraper implementations locally
 */

const RecruiterScraper = require('./scrapers/recruiter-scraper');
const SalaryScraper = require('./scrapers/salary-scraper');
const FacilitiesScraper = require('./scrapers/facilities-scraper');
const MeritScraper = require('./scrapers/merit-scraper');

async function testScrapers() {
    console.log('🧪 Testing Scrapers');
    console.log('===================\n');

    const results = {
        recruiters: null,
        salaries: null,
        facilities: null,
        merit: null,
        errors: []
    };

    // Test Recruiter Scraper
    try {
        console.log('1️⃣ Testing Recruiter Scraper...');
        const recruiterScraper = new RecruiterScraper();
        results.recruiters = await recruiterScraper.scrape();
        console.log('   ✅ Recruiter scraper passed\n');
    } catch (error) {
        console.log(`   ❌ Recruiter scraper failed: ${error.message}\n`);
        results.errors.push({ scraper: 'recruiter', error: error.message });
    }

    // Test Salary Scraper
    try {
        console.log('2️⃣ Testing Salary Scraper...');
        const salaryScraper = new SalaryScraper();
        results.salaries = await salaryScraper.scrape();
        console.log('   ✅ Salary scraper passed\n');
    } catch (error) {
        console.log(`   ❌ Salary scraper failed: ${error.message}\n`);
        results.errors.push({ scraper: 'salary', error: error.message });
    }

    // Test Facilities Scraper
    try {
        console.log('3️⃣ Testing Facilities Scraper...');
        const facilitiesScraper = new FacilitiesScraper();
        results.facilities = await facilitiesScraper.scrape();
        console.log('   ✅ Facilities scraper passed\n');
    } catch (error) {
        console.log(`   ❌ Facilities scraper failed: ${error.message}\n`);
        results.errors.push({ scraper: 'facilities', error: error.message });
    }

    // Test Merit Scraper
    try {
        console.log('4️⃣ Testing Merit Scraper...');
        const meritScraper = new MeritScraper();
        results.merit = await meritScraper.scrapeAll();
        console.log('   ✅ Merit scraper passed\n');
    } catch (error) {
        console.log(`   ❌ Merit scraper failed: ${error.message}\n`);
        results.errors.push({ scraper: 'merit', error: error.message });
    }

    // Summary
    console.log('📊 Test Summary');
    console.log('===============');
    console.log(`Total Tests: 4`);
    console.log(`Passed: ${4 - results.errors.length}`);
    console.log(`Failed: ${results.errors.length}`);

    if (results.errors.length > 0) {
        console.log('\nErrors:');
        results.errors.forEach(e => {
            console.log(`  ❌ ${e.scraper}: ${e.error}`);
        });
        process.exit(1);
    } else {
        console.log('\n✅ All scrapers passed!');
        process.exit(0);
    }
}

testScrapers().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
