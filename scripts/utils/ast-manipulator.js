/**
 * AST Manipulator Utility
 * Parse and update JavaScript files while preserving formatting
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const recast = require('recast');

/**
 * Parse JavaScript file to AST
 * @param {string} filePath - Path to JavaScript file
 * @returns {object} AST and source code
 */
function parseFile(filePath) {
    const source = fs.readFileSync(filePath, 'utf8');
    const ast = recast.parse(source, {
        parser: {
            parse(source) {
                return parser.parse(source, {
                    sourceType: 'module',
                    allowImportExportEverywhere: true,
                    allowReturnOutsideFunction: true,
                    plugins: ['objectRestSpread', 'classProperties']
                });
            }
        }
    });
    
    return { ast, source };
}

/**
 * Find university object in AST by shortName or id
 * @param {object} ast - AST object
 * @param {string|number} identifier - shortName string or id number
 * @returns {object|null} University node path or null
 */
function findUniversityNode(ast, identifier) {
    let universityPath = null;
    
    traverse(ast, {
        VariableDeclarator(path) {
            if (path.node.id.name === 'universities' && 
                path.node.init.type === 'ArrayExpression') {
                
                path.node.init.elements.forEach((element, index) => {
                    if (element.type === 'ObjectExpression') {
                        // Check if this is the university we're looking for
                        element.properties.forEach(prop => {
                            if (prop.key.name === 'shortName' && 
                                prop.value.type === 'StringLiteral' &&
                                prop.value.value === identifier) {
                                universityPath = path.get(`init.elements.${index}`);
                            } else if (prop.key.name === 'id' && 
                                      prop.value.type === 'NumericLiteral' &&
                                      prop.value.value === identifier) {
                                universityPath = path.get(`init.elements.${index}`);
                            }
                        });
                    }
                });
            }
        }
    });
    
    return universityPath ? universityPath.node : null;
}

/**
 * Update a field in a university object
 * @param {object} universityNode - University AST node
 * @param {string} fieldName - Field name to update
 * @param {any} value - New value
 */
function updateField(universityNode, fieldName, value) {
    if (!universityNode || universityNode.type !== 'ObjectExpression') {
        throw new Error('Invalid university node');
    }
    
    const properties = universityNode.properties;
    let fieldFound = false;
    
    // Check if field already exists
    for (let i = 0; i < properties.length; i++) {
        const prop = properties[i];
        if (prop.key && prop.key.name === fieldName) {
            // Update existing field
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // For nested objects, update properties
                if (prop.value.type === 'ObjectExpression') {
                    updateNestedObject(prop.value, value);
                } else {
                    // Replace with new object
                    prop.value = createASTNode(value);
                }
            } else {
                prop.value = createASTNode(value);
            }
            fieldFound = true;
            break;
        }
    }
    
    // Add new field if not found
    if (!fieldFound) {
        const newProp = {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: fieldName },
            value: createASTNode(value),
            computed: false,
            shorthand: false
        };
        properties.push(newProp);
    }
}

/**
 * Update nested object properties
 * @param {object} objectNode - Object AST node
 * @param {object} updates - Updates to apply
 */
function updateNestedObject(objectNode, updates) {
    if (objectNode.type !== 'ObjectExpression') {
        return;
    }
    
    const properties = objectNode.properties;
    
    Object.entries(updates).forEach(([key, value]) => {
        let propFound = false;
        
        for (let i = 0; i < properties.length; i++) {
            const prop = properties[i];
            if (prop.key && prop.key.name === key) {
                prop.value = createASTNode(value);
                propFound = true;
                break;
            }
        }
        
        if (!propFound) {
            properties.push({
                type: 'ObjectProperty',
                key: { type: 'Identifier', name: key },
                value: createASTNode(value),
                computed: false,
                shorthand: false
            });
        }
    });
}

/**
 * Create AST node from JavaScript value
 * @param {any} value - JavaScript value
 * @returns {object} AST node
 */
function createASTNode(value) {
    if (value === null) {
        return { type: 'NullLiteral' };
    }
    
    if (typeof value === 'string') {
        return { type: 'StringLiteral', value };
    }
    
    if (typeof value === 'number') {
        return { type: 'NumericLiteral', value };
    }
    
    if (typeof value === 'boolean') {
        return { type: 'BooleanLiteral', value };
    }
    
    if (Array.isArray(value)) {
        return {
            type: 'ArrayExpression',
            elements: value.map(item => createASTNode(item))
        };
    }
    
    if (typeof value === 'object') {
        return {
            type: 'ObjectExpression',
            properties: Object.entries(value).map(([key, val]) => ({
                type: 'ObjectProperty',
                key: { type: 'Identifier', name: key },
                value: createASTNode(val),
                computed: false,
                shorthand: false
            }))
        };
    }
    
    throw new Error(`Unsupported value type: ${typeof value}`);
}

/**
 * Update university field in file
 * @param {string} filePath - Path to universities.js
 * @param {string|number} identifier - shortName or id
 * @param {string} fieldName - Field name to update
 * @param {any} value - New value
 */
function updateUniversityField(filePath, identifier, fieldName, value) {
    const { ast, source } = parseFile(filePath);
    let universityPath = null;
    
    // Find the university node path (not just the node)
    traverse(ast, {
        VariableDeclarator(path) {
            if (path.node.id.name === 'universities' && 
                path.node.init.type === 'ArrayExpression') {
                
                path.node.init.elements.forEach((element, index) => {
                    if (element.type === 'ObjectExpression') {
                        element.properties.forEach(prop => {
                            if (prop.key.name === 'shortName' && 
                                prop.value.type === 'StringLiteral' &&
                                prop.value.value === identifier) {
                                universityPath = path.get(`init.elements.${index}`);
                            } else if (prop.key.name === 'id' && 
                                      prop.value.type === 'NumericLiteral' &&
                                      prop.value.value === identifier) {
                                universityPath = path.get(`init.elements.${index}`);
                            }
                        });
                    }
                });
            }
        }
    });
    
    if (!universityPath) {
        throw new Error(`University not found: ${identifier}`);
    }
    
    updateField(universityPath.node, fieldName, value);
    
    // Write back using recast to preserve formatting
    const output = recast.print(ast, {
        quote: 'single',
        tabWidth: 2,
        useTabs: false,
        trailingComma: true
    }).code;
    
    fs.writeFileSync(filePath, output, 'utf8');
}

module.exports = {
    parseFile,
    findUniversityNode,
    updateField,
    updateUniversityField,
    createASTNode
};
