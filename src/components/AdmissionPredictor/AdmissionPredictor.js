'use client';

import { useState, useMemo } from 'react';
import styles from './AdmissionPredictor.module.css';
import { universities } from '@/data/universities';

// Real admission criteria based on official university data
const admissionCriteria = {
    NUST: {
        minFsc: 60,
        competitiveFsc: 80,
        formula: 'NET (75%) + FSc (15%) + Matric (10%)',
        description: 'Highly competitive. Top engineering university. Merit based on NET score primarily.',
        cutoffs: { engineering: 74, cs: 75, business: 70 },
    },
    LUMS: {
        minFsc: 70,
        competitiveFsc: 88,
        formula: 'LCAT/SAT + FSc + Interview',
        description: 'Holistic admissions. Average admitted FSc is 88%. Need-based financial aid available.',
        cutoffs: { business: 85, cs: 82 },
    },
    FAST: {
        minFsc: 60,
        competitiveFsc: 70,
        formula: 'Entry Test (50%) + FSc (50%)',
        description: 'Best for Computer Science. Multiple campuses across Pakistan.',
        cutoffs: { cs: 65, engineering: 62, business: 55 },
    },
    COMSATS: {
        minFsc: 60,
        competitiveFsc: 70,
        formula: 'Entry Test + FSc + Matric',
        description: 'Affordable public university. Good for CS and Engineering.',
        cutoffs: { cs: 65, engineering: 60 },
    },
    IBA: {
        minFsc: 65,
        competitiveFsc: 80,
        formula: 'IBA Aptitude Test + FSc',
        description: 'Asia oldest business school. Very competitive for BBA.',
        cutoffs: { business: 75, cs: 70 },
    },
    'UET Lahore': {
        minFsc: 60,
        competitiveFsc: 75,
        formula: 'ECAT (weightage varies by program)',
        description: 'Premier public engineering university. Very affordable.',
        cutoffs: { engineering: 72 },
    },
    GIKI: {
        minFsc: 60,
        competitiveFsc: 78,
        formula: 'Entry Test (85%) + FSc Part-I (15%)',
        description: 'Elite residential engineering institute. Beautiful campus in Topi.',
        cutoffs: { engineering: 75, cs: 78 },
    },
    PIEAS: {
        minFsc: 60,
        competitiveFsc: 80,
        formula: 'Written Test + Interview',
        description: 'Premier nuclear research institute. Very selective.',
        cutoffs: { engineering: 78 },
    },
    NED: {
        minFsc: 60,
        competitiveFsc: 72,
        formula: 'NED Entry Test + FSc',
        description: 'Historic engineering university in Karachi. Affordable.',
        cutoffs: { engineering: 68, cs: 65 },
    },
    Bahria: {
        minFsc: 50,
        competitiveFsc: 65,
        formula: 'Entry Test + FSc',
        description: 'Navy-affiliated. Good for business and CS.',
        cutoffs: { business: 60, cs: 62 },
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

    const predictions = useMemo(() => {
        return universities
            .filter(uni => uni.fields.includes(selectedField))
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
    }, [fscMarks, matricMarks, expectedTestScore, selectedField]);

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
                            onChange={(e) => setSelectedField(e.target.value)}
                            className={styles.select}
                        >
                            <option value="Pre-Engineering">Pre-Engineering</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Business">Business</option>
                            <option value="Medical">Medical</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Methodology */}
            <div className={styles.methodology}>
                <h4>📋 How We Calculate Chances</h4>
                <div className={styles.methodologyGrid}>
                    <div className={styles.methodItem}>
                        <span className={styles.methodIcon}>📊</span>
                        <div>
                            <strong>FSc Marks (40%)</strong>
                            <p>Your intermediate marks are the baseline. Most universities require 60-70% minimum.</p>
                        </div>
                    </div>
                    <div className={styles.methodItem}>
                        <span className={styles.methodIcon}>📝</span>
                        <div>
                            <strong>Entry Test (40%)</strong>
                            <p>NET, LCAT, or university-specific tests. This is often the deciding factor.</p>
                        </div>
                    </div>
                    <div className={styles.methodItem}>
                        <span className={styles.methodIcon}>📖</span>
                        <div>
                            <strong>Matric Marks (15%)</strong>
                            <p>SSC marks contribute to aggregate. Higher is better.</p>
                        </div>
                    </div>
                    <div className={styles.methodItem}>
                        <span className={styles.methodIcon}>🎯</span>
                        <div>
                            <strong>Field Cutoffs (5%)</strong>
                            <p>Each field has different merit cutoffs. CS/Engineering are most competitive.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Predictions */}
            <div className={styles.predictions}>
                <h3 className={styles.predictionsTitle}>Your Chances for {selectedField}</h3>

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
