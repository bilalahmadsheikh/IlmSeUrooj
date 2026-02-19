/**
 * Merit Scraper
 * Scrapes merit cutoff data from community sources
 * Sources: learnospot.com, paklearningspot.com, Reddit
 */

const fs = require('fs');
const path = require('path');

const MERIT_SOURCES = {
    FAST: {
        url: 'https://learnospot.com/fast-university-closing-merits/',
        name: 'FAST-NUCES'
    },
    COMSATS: {
        url: 'https://paklearningspot.com/comsats-university-merit-lists/',
        name: 'COMSATS'
    },
    NUST: {
        url: 'https://paklearningspot.com/nust-net-merit-lists/',
        name: 'NUST'
    },
    UET: {
        url: 'https://paklearningspot.com/uet-lahore-merit-lists/',
        name: 'UET Lahore'
    },
    GIKI: {
        url: 'https://paklearningspot.com/giki-merit-lists/',
        name: 'GIKI'
    }
};

const REDDIT_SOURCES = [
    'https://reddit.com/r/FASTNU/',
    'https://reddit.com/r/pakistan/search?q=merit+cutoff'
];

class MeritScraper {
    constructor() {
        this.year = process.env.MERIT_YEAR || new Date().getFullYear();
        this.results = {};
        this.errors = [];
    }

    async scrapeAll() {
        console.log(`\n📊 Merit Scraper - Year ${this.year}`);
        console.log('================================\n');

        const BaseScraper = require('./base-scraper');
        const scraper = new BaseScraper({ rateLimitDelay: 3000 });

        for (const [key, source] of Object.entries(MERIT_SOURCES)) {
            console.log(`🔍 Scraping ${source.name}...`);

            try {
                let meritData = null;

                // Try scraping with Cheerio first (faster)
                try {
                    const $ = await scraper.fetchWithCheerio(source.url);
                    meritData = this.extractMeritFromHTML($, key);
                } catch (cheerioError) {
                    // Fallback to Puppeteer for JavaScript-heavy sites
                    try {
                        const page = await scraper.fetchWithPuppeteer(source.url);
                        const content = await page.content();
                        const $ = require('cheerio').load(content);
                        meritData = this.extractMeritFromHTML($, key);
                        await page.close();
                    } catch (puppeteerError) {
                        console.log(`   ⚠️  Could not scrape: ${puppeteerError.message}`);
                    }
                }

                this.results[key] = {
                    university: source.name,
                    sourceUrl: source.url,
                    year: this.year,
                    lastScraped: new Date().toISOString(),
                    status: meritData ? 'scraped' : 'pending_manual_verification',
                    data: meritData
                };

                if (meritData) {
                    console.log(`   ✅ Scraped merit data`);
                } else {
                    console.log(`   ⚠️  Source identified but no data extracted: ${source.url}`);
                }
            } catch (error) {
                this.errors.push({ university: key, error: error.message });
                console.log(`   ❌ Error: ${error.message}`);
            }
        }

        await scraper.cleanup();
        return this.generateReport();
    }

    extractMeritFromHTML($, universityKey) {
        const meritData = {};
        const bodyText = $('body').text();

        // Extract percentages (e.g., "75.3%", "CS: 76.8%")
        const percentagePattern = /([A-Z]{2,4}|CS|SE|AI|DS|Cyber|EE|ME|CE|Pharm-D)[:\s]*(\d+\.?\d*)%/gi;
        const percentageMatches = [...bodyText.matchAll(percentagePattern)];

        if (percentageMatches.length > 0) {
            percentageMatches.forEach(match => {
                const program = match[1].trim();
                const cutoff = parseFloat(match[2]);
                if (cutoff > 40 && cutoff < 100) {
                    meritData[program] = cutoff;
                }
            });
        }

        // Extract positions (e.g., "#324", "Position: 450")
        const positionPattern = /(?:position|rank|seat|merit)[:\s]*#?(\d+)/gi;
        const positionMatches = [...bodyText.matchAll(positionPattern)];

        if (positionMatches.length > 0 && Object.keys(meritData).length === 0) {
            positionMatches.forEach((match, index) => {
                const position = parseInt(match[1]);
                if (position > 0 && position < 10000) {
                    meritData[`Position_${index + 1}`] = `#${position}`;
                }
            });
        }

        // Extract dates (for merit list publication dates)
        const datePattern = /(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/g;
        const dateMatches = [...bodyText.matchAll(datePattern)];
        if (dateMatches.length > 0) {
            meritData.publicationDate = dateMatches[0][0];
        }

        return Object.keys(meritData).length > 0 ? meritData : null;
    }

    generateReport() {
        const report = {
            year: this.year,
            scrapedAt: new Date().toISOString(),
            universities: this.results,
            errors: this.errors,
            sources: Object.values(MERIT_SOURCES).map(s => s.url),
            redditSources: REDDIT_SOURCES
        };

        // Generate markdown report for manual review
        let markdown = `# Merit List Update Report - ${this.year}\n\n`;
        markdown += `Generated: ${report.scrapedAt}\n\n`;
        markdown += `## Sources to Check\n\n`;

        for (const [key, source] of Object.entries(MERIT_SOURCES)) {
            markdown += `### ${source.name}\n`;
            markdown += `- URL: ${source.url}\n`;
            markdown += `- Status: Pending manual verification\n\n`;
        }

        markdown += `## Reddit Sources\n\n`;
        REDDIT_SOURCES.forEach(url => {
            markdown += `- ${url}\n`;
        });

        markdown += `\n## Action Required\n\n`;
        markdown += `1. Visit each source URL above\n`;
        markdown += `2. Extract merit cutoff data for ${this.year}\n`;
        markdown += `3. Update \`src/components/AdmissionPredictor/AdmissionPredictor.js\`\n`;
        markdown += `4. Update \`src/data/universities.js\` descriptions\n`;
        markdown += `5. Update \`docs/DATA-SOURCES.md\` with sources\n`;

        // Save reports
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(reportsDir, 'merit-report.json'),
            JSON.stringify(report, null, 2)
        );

        fs.writeFileSync(
            path.join(reportsDir, 'merit-report.md'),
            markdown
        );

        console.log(`\n📄 Reports saved to reports/`);
        console.log(`   - merit-report.json`);
        console.log(`   - merit-report.md`);

        return report;
    }
}

// Run scraper
const scraper = new MeritScraper();
scraper.scrapeAll().catch(console.error);
