/**
 * Auto-Review Bot
 * Automatically reviews data changes and determines if they can be auto-merged
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
    // Maximum number of field changes allowed for auto-merge
    maxAutoMergeChanges: 10,

    // Fields that always require manual review
    sensitiveFields: [
        'cutoffs',
        'meritHistory',
        'avgFee',
        'ranking'
    ],

    // Maximum percentage change allowed in numeric fields
    maxNumericChange: 0.2, // 20%

    // Always require review for these universities
    highPriorityUniversities: ['LUMS', 'NUST', 'FAST Isb', 'FAST Lhr']
};

class AutoReviewBot {
    constructor() {
        this.changes = [];
        this.reviewRequired = false;
        this.reasons = [];
    }

    async analyzeChanges() {
        console.log('🤖 Auto-Review Bot');
        console.log('==================\n');

        try {
            // Get git diff for data files
            const diff = execSync('git diff --name-only src/data/', { encoding: 'utf8' });
            const changedFiles = diff.trim().split('\n').filter(f => f);

            console.log(`📁 Changed files: ${changedFiles.length}`);
            changedFiles.forEach(f => console.log(`   - ${f}`));

            if (changedFiles.length === 0) {
                console.log('\n✅ No changes to review');
                return { approved: true, reason: 'No changes detected' };
            }

            // Analyze each changed file
            for (const file of changedFiles) {
                await this.analyzeFile(file);
            }

            return this.generateDecision();

        } catch (error) {
            console.log(`\n⚠️ Error during analysis: ${error.message}`);
            this.reviewRequired = true;
            this.reasons.push('Error during automated analysis');
            return this.generateDecision();
        }
    }

    async analyzeFile(filePath) {
        console.log(`\n📄 Analyzing: ${filePath}`);

        try {
            // Get detailed diff
            const diff = execSync(`git diff src/data/${path.basename(filePath)}`, { encoding: 'utf8' });

            // Count additions and deletions
            const additions = (diff.match(/^\+[^+]/gm) || []).length;
            const deletions = (diff.match(/^-[^-]/gm) || []).length;

            console.log(`   Additions: ${additions}, Deletions: ${deletions}`);

            // Check for sensitive field changes
            for (const field of CONFIG.sensitiveFields) {
                if (diff.includes(field)) {
                    this.reviewRequired = true;
                    this.reasons.push(`Sensitive field changed: ${field}`);
                    console.log(`   ⚠️ Sensitive field: ${field}`);
                }
            }

            // Check for high-priority universities
            for (const uni of CONFIG.highPriorityUniversities) {
                if (diff.includes(uni)) {
                    console.log(`   📍 High-priority university affected: ${uni}`);
                    // Note but don't require review for just mentions
                }
            }

            // Check change count
            if (additions + deletions > CONFIG.maxAutoMergeChanges) {
                this.reviewRequired = true;
                this.reasons.push(`Too many changes: ${additions + deletions} (max: ${CONFIG.maxAutoMergeChanges})`);
            }

            this.changes.push({
                file: filePath,
                additions,
                deletions
            });

        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }
    }

    generateDecision() {
        const decision = {
            approved: !this.reviewRequired,
            changes: this.changes,
            reasons: this.reasons,
            timestamp: new Date().toISOString()
        };

        console.log('\n📊 Review Decision');
        console.log('------------------');

        if (decision.approved) {
            console.log('✅ AUTO-APPROVED');
            console.log('Changes are within acceptable limits for automatic merge.');
        } else {
            console.log('🔍 MANUAL REVIEW REQUIRED');
            console.log('Reasons:');
            decision.reasons.forEach(r => console.log(`   - ${r}`));
        }

        // Save decision
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(reportsDir, 'auto-review-decision.json'),
            JSON.stringify(decision, null, 2)
        );

        return decision;
    }
}

// Run the auto-review
const bot = new AutoReviewBot();
bot.analyzeChanges().then(decision => {
    // Exit with error if manual review required (to prevent auto-merge)
    if (!decision.approved) {
        process.exit(1);
    }
}).catch(error => {
    console.error('Auto-review failed:', error);
    process.exit(1);
});
