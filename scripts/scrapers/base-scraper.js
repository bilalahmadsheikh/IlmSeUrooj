/**
 * Base Scraper Class
 * Common utilities for all scrapers
 */

const { fetchHTML, fetchWithRetry } = require('../utils/http-client');
const { delay } = require('../utils/rate-limiter');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

class BaseScraper {
    constructor(options = {}) {
        this.rateLimitDelay = options.rateLimitDelay || 1000;
        this.maxRetries = options.maxRetries || 3;
        this.timeout = options.timeout || 30000;
        this.browser = null;
    }

    /**
     * Fetch HTML using Cheerio (for static sites)
     * @param {string} url - URL to fetch
     * @returns {Promise<object>} Cheerio instance
     */
    async fetchWithCheerio(url) {
        await delay(this.rateLimitDelay);
        const html = await fetchHTML(url);
        return cheerio.load(html);
    }

    /**
     * Fetch HTML using Puppeteer (for JavaScript-heavy sites)
     * @param {string} url - URL to fetch
     * @param {object} options - Puppeteer options
     * @returns {Promise<object>} Page object
     */
    async fetchWithPuppeteer(url, options = {}) {
        await delay(this.rateLimitDelay);
        
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
        
        const page = await this.browser.newPage();
        await page.goto(url, { 
            waitUntil: options.waitUntil || 'networkidle2',
            timeout: this.timeout 
        });
        
        return page;
    }

    /**
     * Extract date from text
     * @param {string} text - Text containing date
     * @returns {string|null} ISO date string or null
     */
    extractDate(text) {
        if (!text) return null;
        
        // Try various date formats
        const datePatterns = [
            /(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
            /(\d{2}\/\d{2}\/\d{4})/, // DD/MM/YYYY
            /(\d{2}-\d{2}-\d{4})/, // DD-MM-YYYY
            /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/i
        ];
        
        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                try {
                    const date = new Date(match[0]);
                    if (!isNaN(date.getTime())) {
                        return date.toISOString().split('T')[0];
                    }
                } catch (e) {
                    continue;
                }
            }
        }
        
        return null;
    }

    /**
     * Extract fee amount from text
     * @param {string} text - Text containing fee
     * @returns {string|null} Formatted fee string or null
     */
    extractFee(text) {
        if (!text) return null;
        
        // Look for PKR amounts
        const feePattern = /PKR\s*[\d,]+(?:\s*per\s*(?:semester|year|month))?/i;
        const match = text.match(feePattern);
        
        if (match) {
            return match[0];
        }
        
        // Look for numbers with currency symbols
        const numberPattern = /[\d,]+(?:\s*(?:PKR|Rs|rupees))?/i;
        const numberMatch = text.match(numberPattern);
        
        if (numberMatch) {
            return `PKR ${numberMatch[0].replace(/[^\d,]/g, '')}`;
        }
        
        return null;
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

module.exports = BaseScraper;
