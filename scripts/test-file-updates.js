/**
 * Test File Updates
 * Test AST manipulation for updating universities.js
 */

const { updateUniversityField, parseFile, findUniversityNode } = require('./utils/ast-manipulator');
const fs = require('fs');
const path = require('path');

async function testFileUpdates() {
    console.log('🧪 Testing File Updates');
    console.log('=======================\n');

    const universitiesPath = path.join(process.cwd(), 'src/data/universities.js');

    if (!fs.existsSync(universitiesPath)) {
        console.error('❌ universities.js not found');
        process.exit(1);
    }

    // Create backup
    const backupPath = universitiesPath + '.backup';
    fs.copyFileSync(universitiesPath, backupPath);
    console.log('✅ Created backup\n');

    try {
        // Test 1: Parse file
        console.log('1️⃣ Testing file parsing...');
        const { ast, source } = parseFile(universitiesPath);
        console.log('   ✅ File parsed successfully\n');

        // Test 2: Find university node
        console.log('2️⃣ Testing node finding...');
        const nustNode = findUniversityNode(ast, 'NUST');
        if (nustNode) {
            console.log('   ✅ Found NUST university node\n');
        } else {
            throw new Error('Could not find NUST node');
        }

        // Test 3: Update a field (test update)
        console.log('3️⃣ Testing field update...');
        const testDeadline = '2026-12-31';
        
        // Find a test university (use NUST)
        updateUniversityField(universitiesPath, 'NUST', 'admissions', {
            deadline: testDeadline,
            testName: 'Test Update',
            testDate: testDeadline,
            applyUrl: 'https://test.example.com'
        });
        
        // Verify update
        const { ast: updatedAst } = parseFile(universitiesPath);
        const updatedNode = findUniversityNode(updatedAst, 'NUST');
        
        let deadlineFound = false;
        updatedNode.properties.forEach(prop => {
            if (prop.key.name === 'admissions' && prop.value.type === 'ObjectExpression') {
                prop.value.properties.forEach(admissionProp => {
                    if (admissionProp.key.name === 'deadline' && 
                        admissionProp.value.value === testDeadline) {
                        deadlineFound = true;
                    }
                });
            }
        });

        if (deadlineFound) {
            console.log('   ✅ Field update successful\n');
        } else {
            throw new Error('Update verification failed');
        }

        // Restore backup
        console.log('4️⃣ Restoring backup...');
        fs.copyFileSync(backupPath, universitiesPath);
        fs.unlinkSync(backupPath);
        console.log('   ✅ Backup restored\n');

        console.log('📊 Test Summary');
        console.log('===============');
        console.log('✅ All file update tests passed!');
        process.exit(0);

    } catch (error) {
        // Restore backup on error
        if (fs.existsSync(backupPath)) {
            fs.copyFileSync(backupPath, universitiesPath);
            fs.unlinkSync(backupPath);
            console.log('   ✅ Backup restored after error\n');
        }

        console.error(`❌ Test failed: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

testFileUpdates().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
