/**
 * University Data Parser
 * Shared utility to reliably parse university objects from universities.js.
 * Uses bracket-counting instead of regex for robust object boundary detection.
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'universities.js');

/**
 * Parse the universities array from universities.js
 * Returns an array of university objects with extracted fields.
 */
function parseUniversities(filePath = DATA_PATH) {
    if (!fs.existsSync(filePath)) return null;

    const fullContent = fs.readFileSync(filePath, 'utf8');

    // Extract only the universities array
    const arrStart = fullContent.indexOf('export const universities = [');
    if (arrStart === -1) return null;
    const arrEnd = findMatchingBracket(fullContent, fullContent.indexOf('[', arrStart));
    if (arrEnd === -1) return null;

    const arrContent = fullContent.substring(arrStart, arrEnd + 1);

    // Find all top-level objects in the array using bracket counting
    const objects = [];
    let i = arrContent.indexOf('[') + 1;

    while (i < arrContent.length - 1) {
        // Skip whitespace and commas
        while (i < arrContent.length && /[\s,]/.test(arrContent[i])) i++;

        // Skip comments
        if (arrContent.substring(i, i + 2) === '//') {
            i = arrContent.indexOf('\n', i);
            if (i === -1) break;
            continue;
        }

        if (arrContent[i] === '{') {
            const objStart = i;
            const objEnd = findMatchingBracket(arrContent, i);
            if (objEnd === -1) break;

            const objStr = arrContent.substring(objStart, objEnd + 1);
            const uni = extractUniversityFields(objStr);
            if (uni && uni.id !== null) {
                objects.push(uni);
            }
            i = objEnd + 1;
        } else if (arrContent[i] === ']') {
            break;
        } else {
            i++;
        }
    }

    return objects;
}

/**
 * Find the matching closing bracket (handles nesting)
 */
function findMatchingBracket(str, start) {
    const open = str[start];
    const close = open === '{' ? '}' : open === '[' ? ']' : null;
    if (!close) return -1;

    let depth = 1;
    let inString = false;
    let stringChar = '';

    for (let i = start + 1; i < str.length; i++) {
        const ch = str[i];
        const prev = str[i - 1];

        if (inString) {
            if (ch === stringChar && prev !== '\\') inString = false;
            continue;
        }

        if (ch === '"' || ch === "'" || ch === '`') {
            inString = true;
            stringChar = ch;
            continue;
        }

        if (ch === open) depth++;
        if (ch === close) depth--;

        if (depth === 0) return i;
    }

    return -1;
}

/**
 * Extract university fields from an object string using regex
 */
function extractUniversityFields(objStr) {
    const uni = {};

    uni.id = extractNumber(objStr, 'id');
    uni.name = extractString(objStr, 'name');
    uni.shortName = extractString(objStr, 'shortName');
    uni.city = extractString(objStr, 'city');
    uni.type = extractString(objStr, 'type');
    uni.ranking = extractNumber(objStr, 'ranking');
    uni.established = extractNumber(objStr, 'established');
    uni.avgFee = extractString(objStr, 'avgFee');
    uni.website = extractString(objStr, 'website');
    uni.description = extractString(objStr, 'description');
    uni.campusType = extractString(objStr, 'campusType');
    uni.hostelAvailability = extractString(objStr, 'hostelAvailability');

    // Extract admissions sub-object
    const admStart = objStr.indexOf('admissions:');
    if (admStart !== -1) {
        const braceStart = objStr.indexOf('{', admStart);
        if (braceStart !== -1) {
            const braceEnd = findMatchingBracket(objStr, braceStart);
            if (braceEnd !== -1) {
                const admStr = objStr.substring(braceStart, braceEnd + 1);
                uni.admissions = {
                    deadline: extractString(admStr, 'deadline'),
                    testName: extractString(admStr, 'testName'),
                    testDate: extractString(admStr, 'testDate'),
                    applyUrl: extractString(admStr, 'applyUrl')
                };
            }
        }
    }

    // Extract fields array
    const fieldsMatch = objStr.match(/fields:\s*\[([\s\S]*?)\]/);
    if (fieldsMatch) {
        const matches = fieldsMatch[1].match(/["']([^"']+)["']/g);
        uni.fields = matches ? matches.map(s => s.replace(/["']/g, '')) : [];
    }

    return uni;
}

function extractString(block, field) {
    const m = block.match(new RegExp(`(?:^|\\n)\\s*${field}:\\s*["']([^"']*?)["']`));
    return m ? m[1] : null;
}

function extractNumber(block, field) {
    const m = block.match(new RegExp(`(?:^|\\n)\\s*${field}:\\s*(\\d+)`));
    return m ? parseInt(m[1]) : null;
}

module.exports = { parseUniversities, extractString, extractNumber };
