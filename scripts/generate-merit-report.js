/**
 * Generate Merit Report
 * Creates a formatted report for manual merit review
 */

const fs = require('fs');
const path = require('path');

const MERIT_DATA_2024 = {
    FAST: {
        source: 'https://learnospot.com/fast-university-closing-merits/',
        campuses: {
            Islamabad: { CS: 75.3, SE: 73.01, AI: 74.0, DS: 71.69, Cyber: 71.45 },
            Lahore: { CS: 76.8, SE: 75.6, DS: 74.4, Cyber: 75.6 },
            Karachi: { CS: 68.08, SE: 66.52, AI: 67.43, DS: 66.14 },
            Peshawar: { CS: 58.46, SE: 59.73, AI: 64.57 },
            'Chiniot-Faisalabad': { CS: 67.02, SE: 66.68, AI: 66.35 }
        }
    },
    COMSATS: {
        source: 'https://paklearningspot.com/comsats-university-merit-lists/',
        campuses: {
            Lahore: { CS: 87.36, SE: 85.6, CE: 83.09, EE: 76.74 },
            Islamabad: { CS: 82.7, SE: 81.6, AI: 80.2, Cyber: 79.2, DS: 78.3 }
        }
    },
    GIKI: {
        source: 'https://paklearningspot.com/giki-merit-lists/',
        programs: {
            CS: '#324',
            AI: '#499',
            SE: '#566',
            Cyber: '#958',
            DS: '#1008'
        }
    },
    NUST: {
        source: 'https://paklearningspot.com/nust-net-merit-lists/',
        programs: {
            ME: '#450',
            SE: '#482',
            CS: '#747',
            EE: '#1069'
        }
    },
    UET: {
        source: 'https://paklearningspot.com/uet-lahore-merit-lists/',
        main: {
            ME: 81.13,
            CE: 79.87,
            EE: 79.15,
            CS: 78.57
        }
    }
};

function generateReport() {
    const year = process.env.MERIT_YEAR || new Date().getFullYear();

    let report = `# Merit List Report - ${year}\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `---\n\n`;

    for (const [university, data] of Object.entries(MERIT_DATA_2024)) {
        report += `## ${university}\n\n`;
        report += `**Source:** ${data.source}\n\n`;

        if (data.campuses) {
            for (const [campus, programs] of Object.entries(data.campuses)) {
                report += `### ${campus} Campus\n\n`;
                report += `| Program | Cutoff |\n`;
                report += `|---------|--------|\n`;
                for (const [program, cutoff] of Object.entries(programs)) {
                    report += `| ${program} | ${cutoff}% |\n`;
                }
                report += `\n`;
            }
        }

        if (data.programs) {
            report += `| Program | Closing Position |\n`;
            report += `|---------|------------------|\n`;
            for (const [program, position] of Object.entries(data.programs)) {
                report += `| ${program} | ${position} |\n`;
            }
            report += `\n`;
        }

        if (data.main) {
            report += `| Program | Cutoff |\n`;
            report += `|---------|--------|\n`;
            for (const [program, cutoff] of Object.entries(data.main)) {
                report += `| ${program} | ${cutoff}% |\n`;
            }
            report += `\n`;
        }
    }

    report += `---\n\n`;
    report += `## Verification Checklist\n\n`;
    report += `- [ ] FAST cutoffs verified against learnospot.com\n`;
    report += `- [ ] COMSATS cutoffs verified against paklearningspot.com\n`;
    report += `- [ ] GIKI positions verified\n`;
    report += `- [ ] NUST positions verified\n`;
    report += `- [ ] UET cutoffs verified\n`;
    report += `- [ ] AdmissionPredictor.js updated\n`;
    report += `- [ ] universities.js descriptions updated\n`;
    report += `- [ ] DATA-SOURCES.md updated\n`;

    // Save report
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(reportsDir, 'merit-report.md'), report);

    console.log('📊 Merit report generated: reports/merit-report.md');

    return report;
}

generateReport();
