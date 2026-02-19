/**
 * URL Checker
 * Validates that all university URLs are accessible using real HTTP requests.
 * Uses Node.js built-in fetch (Node 18+).
 *
 * Usage: node scripts/utils/url-checker.js
 */

const fs = require('fs');
const path = require('path');

// University URLs to check (main sites + admission portals)
const URLS_TO_CHECK = [
    { name: 'NUST', url: 'https://nust.edu.pk', critical: true },
    { name: 'LUMS', url: 'https://lums.edu.pk', critical: true },
    { name: 'FAST', url: 'https://nu.edu.pk', critical: true },
    { name: 'COMSATS', url: 'https://comsats.edu.pk', critical: true },
    { name: 'GIKI', url: 'https://giki.edu.pk', critical: true },
    { name: 'IBA', url: 'https://iba.edu.pk', critical: true },
    { name: 'UET', url: 'https://uet.edu.pk', critical: true },
    { name: 'PIEAS', url: 'https://pieas.edu.pk', critical: false },
    { name: 'NED', url: 'https://neduet.edu.pk', critical: false },
    { name: 'Bahria', url: 'https://bahria.edu.pk', critical: false },
    // Admission portals
    { name: 'NUST Admissions', url: 'https://ugadmissions.nust.edu.pk', critical: true },
    { name: 'FAST Admissions', url: 'https://admissions.nu.edu.pk', critical: false },
    { name: 'COMSATS Admissions', url: 'https://admissions.comsats.edu.pk', critical: false },
    { name: 'LUMS Admissions', url: 'https://admissions.lums.edu.pk', critical: false }
];

const TIMEOUT_MS = 15000;
const MAX_CONCURRENT = 5;

class URLChecker {
    constructor() {
        this.results = [];
        this.failures = [];
    }

    async checkAll() {
        console.log('🔗 URL Checker (Real HTTP)');
        console.log('==========================\n');
        console.log(`Checking ${URLS_TO_CHECK.length} URLs (timeout: ${TIMEOUT_MS / 1000}s)...\n`);

        // Process in batches to avoid overwhelming
        for (let i = 0; i < URLS_TO_CHECK.length; i += MAX_CONCURRENT) {
            const batch = URLS_TO_CHECK.slice(i, i + MAX_CONCURRENT);
            const batchResults = await Promise.all(
                batch.map(({ name, url, critical }) => this.checkURL(name, url, critical))
            );
            this.results.push(...batchResults);
            for (const r of batchResults) {
                if (!r.success) this.failures.push(r);
            }
        }

        return this.generateReport();
    }

    async checkURL(name, url, critical) {
        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                redirect: 'follow',
                headers: {
                    'User-Agent': 'IlmSeUrooj-HealthCheck/1.0'
                }
            });

            clearTimeout(timeout);
            const responseTime = Date.now() - startTime;
            const success = response.status < 400;

            const icon = success ? '✅' : '❌';
            console.log(`${icon} ${name}: ${response.status} (${responseTime}ms)${success ? '' : ' — ' + response.statusText}`);

            return {
                name, url, critical, success,
                statusCode: response.status,
                responseTime,
                redirected: response.redirected,
                finalUrl: response.url,
                checkedAt: new Date().toISOString()
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            const isTimeout = error.name === 'AbortError';
            const errorMsg = isTimeout ? 'TIMEOUT' : error.message;

            console.log(`❌ ${name}: ${errorMsg} (${responseTime}ms)`);

            return {
                name, url, critical,
                success: false,
                error: errorMsg,
                responseTime,
                checkedAt: new Date().toISOString()
            };
        }
    }

    generateReport() {
        const criticalFailures = this.failures.filter(f => f.critical);

        const report = {
            status: criticalFailures.length > 0 ? 'CRITICAL' : this.failures.length > 0 ? 'WARNING' : 'OK',
            totalChecked: this.results.length,
            successful: this.results.filter(r => r.success).length,
            failed: this.failures.length,
            criticalFailures: criticalFailures.length,
            avgResponseTime: Math.round(
                this.results.filter(r => r.success).reduce((sum, r) => sum + r.responseTime, 0) /
                Math.max(1, this.results.filter(r => r.success).length)
            ),
            results: this.results,
            failures: this.failures,
            timestamp: new Date().toISOString()
        };

        console.log('\n📊 URL Check Report');
        console.log('-------------------');
        console.log(`Status: ${report.status === 'OK' ? '✅ All OK' : report.status === 'WARNING' ? '⚠️ Some failures' : '❌ Critical failures'}`);
        console.log(`Total: ${report.totalChecked} | OK: ${report.successful} | Failed: ${report.failed}`);
        console.log(`Avg response: ${report.avgResponseTime}ms`);

        if (this.failures.length > 0) {
            console.log('\n❌ Failed URLs:');
            this.failures.forEach(f => {
                console.log(`   ${f.critical ? '🔴' : '🟡'} ${f.name}: ${f.url}`);
                console.log(`      ${f.error || `HTTP ${f.statusCode}`}`);
            });
        }

        // Save report
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
        fs.writeFileSync(path.join(reportsDir, 'url-check-report.json'), JSON.stringify(report, null, 2));

        // Also write markdown
        let md = `## 🔗 URL Check Report\n\n`;
        md += `**Status:** ${report.status} | **Avg Response:** ${report.avgResponseTime}ms\n\n`;
        md += `| URL | Status | Time |\n|-----|--------|------|\n`;
        for (const r of this.results) {
            const icon = r.success ? '✅' : '❌';
            md += `| ${r.name} | ${icon} ${r.success ? r.statusCode : (r.error || r.statusCode)} | ${r.responseTime}ms |\n`;
        }
        fs.writeFileSync(path.join(reportsDir, 'url-check-report.md'), md);

        // Exit with error only if critical URLs fail
        if (criticalFailures.length > 0) {
            console.log(`\n🔴 ${criticalFailures.length} critical URL(s) failed — action required`);
            process.exit(1);
        }

        return report;
    }
}

const checker = new URLChecker();
checker.checkAll().catch(error => {
    console.error('URL checker failed:', error);
    process.exit(1);
});
