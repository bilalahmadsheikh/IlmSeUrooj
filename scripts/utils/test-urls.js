/**
 * URL Testing Utility
 * Tests URL accessibility and content for scraper configurations
 * Tests with both Cheerio (fast) and Puppeteer (for JS-heavy sites)
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

// Test configuration
const TEST_CONFIG = {
    timeout: 15000,
    retries: 2,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    admissionKeywords: ['admission', 'deadline', 'apply', 'application', 'test', 'entry', 'undergraduate', 'admissions']
};

class URLTester {
    constructor() {
        this.results = [];
        this.browser = null;
    }

    async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
        return this.browser;
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Test URL with Cheerio (fast, for static HTML)
     */
    async testWithCheerio(url) {
        try {
            const response = await axios.get(url, {
                timeout: TEST_CONFIG.timeout,
                headers: {
                    'User-Agent': TEST_CONFIG.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                maxRedirects: 5,
                validateStatus: (status) => status >= 200 && status < 400
            });

            const $ = cheerio.load(response.data);
            const bodyText = $('body').text().toLowerCase();
            const title = $('title').text();
            const hasAdmissionContent = TEST_CONFIG.admissionKeywords.some(keyword => 
                bodyText.includes(keyword.toLowerCase()) || title.toLowerCase().includes(keyword.toLowerCase())
            );

            return {
                method: 'cheerio',
                success: true,
                status: response.status,
                hasContent: hasAdmissionContent,
                title: title.substring(0, 100),
                contentLength: bodyText.length,
                error: null
            };
        } catch (error) {
            return {
                method: 'cheerio',
                success: false,
                status: error.response?.status || null,
                hasContent: false,
                title: null,
                contentLength: 0,
                error: error.message
            };
        }
    }

    /**
     * Test URL with Puppeteer (for JS-heavy sites and Cloudflare protection)
     */
    async testWithPuppeteer(url) {
        let page = null;
        try {
            await this.initBrowser();
            page = await this.browser.newPage();
            
            await page.setUserAgent(TEST_CONFIG.userAgent);
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9'
            });

            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: TEST_CONFIG.timeout
            });

            const title = await page.title();
            const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
            const hasAdmissionContent = TEST_CONFIG.admissionKeywords.some(keyword => 
                bodyText.includes(keyword.toLowerCase()) || title.toLowerCase().includes(keyword.toLowerCase())
            );

            return {
                method: 'puppeteer',
                success: true,
                status: 200,
                hasContent: hasAdmissionContent,
                title: title.substring(0, 100),
                contentLength: bodyText.length,
                error: null
            };
        } catch (error) {
            return {
                method: 'puppeteer',
                success: false,
                status: null,
                hasContent: false,
                title: null,
                contentLength: 0,
                error: error.message
            };
        } finally {
            if (page) {
                await page.close();
            }
        }
    }

    /**
     * Test a single URL with both methods
     */
    async testURL(url, university) {
        console.log(`\n🔍 Testing: ${university} - ${url}`);
        
        const result = {
            university,
            url,
            cheerio: null,
            puppeteer: null,
            recommendation: null,
            working: false
        };

        // Test with Cheerio first (faster)
        result.cheerio = await this.testWithCheerio(url);
        
        // If Cheerio fails or no content, try Puppeteer
        if (!result.cheerio.success || !result.cheerio.hasContent) {
            console.log(`   ⚠️  Cheerio failed or no content, trying Puppeteer...`);
            result.puppeteer = await this.testWithPuppeteer(url);
        }

        // Determine recommendation
        if (result.cheerio.success && result.cheerio.hasContent) {
            result.recommendation = 'cheerio';
            result.working = true;
            console.log(`   ✅ Working with Cheerio`);
        } else if (result.puppeteer && result.puppeteer.success && result.puppeteer.hasContent) {
            result.recommendation = 'puppeteer';
            result.working = true;
            console.log(`   ✅ Working with Puppeteer`);
        } else {
            result.recommendation = 'failed';
            result.working = false;
            console.log(`   ❌ Failed`);
        }

        return result;
    }

    /**
     * Test multiple URLs for a university
     */
    async testUniversityURLs(university, urls) {
        const results = [];
        for (const url of urls) {
            const result = await this.testURL(url, university);
            results.push(result);
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return results;
    }

    /**
     * Generate test report
     */
    generateReport(allResults) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: 0,
                working: 0,
                failed: 0,
                cheerioOnly: 0,
                puppeteerOnly: 0
            },
            universities: {},
            recommendations: []
        };

        for (const [university, results] of Object.entries(allResults)) {
            report.summary.total += results.length;
            const workingURLs = results.filter(r => r.working);
            const failedURLs = results.filter(r => !r.working);
            
            report.summary.working += workingURLs.length;
            report.summary.failed += failedURLs.length;
            
            report.summary.cheerioOnly += results.filter(r => r.recommendation === 'cheerio').length;
            report.summary.puppeteerOnly += results.filter(r => r.recommendation === 'puppeteer').length;

            report.universities[university] = {
                total: results.length,
                working: workingURLs.length,
                failed: failedURLs.length,
                urls: results.map(r => ({
                    url: r.url,
                    working: r.working,
                    method: r.recommendation,
                    error: r.cheerio?.error || r.puppeteer?.error || null
                }))
            };

            // Add recommendation for best URL
            if (workingURLs.length > 0) {
                const bestURL = workingURLs.find(r => r.recommendation === 'cheerio') || workingURLs[0];
                report.recommendations.push({
                    university,
                    url: bestURL.url,
                    method: bestURL.recommendation,
                    reason: bestURL.recommendation === 'cheerio' ? 'Fast and reliable' : 'Requires JS rendering'
                });
            }
        }

        return report;
    }
}

// Test URLs from scraper configurations
const TEST_URLS = {
    'NUST': [
        'https://ugadmissions.nust.edu.pk',
        'https://nust.edu.pk/admissions/',
        'https://nust.edu.pk'
    ],
    'FAST': [
        'https://admissions.nu.edu.pk',
        'https://nu.edu.pk',
        'https://www.nu.edu.pk/Admissions'
    ],
    'LUMS': [
        'https://admissions.lums.edu.pk',
        'https://lums.edu.pk/admissions',
        'https://lums.edu.pk'
    ],
    'COMSATS': [
        'https://admissions.comsats.edu.pk',
        'https://www.comsats.edu.pk/Admissions.aspx',
        'https://www.comsats.edu.pk'
    ],
    'IBA': [
        'https://onlineadmission.iba.edu.pk',
        'https://www.iba.edu.pk/undergraduate.php',
        'https://www.iba.edu.pk',
        'https://admissions.iba.edu.pk'
    ],
    'GIKI': [
        'https://admissions.giki.edu.pk',
        'https://giki.edu.pk/admissions/',
        'https://giki.edu.pk'
    ],
    'UET Lahore': [
        'https://admission.uet.edu.pk',
        'https://apply.uet.edu.pk',
        'https://www.uet.edu.pk'
    ],
    'PIEAS': [
        'https://admissions.pieas.edu.pk',
        'https://www.pieas.edu.pk'
    ],
    'NED': [
        'https://www.neduet.edu.pk/admission',
        'https://www.neduet.edu.pk'
    ],
    'Bahria': [
        'https://cms.bahria.edu.pk',
        'https://bahria.edu.pk/admissions/',
        'https://bahria.edu.pk'
    ],
    'Air University': [
        'https://portals.au.edu.pk/Admissions',
        'https://au.edu.pk/Pages/Admission/how_to_apply.aspx',
        'https://au.edu.pk'
    ],
    'SZABIST': [
        'https://admissions.szabist-isb.edu.pk',
        'https://szabist-isb.edu.pk/admissions/',
        'https://szabist.edu.pk/admissions/'
    ],
    'Habib': [
        'https://eapplication.habib.edu.pk',
        'https://habib.edu.pk/admissions/',
        'https://habib.edu.pk'
    ],
    'AKU': [
        'https://www.aku.edu/admissions/Pages/home.aspx',
        'https://www.aku.edu/admissions',
        'https://www.aku.edu'
    ],
    'ITU': [
        'https://application.itu.edu.pk',
        'https://itu.edu.pk/admissions/',
        'https://itu.edu.pk'
    ]
};

// Main execution
async function main() {
    console.log('🔗 URL Testing Utility');
    console.log('======================\n');

    const tester = new URLTester();
    const allResults = {};

    try {
        for (const [university, urls] of Object.entries(TEST_URLS)) {
            console.log(`\n📋 Testing ${university}...`);
            allResults[university] = await tester.testUniversityURLs(university, urls);
        }

        // Generate report
        const report = tester.generateReport(allResults);

        // Save report
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const reportPath = path.join(reportsDir, 'url-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Print summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Summary');
        console.log('='.repeat(50));
        console.log(`Total URLs tested: ${report.summary.total}`);
        console.log(`✅ Working: ${report.summary.working}`);
        console.log(`❌ Failed: ${report.summary.failed}`);
        console.log(`⚡ Cheerio only: ${report.summary.cheerioOnly}`);
        console.log(`🌐 Puppeteer required: ${report.summary.puppeteerOnly}`);

        console.log('\n📝 Recommendations:');
        report.recommendations.forEach(rec => {
            console.log(`   ${rec.university}: ${rec.url} (${rec.method})`);
        });

        console.log(`\n✅ Report saved to: ${reportPath}`);

    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        await tester.closeBrowser();
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { URLTester, TEST_URLS };
