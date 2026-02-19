/**
 * Semester Data Scrapers
 * Scrapes recruiters, salaries, and facilities data
 */

const RecruiterScraper = require('./recruiter-scraper');
const SalaryScraper = require('./salary-scraper');
const FacilitiesScraper = require('./facilities-scraper');

// Export scrapers
module.exports = {
    RecruiterScraper,
    SalaryScraper,
    FacilitiesScraper
};

// If run directly
if (require.main === module) {
    const run = async () => {
        console.log('📊 Semester Data Scrapers');
        console.log('=========================\n');

        const recruiterScraper = new RecruiterScraper();
        const salaryScraper = new SalaryScraper();
        const facilitiesScraper = new FacilitiesScraper();

        const recruiters = await recruiterScraper.scrape();
        const salaries = await salaryScraper.scrape();
        const facilities = await facilitiesScraper.scrape();

        const report = { recruiters, salaries, facilities };

        // Save report
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(reportsDir, 'semester-data-report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('\n✅ Report saved to reports/semester-data-report.json');
    };

    run().catch(console.error);
}
