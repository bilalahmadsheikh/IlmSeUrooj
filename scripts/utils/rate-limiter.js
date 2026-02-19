/**
 * Rate Limiter Utility
 * Prevents overwhelming servers with too many requests
 */

/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate limiter class
 */
class RateLimiter {
    constructor(delayMs = 1000) {
        this.delayMs = delayMs;
        this.lastRequestTime = 0;
    }

    /**
     * Execute function with rate limiting
     * @param {Function} fn - Function to execute
     * @param {...any} args - Arguments to pass to function
     * @returns {Promise<any>} Function result
     */
    async execute(fn, ...args) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.delayMs) {
            await delay(this.delayMs - timeSinceLastRequest);
        }
        
        this.lastRequestTime = Date.now();
        return await fn(...args);
    }
}

/**
 * Create a rate-limited wrapper for a function
 * @param {Function} fn - Function to wrap
 * @param {number} delayMs - Delay between calls in milliseconds
 * @returns {Function} Rate-limited function
 */
function withRateLimit(fn, delayMs = 1000) {
    const limiter = new RateLimiter(delayMs);
    return async (...args) => {
        return await limiter.execute(fn, ...args);
    };
}

module.exports = {
    delay,
    RateLimiter,
    withRateLimit
};
