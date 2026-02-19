# Scrapers Documentation

Complete guide to all scraper implementations in IlmSeUrooj.

---

## Overview

All scrapers have been upgraded from placeholder implementations to fully functional code that actually fetches data from university websites and updates the repository files.

---

## Architecture

### Base Scraper Class

**File**: `scripts/scrapers/base-scraper.js`

Provides common functionality for all scrapers:
- HTTP request handling with retry logic
- Rate limiting to prevent server overload
- Cheerio integration for HTML parsing
- Puppeteer integration for JavaScript-heavy sites
- Date and fee extraction utilities
- Resource cleanup

**Key Methods**:
- `fetchWithCheerio(url)` - Fetch and parse HTML with Cheerio
- `fetchWithPuppeteer(url)` - Fetch with headless browser
- `extractDate(text)` - Extract dates from text
- `extractFee(text)` - Extract fee amounts from text
- `cleanup()` - Close browser instances

---

## Scrapers

### 1. University Data Fetcher

**File**: `scripts/fetch-university-data.js`

**Purpose**: Fetches admission deadlines, fees, and test dates from university websites.

**How It Works**:
1. Iterates through configured university sources
2. Scrapes admission pages using Cheerio
3. Extracts deadlines, test dates, and fees using regex patterns
4. Updates `src/data/universities.js` using AST manipulation
5. Preserves file formatting and comments

**Supported Universities**:
- NUST, LUMS, FAST, COMSATS, GIKI, IBA, UET

**Data Extracted**:
- Admission deadlines
- Test dates
- Test names
- Fee structures
- Apply URLs

**Usage**:
```bash
DATA_TYPE=all node scripts/fetch-university-data.js
```

---

### 2. Recruiter Scraper

**File**: `scripts/scrapers/recruiter-scraper.js`

**Purpose**: Scrapes top recruiters from university career pages.

**How It Works**:
1. Scrapes university career services pages
2. Extracts recruiter names from HTML lists/tables
3. Falls back to known recruiters if scraping fails
4. Returns structured data with source URLs

**Supported Universities**:
- NUST, LUMS, FAST, COMSATS, GIKI

**Data Extracted**:
- Top 10 recruiters per university
- Source URLs
- Last updated timestamp

**Usage**:
```bash
node scripts/scrapers/recruiter-scraper.js
```

**Output**: `reports/recruiter-data.json`

---

### 3. Salary Scraper

**File**: `scripts/scrapers/salary-scraper.js`

**Purpose**: Scrapes salary data from various sources.

**How It Works**:
1. Attempts to scrape Glassdoor and LinkedIn (may require authentication)
2. Falls back to industry reports and HEC surveys
3. Returns average starting salaries and ranges

**Data Sources**:
- Glassdoor Pakistan (if accessible)
- LinkedIn Salary Insights (if accessible)
- HEC Graduate Surveys
- Industry Reports (fallback)

**Data Extracted**:
- Average starting salary
- Salary range
- Currency (PKR)

**Usage**:
```bash
node scripts/scrapers/salary-scraper.js
```

**Output**: `reports/salary-data.json`

---

### 4. Facilities Scraper

**File**: `scripts/scrapers/facilities-scraper.js`

**Purpose**: Scrapes facilities information from university websites.

**How It Works**:
1. Scrapes university facilities pages
2. Extracts facility names using keyword matching
3. Filters common facilities (Library, Labs, Sports, etc.)
4. Returns structured list of facilities

**Supported Universities**:
- NUST, LUMS, FAST, GIKI

**Data Extracted**:
- List of facilities (up to 15)
- Source URLs
- Last updated timestamp

**Usage**:
```bash
node scripts/scrapers/facilities-scraper.js
```

**Output**: `reports/facilities-data.json`

---

### 5. Merit Scraper

**File**: `scripts/scrapers/merit-scraper.js`

**Purpose**: Scrapes merit cutoff data from community sources.

**How It Works**:
1. Attempts Cheerio scraping first (faster)
2. Falls back to Puppeteer for JavaScript-heavy sites
3. Extracts merit percentages and positions using regex
4. Generates structured reports for manual review

**Data Sources**:
- learnospot.com (FAST)
- paklearningspot.com (COMSATS, NUST, GIKI, UET)
- Reddit discussions (if accessible)

**Data Extracted**:
- Program-specific cutoffs (percentages)
- Merit positions (for position-based universities)
- Publication dates

**Usage**:
```bash
MERIT_YEAR=2024 node scripts/scrapers/merit-scraper.js
```

**Output**: 
- `reports/merit-report.json`
- `reports/merit-report.md`

---

## Utility Modules

### HTTP Client

**File**: `scripts/utils/http-client.js`

**Features**:
- Retry logic with exponential backoff
- Timeout handling
- Redirect following
- Status code validation
- Error handling

**Key Functions**:
- `fetchWithRetry(url, options, maxRetries)` - Fetch with retry
- `fetchHTML(url, options)` - Fetch HTML content
- `fetchJSON(url, options)` - Fetch JSON content

---

### AST Manipulator

**File**: `scripts/utils/ast-manipulator.js`

**Purpose**: Safely update JavaScript files while preserving formatting.

**How It Works**:
1. Parses JavaScript file using Babel parser
2. Traverses AST to find target nodes
3. Updates specific fields
4. Regenerates code using Recast (preserves formatting)

**Key Functions**:
- `parseFile(filePath)` - Parse file to AST
- `findUniversityNode(ast, identifier)` - Find university by shortName or id
- `updateUniversityField(filePath, identifier, field, value)` - Update field
- `createASTNode(value)` - Convert JS value to AST node

**Example**:
```javascript
const { updateUniversityField } = require('./utils/ast-manipulator');

// Update NUST admissions deadline
updateUniversityField(
  'src/data/universities.js',
  'NUST',
  'admissions',
  {
    deadline: '2026-12-31',
    testDate: '2026-12-31',
    testName: 'NET Series II'
  }
);
```

---

### Rate Limiter

**File**: `scripts/utils/rate-limiter.js`

**Purpose**: Prevent overwhelming servers with too many requests.

**Features**:
- Configurable delay between requests
- Rate limiter class for sequential operations
- Wrapper function for rate-limited execution

**Usage**:
```javascript
const { delay, withRateLimit } = require('./utils/rate-limiter');

// Simple delay
await delay(2000); // Wait 2 seconds

// Rate-limited function
const rateLimitedFetch = withRateLimit(fetch, 1000);
await rateLimitedFetch('https://example.com');
```

---

## URL Checker

**File**: `scripts/utils/url-checker.js`

**Purpose**: Validates that all university URLs are accessible.

**How It Works**:
1. Makes HEAD requests to all configured URLs
2. Checks HTTP status codes (200-399 = success)
3. Measures response times
4. Reports failures and generates report

**Features**:
- 10-second timeout per URL
- Handles redirects (up to 5)
- Retry logic for transient failures
- Detailed error reporting

**Usage**:
```bash
node scripts/utils/url-checker.js
```

**Output**: `reports/url-check-report.json`

---

## Testing

### Test Scrapers

**File**: `scripts/test-scrapers.js`

Tests all scraper implementations:
- Recruiter scraper
- Salary scraper
- Facilities scraper
- Merit scraper

**Usage**:
```bash
npm run test-scrapers
```

---

### Test File Updates

**File**: `scripts/test-file-updates.js`

Tests AST manipulation:
- File parsing
- Node finding
- Field updates
- Format preservation

**Usage**:
```bash
npm run test-file-updates
```

**Note**: Creates a backup before testing and restores it afterward.

---

## Error Handling

All scrapers implement comprehensive error handling:

1. **Try-Catch Blocks**: Wrap all scraping operations
2. **Retry Logic**: Automatic retries with exponential backoff
3. **Fallback Data**: Use known data if scraping fails
4. **Partial Results**: Continue processing other items if one fails
5. **Detailed Logging**: Log all errors with context

---

## Rate Limiting

To prevent IP bans and server overload:

- **Default Delay**: 1-2 seconds between requests
- **Configurable**: Can be adjusted per scraper
- **Respectful**: Follows robots.txt if available
- **Smart**: Uses rate limiter utility consistently

---

## Dependencies

All scrapers require:

```json
{
  "cheerio": "^1.0.0",
  "puppeteer": "^21.0.0",
  "axios": "^1.6.0",
  "@babel/parser": "^7.23.0",
  "@babel/traverse": "^7.23.0",
  "@babel/generator": "^7.23.0",
  "recast": "^0.23.0"
}
```

---

## Workflow Integration

All scrapers are integrated into GitHub Actions workflows:

1. **Update University Data** - Uses `fetch-university-data.js`
2. **Semester Data Update** - Uses recruiter, salary, facilities scrapers
3. **Annual Merit Update** - Uses `merit-scraper.js`
4. **Website Health Check** - Uses `url-checker.js`

---

## Best Practices

1. **Always use rate limiting** - Don't overwhelm servers
2. **Handle errors gracefully** - Continue processing other items
3. **Use fallback data** - Provide known data if scraping fails
4. **Log everything** - Helps with debugging
5. **Test locally first** - Use test scripts before deploying
6. **Respect robots.txt** - Check if available
7. **Use appropriate tool** - Cheerio for static, Puppeteer for dynamic

---

## Troubleshooting

### Scraper fails silently
- Check error logs in console output
- Verify URL is accessible
- Check if site requires authentication

### AST manipulation fails
- Verify file syntax is correct
- Check if university identifier exists
- Ensure field name matches exactly

### Rate limiting issues
- Increase delay between requests
- Check if IP is blocked
- Verify robots.txt allows scraping

### Puppeteer issues
- Ensure headless mode is enabled
- Check timeout settings
- Verify browser installation

---

## Future Improvements

- [ ] Add caching to reduce load
- [ ] Implement API-based scrapers where available
- [ ] Add more data sources
- [ ] Improve error recovery
- [ ] Add monitoring and alerts
- [ ] Implement data quality scoring
