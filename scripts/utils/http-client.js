/**
 * HTTP Client Utility
 * Wrapper for HTTP requests with retry logic and error handling
 */

const axios = require('axios');

/**
 * Fetch URL with retry logic
 * @param {string} url - URL to fetch
 * @param {object} options - Axios options
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise<object>} Response object
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios({
                url,
                method: options.method || 'GET',
                timeout: options.timeout || 10000,
                maxRedirects: options.maxRedirects || 5,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    ...options.headers
                },
                validateStatus: options.validateStatus || ((status) => status >= 200 && status < 400),
                ...options
            });
            
            return {
                success: true,
                data: response.data,
                status: response.status,
                headers: response.headers
            };
        } catch (error) {
            lastError = error;
            
            // Don't retry on client errors (4xx)
            if (error.response && error.response.status >= 400 && error.response.status < 500) {
                throw error;
            }
            
            // Exponential backoff: wait 1s, 2s, 4s
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
        }
    }
    
    throw lastError;
}

/**
 * Fetch HTML content
 * @param {string} url - URL to fetch
 * @param {object} options - Additional options
 * @returns {Promise<string>} HTML content
 */
async function fetchHTML(url, options = {}) {
    const response = await fetchWithRetry(url, {
        ...options,
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            ...options.headers
        }
    });
    
    return response.data;
}

/**
 * Fetch JSON content
 * @param {string} url - URL to fetch
 * @param {object} options - Additional options
 * @returns {Promise<object>} JSON object
 */
async function fetchJSON(url, options = {}) {
    const response = await fetchWithRetry(url, {
        ...options,
        headers: {
            'Accept': 'application/json',
            ...options.headers
        }
    });
    
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
}

module.exports = {
    fetchWithRetry,
    fetchHTML,
    fetchJSON
};
