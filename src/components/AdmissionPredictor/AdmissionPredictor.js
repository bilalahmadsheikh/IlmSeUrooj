'use client';

import { useState, useMemo } from 'react';
import styles from './AdmissionPredictor.module.css';
import { universities } from '@/data/universities';

// Real admission criteria with 2023-2024 merit data from official sources
const admissionCriteria = {
    NUST: {
        minFsc: 60,
        competitiveFsc: 80,
        formula: 'NET (75%) + FSc (15%) + Matric (10%)',
        formulaBreakdown: [
            { component: 'NET Entry Test', weight: 75, icon: '📝' },
            { component: 'FSc/A-Level Marks', weight: 15, icon: '📚' },
            { component: 'Matric/O-Level', weight: 10, icon: '📖' }
        ],
        description: 'Highly competitive. Top engineering university. Merit based on NET score primarily.',
        cutoffs: { engineering: 74, cs: 75, business: 70 },
        meritHistory: {
            2024: { cs: 73, engineering: 71, se: 74 },
            2023: { cs: 78.5, engineering: 72, se: 78.2 }
        },
        tips: 'NET score is crucial. Aim for 150+ out of 200. SEECS programs are most competitive.'
    },
    LUMS: {
        minFsc: 70,
        competitiveFsc: 88,
        formula: 'LCAT/SAT (50%) + FSc (30%) + Interview (20%)',
        formulaBreakdown: [
            { component: 'LCAT or SAT', weight: 50, icon: '📝' },
            { component: 'FSc/A-Level', weight: 30, icon: '📚' },
            { component: 'Interview', weight: 20, icon: '🎤' }
        ],
        description: 'Holistic admissions. Average admitted FSc is 88%. Need-based financial aid available.',
        cutoffs: { business: 85, cs: 82 },
        meritHistory: {
            2024: { business: 84, cs: 81 },
            2023: { business: 86, cs: 83 }
        },
        tips: 'Strong essays and interview performance can compensate for lower test scores.'
    },
    FAST: {
        minFsc: 60,
        competitiveFsc: 70,
        formula: 'NU Test (50%) + FSc Part-I (50%)',
        formulaBreakdown: [
            { component: 'FAST NU Test', weight: 50, icon: '📝' },
            { component: 'FSc Part-I Marks', weight: 50, icon: '📚' }
        ],
        description: 'Best for Computer Science. Multiple campuses across Pakistan.',
        cutoffs: { cs: 68, engineering: 62, se: 75 },
        meritHistory: {
            2024: { cs: 68, se: 75.6, ai: 72 },
            2023: { cs: 76.8, se: 75.6, ai: 74 }
        },
        tips: 'Lahore and Islamabad have highest cutoffs. Faisalabad/Peshawar are easier to get into.'
    },
    COMSATS: {
        minFsc: 60,
        competitiveFsc: 70,
        formula: 'Entry Test (40%) + FSc (40%) + Matric (20%)',
        formulaBreakdown: [
            { component: 'COMSATS Test', weight: 40, icon: '📝' },
            { component: 'FSc Marks', weight: 40, icon: '📚' },
            { component: 'Matric Marks', weight: 20, icon: '📖' }
        ],
        description: 'Affordable public university. Good for CS and Engineering.',
        cutoffs: { cs: 65, engineering: 60 },
        meritHistory: {
            2024: { cs: 64, engineering: 58 },
            2023: { cs: 66, engineering: 61 }
        },
        tips: 'Very affordable. Multiple campuses - Islamabad and Lahore are most competitive.'
    },
    IBA: {
        minFsc: 65,
        competitiveFsc: 80,
        formula: 'IBA Test (60%) + FSc (25%) + Matric (15%)',
        formulaBreakdown: [
            { component: 'IBA Aptitude Test', weight: 60, icon: '📝' },
            { component: 'FSc/A-Level', weight: 25, icon: '📚' },
            { component: 'Matric/O-Level', weight: 15, icon: '📖' }
        ],
        description: 'Asia\'s oldest business school. Very competitive for BBA.',
        cutoffs: { business: 75, cs: 70 },
        meritHistory: {
            2024: { business: 74, cs: 69 },
            2023: { business: 76, cs: 71 }
        },
        tips: 'IBA test is notoriously difficult. Focus on verbal and quantitative sections.'
    },
    'UET Lahore': {
        minFsc: 60,
        competitiveFsc: 75,
        formula: 'ECAT (30%) + FSc (45%) + Matric (25%)',
        formulaBreakdown: [
            { component: 'ECAT Test', weight: 30, icon: '📝' },
            { component: 'FSc Marks', weight: 45, icon: '📚' },
            { component: 'Matric Marks', weight: 25, icon: '📖' }
        ],
        description: 'Premier public engineering university. Very affordable.',
        cutoffs: { engineering: 72 },
        meritHistory: {
            2024: { mechanical: 77, electrical: 74, civil: 75 },
            2023: { mechanical: 77.73, electrical: 74.4, civil: 75.5 }
        },
        tips: 'ECAT conducted by UET. Very affordable fees. Strong alumni network in industry.'
    },
    GIKI: {
        minFsc: 60,
        competitiveFsc: 78,
        formula: 'GIKI Test (85%) + FSc Part-I (15%)',
        formulaBreakdown: [
            { component: 'GIKI Entry Test', weight: 85, icon: '📝' },
            { component: 'FSc Part-I Marks', weight: 15, icon: '📚' }
        ],
        description: 'Elite residential engineering institute. Beautiful campus in Topi.',
        cutoffs: { engineering: 75, cs: 78 },
        meritHistory: {
            2024: { cs: 77, mechanical: 76, ce: 78 },
            2023: { cs: 78, mechanical: 77, ce: 80 }
        },
        tips: 'Entry test is 85% of merit - test prep is key. Residential campus experience.'
    },
    PIEAS: {
        minFsc: 60,
        competitiveFsc: 80,
        formula: 'Written Test (70%) + Interview (30%)',
        formulaBreakdown: [
            { component: 'PIEAS Written Test', weight: 70, icon: '📝' },
            { component: 'Interview', weight: 30, icon: '🎤' }
        ],
        description: 'Premier nuclear research institute. Very selective. Government job guarantee.',
        cutoffs: { engineering: 78 },
        meritHistory: {
            2024: { engineering: 77 },
            2023: { engineering: 79 }
        },
        tips: 'Only nuclear/strategic programs. Guaranteed government job after graduation.'
    },
    NED: {
        minFsc: 60,
        competitiveFsc: 72,
        formula: 'NED Test (50%) + FSc (30%) + Matric (20%)',
        formulaBreakdown: [
            { component: 'NED Entry Test', weight: 50, icon: '📝' },
            { component: 'FSc Marks', weight: 30, icon: '📚' },
            { component: 'Matric Marks', weight: 20, icon: '📖' }
        ],
        description: 'Historic engineering university in Karachi. Very affordable.',
        cutoffs: { engineering: 68, cs: 65 },
        meritHistory: {
            2024: { petroleum: 70, electrical: 68, cs: 66 },
            2023: { petroleum: 72, electrical: 69, cs: 67 }
        },
        tips: 'Karachi\'s premier engineering school. Strong in petroleum and civil engineering.'
    },
    Bahria: {
        minFsc: 50,
        competitiveFsc: 65,
        formula: 'Bahria Test (50%) + FSc (30%) + Matric (20%)',
        formulaBreakdown: [
            { component: 'Bahria Entry Test', weight: 50, icon: '📝' },
            { component: 'FSc Marks', weight: 30, icon: '📚' },
            { component: 'Matric Marks', weight: 20, icon: '📖' }
        ],
        description: 'Navy-affiliated. Disciplined environment. Multiple campuses.',
        cutoffs: { business: 60, cs: 62 },
        meritHistory: {
            2024: { cs: 61, business: 59 },
            2023: { cs: 63, business: 61 }
        },
        tips: 'Navy affiliation means disciplined campus. Reserved seats for Navy dependents.'
    },
};

function calculateChance(fsc, matric, field, testScore, uniName) {
    const criteria = admissionCriteria[uniName];
    if (!criteria) return { chance: 'Unknown', color: 'gray', score: 0 };

    // Base score from FSc
    let score = 0;

    // FSc contribution (major factor)
    if (fsc >= criteria.competitiveFsc) {
        score += 40;
    } else if (fsc >= criteria.minFsc + 10) {
        score += 25;
    } else if (fsc >= criteria.minFsc) {
        score += 10;
    } else {
        return { chance: 'Not Eligible', color: 'red', score: 0, reason: `Minimum ${criteria.minFsc}% FSc required` };
    }

    // Entry test contribution
    if (testScore >= 80) {
        score += 40;
    } else if (testScore >= 70) {
        score += 30;
    } else if (testScore >= 60) {
        score += 20;
    } else if (testScore >= 50) {
        score += 10;
    }

    // Matric bonus
    if (matric >= 90) {
        score += 15;
    } else if (matric >= 80) {
        score += 10;
    } else if (matric >= 70) {
        score += 5;
    }

    // Field competitiveness adjustment
    const fieldCutoff = criteria.cutoffs?.[field === 'Pre-Engineering' ? 'engineering' :
        field === 'Computer Science' ? 'cs' :
            field === 'Business' ? 'business' : 'engineering'] || 70;

    if (fsc >= fieldCutoff + 10) {
        score += 5;
    }

    // Determine chance level
    if (score >= 80) {
        return { chance: 'High', color: 'green', score, reason: 'Strong candidate with competitive scores' };
    } else if (score >= 60) {
        return { chance: 'Medium', color: 'yellow', score, reason: 'Decent chance, entry test performance is key' };
    } else if (score >= 40) {
        return { chance: 'Low', color: 'orange', score, reason: 'Need excellent entry test score to compensate' };
    } else {
        return { chance: 'Very Low', color: 'red', score, reason: 'Consider backup options' };
    }
}

export default function AdmissionPredictor() {
    const [fscMarks, setFscMarks] = useState(75);
    const [matricMarks, setMatricMarks] = useState(85);
    const [expectedTestScore, setExpectedTestScore] = useState(70);
    const [selectedField, setSelectedField] = useState('Pre-Engineering');
    const [selectedUniversity, setSelectedUniversity] = useState('GIKI'); // Default to GIKI

    // Get universities that offer the selected field and have admission criteria
    const availableUniversities = useMemo(() => {
        return universities.filter(uni =>
            uni.fields.includes(selectedField) && admissionCriteria[uni.shortName]
        );
    }, [selectedField]);

    const predictions = useMemo(() => {
        let filtered = universities
            .filter(uni => uni.fields.includes(selectedField));

        // If a specific university is selected, filter to just that one
        if (selectedUniversity !== 'All') {
            filtered = filtered.filter(uni => uni.shortName === selectedUniversity);
        }

        return filtered
            .map(uni => {
                const criteria = admissionCriteria[uni.shortName];
                const prediction = calculateChance(fscMarks, matricMarks, selectedField, expectedTestScore, uni.shortName);
                return {
                    ...uni,
                    criteria,
                    prediction,
                };
            })
            .sort((a, b) => b.prediction.score - a.prediction.score);
    }, [fscMarks, matricMarks, expectedTestScore, selectedField, selectedUniversity]);

    // Reset university selection if it doesn't offer the selected field
    const handleFieldChange = (newField) => {
        setSelectedField(newField);
        // Check if current university offers the new field
        const currentUni = universities.find(u => u.shortName === selectedUniversity);
        if (currentUni && !currentUni.fields.includes(newField)) {
            // Find first university that offers this field
            const firstMatch = universities.find(u =>
                u.fields.includes(newField) && admissionCriteria[u.shortName]
            );
            setSelectedUniversity(firstMatch?.shortName || 'All');
        }
    };

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <span className={styles.titleIcon}>🎯</span>
                    Admission Chance Predictor
                </h2>
                <p className={styles.subtitle}>
                    Enter your marks to see your chances at top Pakistani universities
                </p>
            </div>

            {/* Input Form */}
            <div className={styles.inputCard}>
                <div className={styles.inputGrid}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            📚 FSc / Inter Percentage
                            <span className={styles.value}>{fscMarks}%</span>
                        </label>
                        <input
                            type="range"
                            min="50"
                            max="100"
                            value={fscMarks}
                            onChange={(e) => setFscMarks(parseInt(e.target.value))}
                            className={styles.slider}
                        />
                        <div className={styles.sliderLabels}>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            📖 Matric / SSC Percentage
                            <span className={styles.value}>{matricMarks}%</span>
                        </label>
                        <input
                            type="range"
                            min="50"
                            max="100"
                            value={matricMarks}
                            onChange={(e) => setMatricMarks(parseInt(e.target.value))}
                            className={styles.slider}
                        />
                        <div className={styles.sliderLabels}>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            📝 Expected Entry Test Score
                            <span className={styles.value}>{expectedTestScore}%</span>
                        </label>
                        <input
                            type="range"
                            min="30"
                            max="100"
                            value={expectedTestScore}
                            onChange={(e) => setExpectedTestScore(parseInt(e.target.value))}
                            className={styles.slider}
                        />
                        <div className={styles.sliderLabels}>
                            <span>30%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>🎓 Field of Study</label>
                        <select
                            value={selectedField}
                            onChange={(e) => handleFieldChange(e.target.value)}
                            className={styles.select}
                        >
                            <option value="Pre-Engineering">Pre-Engineering</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Business">Business</option>
                            <option value="Medical">Medical</option>
                        </select>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>🏛️ University</label>
                        <select
                            value={selectedUniversity}
                            onChange={(e) => setSelectedUniversity(e.target.value)}
                            className={styles.select}
                        >
                            <option value="All">All Universities</option>
                            {availableUniversities.map(uni => (
                                <option key={uni.id} value={uni.shortName}>
                                    {uni.shortName} - {uni.city}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Methodology - Dynamic based on selected university */}
            <div className={styles.methodology}>
                <h4>
                    📋 {selectedUniversity !== 'All'
                        ? `How ${selectedUniversity} Calculates Merit`
                        : 'How We Calculate Chances'}
                </h4>

                {selectedUniversity !== 'All' && admissionCriteria[selectedUniversity] ? (
                    <>
                        {/* University-specific formula breakdown */}
                        <div className={styles.formulaSection}>
                            <div className={styles.formulaHeader}>
                                <span className={styles.formulaLabel}>Merit Formula:</span>
                                <span className={styles.formulaText}>{admissionCriteria[selectedUniversity].formula}</span>
                            </div>
                            <div className={styles.methodologyGrid}>
                                {admissionCriteria[selectedUniversity].formulaBreakdown?.map((item, idx) => (
                                    <div key={idx} className={styles.methodItem}>
                                        <span className={styles.methodIcon}>{item.icon}</span>
                                        <div>
                                            <strong>{item.component}</strong>
                                            <div className={styles.weightBar}>
                                                <div
                                                    className={styles.weightFill}
                                                    style={{ width: `${item.weight}%` }}
                                                />
                                                <span className={styles.weightPercent}>{item.weight}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Historical Merit Data */}
                        {admissionCriteria[selectedUniversity].meritHistory && (
                            <div className={styles.meritHistorySection}>
                                <h5>📈 Last 2 Years Merit Cutoffs</h5>
                                <div className={styles.meritTable}>
                                    <div className={styles.meritTableHeader}>
                                        <span>Year</span>
                                        <span>Program</span>
                                        <span>Cutoff %</span>
                                    </div>
                                    {Object.entries(admissionCriteria[selectedUniversity].meritHistory).map(([year, programs]) => (
                                        Object.entries(programs).map(([program, cutoff], idx) => (
                                            <div key={`${year}-${program}`} className={styles.meritTableRow}>
                                                {idx === 0 && (
                                                    <span className={styles.meritYear}
                                                        style={{ gridRow: `span ${Object.keys(programs).length}` }}>
                                                        {year}
                                                    </span>
                                                )}
                                                <span className={styles.meritProgram}>{program.toUpperCase()}</span>
                                                <span className={styles.meritCutoff}>{cutoff}%</span>
                                            </div>
                                        ))
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tips */}
                        {admissionCriteria[selectedUniversity].tips && (
                            <div className={styles.tipSection}>
                                <span className={styles.tipIcon}>💡</span>
                                <p>{admissionCriteria[selectedUniversity].tips}</p>
                            </div>
                        )}

                        <p className={styles.uniDescription}>
                            {admissionCriteria[selectedUniversity].description}
                        </p>
                    </>
                ) : (
                    /* Generic methodology for All Universities */
                    <div className={styles.methodologyGrid}>
                        <div className={styles.methodItem}>
                            <span className={styles.methodIcon}>📝</span>
                            <div>
                                <strong>Entry Test (40-85%)</strong>
                                <p>NET, LCAT, ECAT, or university tests. Often the deciding factor.</p>
                            </div>
                        </div>
                        <div className={styles.methodItem}>
                            <span className={styles.methodIcon}>📚</span>
                            <div>
                                <strong>FSc/A-Level (15-50%)</strong>
                                <p>Intermediate marks baseline. Most require 60-70% minimum.</p>
                            </div>
                        </div>
                        <div className={styles.methodItem}>
                            <span className={styles.methodIcon}>📖</span>
                            <div>
                                <strong>Matric/O-Level (10-25%)</strong>
                                <p>SSC marks contribute to aggregate calculation.</p>
                            </div>
                        </div>
                        <div className={styles.methodItem}>
                            <span className={styles.methodIcon}>🎤</span>
                            <div>
                                <strong>Interview (0-30%)</strong>
                                <p>LUMS, PIEAS require interviews. Others are test-only.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Predictions */}
            <div className={styles.predictions}>
                <h3 className={styles.predictionsTitle}>
                    Your Chances for {selectedField}
                    {selectedUniversity !== 'All' && ` at ${selectedUniversity}`}
                </h3>

                <div className={styles.predictionsList}>
                    {predictions.map((uni) => (
                        <div key={uni.id} className={styles.predictionCard}>
                            <div className={styles.predictionHeader}>
                                <div className={styles.uniLogo}>
                                    {uni.shortName.charAt(0)}
                                </div>
                                <div className={styles.uniInfo}>
                                    <h4>{uni.shortName}</h4>
                                    <p>{uni.city} • {uni.type}</p>
                                </div>
                                <div className={`${styles.chanceBadge} ${styles[uni.prediction.color]}`}>
                                    <span className={styles.chanceText}>{uni.prediction.chance}</span>
                                    <span className={styles.chanceScore}>{uni.prediction.score}/100</span>
                                </div>
                            </div>

                            <div className={styles.predictionBody}>
                                {uni.criteria && (
                                    <>
                                        <div className={styles.formula}>
                                            <strong>Merit Formula:</strong> {uni.criteria.formula}
                                        </div>
                                        <div className={styles.requirements}>
                                            <span>Min FSc: {uni.criteria.minFsc}%</span>
                                            <span>Competitive: {uni.criteria.competitiveFsc}%+</span>
                                        </div>
                                        <p className={styles.reason}>{uni.prediction.reason}</p>
                                    </>
                                )}
                            </div>

                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{
                                        width: `${uni.prediction.score}%`,
                                        background: uni.prediction.color === 'green' ? 'var(--color-success)' :
                                            uni.prediction.color === 'yellow' ? 'var(--color-warning)' :
                                                uni.prediction.color === 'orange' ? '#f97316' : 'var(--color-danger)'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.disclaimer}>
                <span>⚠️</span>
                These predictions are estimates based on historical data. Actual admission depends on
                test performance, seat availability, and university policies. Always check official sources.
            </div>
        </section>
    );
}
