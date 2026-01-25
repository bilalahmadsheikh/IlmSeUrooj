'use client';

import { useState, useMemo } from 'react';
import styles from './AdmissionPredictor.module.css';
import { universities } from '@/data/universities';
import SearchableSelect from '@/components/SearchableSelect/SearchableSelect';

// Real admission criteria with 2023-2024 merit data from official/researched sources
const admissionCriteria = {
    NUST: {
        minFsc: 60,
        competitiveFsc: 80,
        formula: 'NET (75%) + FSc (15%) + Matric (10%)',
        formulaBreakdown: [
            { component: 'NET Entry Test', weight: 75, icon: '' },
            { component: 'FSc/A-Level Marks', weight: 15, icon: '' },
            { component: 'Matric/O-Level', weight: 10, icon: '' }
        ],
        description: 'Top engineering university. NUST does not officially release cutoffs, but aggregates are estimated from merit lists.',
        cutoffs: { engineering: 72, cs: 78, business: 65 },
        meritType: 'estimated', // Cutoffs are estimated from merit list analysis
        meritHistory: {
            2024: { 'CS (SEECS)': '~73', 'SE (SEECS)': '~74', 'EE (SEECS)': '~68' },
            2023: { 'CS (SEECS)': '78.5', 'SE (SEECS)': '78.2', 'Data Science': '76.3' }
        },
        tips: 'NUST doesn\'t publish official cutoffs. Aim for NET 150+/200 and 80%+ aggregate for SEECS programs.'
    },
    LUMS: {
        minFsc: 70,
        competitiveFsc: 88,
        formula: 'Holistic (LCAT/SAT + Academics + Essays)',
        formulaBreakdown: [
            { component: 'LCAT or SAT Score', weight: 40, icon: '' },
            { component: 'Academic Record', weight: 35, icon: '' },
            { component: 'Essays & Interview', weight: 25, icon: '' }
        ],
        description: 'NO cutoffs published - holistic admissions. Considers test scores, academics, essays, and interviews together.',
        cutoffs: { business: 85, cs: 82 },
        meritType: 'holistic', // LUMS uses holistic admissions, no cutoffs
        meritHistory: {
            2024: { 'Min FSc': '70%', 'Avg Admitted': '~88%', 'Min A-Level': '2Bs+1C' },
            2023: { 'Min FSc': '70%', 'Avg Admitted': '~87%', 'Min A-Level': '2Bs+1C' }
        },
        tips: 'LUMS uses holistic admissions - no fixed cutoffs exist. Strong essays and interview can compensate for lower scores.'
    },
    FAST: {
        minFsc: 60,
        competitiveFsc: 70,
        formula: 'NU Test (50%) + FSc Part-I (50%)',
        formulaBreakdown: [
            { component: 'FAST NU Test', weight: 50, icon: '' },
            { component: 'FSc Part-I Marks', weight: 50, icon: '' }
        ],
        description: 'Best for CS. Cutoffs vary significantly by campus - Islamabad/Lahore highest, Peshawar/Faisalabad lowest.',
        cutoffs: { cs: 70, engineering: 65, se: 73 },
        meritHistory: {
            2024: { 'CS (Isb)': '73', 'CS (Lhr)': '70', 'CS (Khi)': '69', 'CS (Psh)': '53' },
            2023: { 'CS (Isb)': '70', 'SE (Isb)': '69.5', 'DS (Isb)': '68' }
        },
        tips: 'Cutoffs vary by campus! Islamabad/Lahore: 70%+, Faisalabad/Peshawar: 50-55% for same programs.'
    },
    COMSATS: {
        minFsc: 60,
        competitiveFsc: 75,
        formula: 'NTS NAT (50%) + FSc (40%) + Matric (10%)',
        formulaBreakdown: [
            { component: 'NTS NAT Test', weight: 50, icon: '' },
            { component: 'FSc Marks', weight: 40, icon: '' },
            { component: 'Matric Marks', weight: 10, icon: '' }
        ],
        description: 'Affordable federal university. Islamabad campus is most competitive. Uses NTS NAT score.',
        cutoffs: { cs: 82, se: 81, ai: 80 },
        meritHistory: {
            2024: { 'CS (Isb)': '82.7', 'SE (Isb)': '81.6', 'AI (Isb)': '80.2', 'CS (Lhr)': '84' },
            2023: { 'CS (Isb)': '~80', 'Cyber Sec': '79.2', 'BBA (Isb)': '58.6' }
        },
        tips: 'Very affordable. Lahore CS cutoff is higher than Islamabad! Multiple campuses available.'
    },
    IBA: {
        minFsc: 65,
        competitiveFsc: 80,
        formula: 'Test-Based Merit (Entry Test Score)',
        formulaBreakdown: [
            { component: 'IBA Aptitude Test', weight: 100, icon: '' },
            { component: 'Min FSc for eligibility', weight: 0, icon: '' }
        ],
        description: 'Asia\'s oldest business school. Publishes official TEST SCORE cutoffs, not aggregate percentages.',
        cutoffs: { business: 75, cs: 70 },
        meritType: 'test_score', // IBA publishes test score cutoffs, not aggregates
        meritHistory: {
            2024: { 'IBA Test Min': '180/360', 'Math Min': '80', 'English Min': '80' },
            2023: { 'IBA Test Min': '220/356', 'Math Min': '92', 'English Min': '92' }
        },
        tips: 'IBA publishes test score cutoffs, not aggregates. 2024 cutoff was 180/360 total. Focus on verbal & quant sections.'
    },
    'UET Lahore': {
        minFsc: 60,
        competitiveFsc: 78,
        formula: 'ECAT (30%) + FSc (45%) + Matric (25%)',
        formulaBreakdown: [
            { component: 'ECAT Test', weight: 30, icon: '' },
            { component: 'FSc Marks', weight: 45, icon: '' },
            { component: 'Matric Marks', weight: 25, icon: '' }
        ],
        description: 'Premier public engineering university. Publishes official aggregate cutoffs. Very affordable fees.',
        cutoffs: { engineering: 77, cs: 80 },
        meritHistory: {
            2024: { 'Mechanical': '81.65', 'Computer Eng': '80.52', 'CS': '80.45', 'Electrical': '80.08' },
            2023: { 'Architecture': '80.6', 'Mechanical': '77.7', 'Automotive': '73.9' }
        },
        tips: 'UET publishes official aggregates. Very competitive - Mechanical/CS need 80%+. Min 132/400 in ECAT required.'
    },
    GIKI: {
        minFsc: 60,
        competitiveFsc: 78,
        formula: 'GIKI Test (85%) + FSc Part-I (15%)',
        formulaBreakdown: [
            { component: 'GIKI Entry Test', weight: 85, icon: '' },
            { component: 'FSc Part-I Marks', weight: 15, icon: '' }
        ],
        description: 'Elite residential institute. ONLY releases merit POSITIONS, not percentage cutoffs.',
        cutoffs: { engineering: 75, cs: 78 },
        meritType: 'position',
        meritHistory: {
            2024: { 'CS (seats)': '~120', 'ME (seats)': '~180', 'EE (seats)': '~150' },
            2023: { 'CS (seats)': '~115', 'ME (seats)': '~175', 'EE (seats)': '~145' }
        },
        tips: 'GIKI only announces positions, not percentages. Entry test is 85% weight - test prep is crucial!'
    },
    PIEAS: {
        minFsc: 60,
        competitiveFsc: 80,
        formula: 'PIEAS Test (60%) + FSc (25%) + Matric (15%)',
        formulaBreakdown: [
            { component: 'PIEAS Written Test', weight: 60, icon: '' },
            { component: 'FSc Marks', weight: 25, icon: '' },
            { component: 'Matric Marks', weight: 15, icon: '' }
        ],
        description: 'Nuclear research institute. Publishes merit POSITIONS. Estimated aggregates from third-party analysis.',
        cutoffs: { engineering: 75, cs: 78 },
        meritType: 'estimated',
        meritHistory: {
            2024: { 'CS (pos)': '~360', 'ME (pos)': '~1220', 'EE (pos)': '~1741' },
            2023: { 'CS': '~78.6%', 'ME': '~72.2%', 'EE': '~65.6%' }
        },
        tips: 'PIEAS releases positions, aggregates are estimated. Top 1400 positions have good chances. Govt job guarantee!'
    },
    NED: {
        minFsc: 60,
        competitiveFsc: 80,
        formula: 'NED Test (60%) + Academics (40%)',
        formulaBreakdown: [
            { component: 'NED Entry Test', weight: 60, icon: '' },
            { component: 'Academic Record', weight: 40, icon: '' }
        ],
        description: 'Historic Karachi engineering university. Formula updated in 2024 to 60% test + 40% academics.',
        cutoffs: { se: 86, cs: 84, ee: 76 },
        meritHistory: {
            2024: { 'Software Eng': '86.86', 'CS': '84.2', 'Computer Sys': '83.9', 'Electronic': '76' },
            2023: { 'Formula': '50% Test + 50% FSc Part-I (different from 2024)' }
        },
        tips: 'NED changed formula in 2024! Now 60% test weight. Software Eng is most competitive at 87%.'
    },
    Bahria: {
        minFsc: 50,
        competitiveFsc: 70,
        formula: 'Entry Test (50%) + Intermediate (50%)',
        formulaBreakdown: [
            { component: 'Bahria Entry Test', weight: 50, icon: '' },
            { component: 'Intermediate Marks', weight: 50, icon: '' }
        ],
        description: 'Navy-affiliated university. Islamabad campus most competitive. Publishes aggregates.',
        cutoffs: { cs: 80, se: 78, bba: 65 },
        meritHistory: {
            2024: { 'CS/SE (Isb)': '>80%', 'BBA (Isb)': '~65%', 'Other campuses': '65-70%' },
            2023: { 'Merit lists': 'Published Aug 24', 'Top programs': '>75%' }
        },
        tips: 'Islamabad campus is very competitive (80%+ for CS). Other campuses have lower cutoffs. Navy dependents get reserved seats.'
    },
};

// Calculate user's aggregate based on university-specific merit formula
function calculateUserAggregate(fsc, matric, testScore, uniName, educationStatus = 'fsc_complete') {
    const criteria = admissionCriteria[uniName];
    if (!criteria?.formulaBreakdown) return null;

    let aggregate = 0;
    let hasTestComponent = false;
    let totalWeight = 0;
    let adjustedFormula = null;

    criteria.formulaBreakdown.forEach(component => {
        const name = component.component.toLowerCase();
        const weight = component.weight;
        totalWeight += weight;

        // Entry test components
        if (name.includes('test') || name.includes('lcat') || name.includes('sat') ||
            name.includes('net') || name.includes('ecat') || name.includes('nat') ||
            name.includes('aptitude')) {
            aggregate += (testScore * weight) / 100;
            hasTestComponent = true;
        }
        // FSc / A-Level / Academic components
        else if (name.includes('fsc') || name.includes('f.sc') || name.includes('a-level') ||
            name.includes('academic') || name.includes('intermediate') || name.includes('hssc')) {
            if (educationStatus === 'alevel_incomplete') {
                // A-Level incomplete: HSSC weight goes to O-Level instead
                aggregate += (matric * weight) / 100;
                adjustedFormula = 'Using O-Level equivalence only (A-Level pending)';
            } else {
                aggregate += (fsc * weight) / 100;
            }
        }
        // Matric / O-Level components
        else if (name.includes('matric') || name.includes('o-level') || name.includes('ssc')) {
            aggregate += (matric * weight) / 100;
        }
        // Essay / Interview components (assume 70% for subjective - conservative)
        else if (name.includes('essay') || name.includes('interview')) {
            aggregate += (70 * weight) / 100;
        }
    });

    // Set adjusted formula note for FSc incomplete
    if (educationStatus === 'fsc_incomplete') {
        adjustedFormula = 'Using FSc Part-I marks (provisional)';
    }

    // If formula doesn't total 100%, scale appropriately
    if (totalWeight > 0 && totalWeight !== 100) {
        aggregate = (aggregate / totalWeight) * 100;
    }

    return {
        aggregate: aggregate.toFixed(1),
        hasTestComponent,
        adjustedFormula,
        educationStatus,
        isIncomplete: educationStatus.includes('incomplete')
    };
}

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
    const [educationStatus, setEducationStatus] = useState('fsc_complete'); // fsc_complete, fsc_incomplete, alevel_complete, alevel_incomplete

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
                    <span className={styles.titleIcon}></span>
                    Admission Chance Predictor
                </h2>
                <p className={styles.subtitle}>
                    Enter your marks to see your chances at top Pakistani universities
                </p>
            </div>

            {/* Input Form */}
            <div className={styles.inputCard}>
                {/* Sliders Row - 3 columns on mobile */}
                <div className={styles.slidersRow}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            FSc / Inter Percentage
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
                            Matric / SSC Percentage
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
                            Entry Test Score
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
                </div>

                {/* Field Row - centered single column on mobile */}
                <div className={styles.fieldRow}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Field of Study</label>
                        <SearchableSelect
                            value={selectedField}
                            onChange={handleFieldChange}
                            options={[
                                { value: 'Pre-Engineering', label: 'Pre-Engineering' },
                                { value: 'Computer Science', label: 'Computer Science' },
                                { value: 'Business', label: 'Business' },
                                { value: 'Medical', label: 'Medical' }
                            ]}
                            placeholder="Select field..."
                        />
                    </div>
                </div>

                {/* Selectors Row - 2 columns on mobile */}
                <div className={styles.selectorsRow}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Education Status</label>
                        <SearchableSelect
                            value={educationStatus}
                            onChange={setEducationStatus}
                            options={[
                                { value: 'fsc_complete', label: 'FSc / Inter Complete' },
                                { value: 'fsc_incomplete', label: 'FSc Part-I Only (Incomplete)' },
                                { value: 'alevel_complete', label: 'A-Level Complete' },
                                { value: 'alevel_incomplete', label: 'A-Level Incomplete (O-Level Only)' }
                            ]}
                            placeholder="Select status..."
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>University</label>
                        <SearchableSelect
                            value={selectedUniversity}
                            onChange={setSelectedUniversity}
                            options={[
                                { value: 'All', label: 'All Universities' },
                                ...availableUniversities.map(uni => ({
                                    value: uni.shortName,
                                    label: `${uni.shortName} - ${uni.city}`
                                }))
                            ]}
                            placeholder="Select university..."
                        />
                    </div>
                </div>
            </div>

            {/* Methodology - Dynamic based on selected university */}
            <div className={styles.methodology}>
                <h4>
                    {selectedUniversity !== 'All'
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

                            {/* User's Calculated Aggregate */}
                            {(() => {
                                const result = calculateUserAggregate(fscMarks, matricMarks, expectedTestScore, selectedUniversity, educationStatus);
                                if (!result) return null;
                                const meritType = admissionCriteria[selectedUniversity]?.meritType;
                                const isALevel = educationStatus.includes('alevel');
                                const isIncomplete = educationStatus.includes('incomplete');

                                // Don't show aggregate for position-based or test-score-based universities
                                if (meritType === 'position' || meritType === 'test_score') {
                                    return (
                                        <div className={styles.userAggregateSection}>
                                            <div className={styles.aggregateNote}>
                                                {selectedUniversity} uses {meritType === 'position' ? 'merit positions' : 'test scores'}, not percentage aggregates
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div className={styles.userAggregateSection}>
                                        <div className={styles.aggregateHeader}>
                                            <span className={styles.aggregateLabel}>
                                                Your Calculated Aggregate{isIncomplete ? ' (Provisional)' : ''}:
                                            </span>
                                            <span className={styles.aggregateValue}>{result.aggregate}%</span>
                                        </div>
                                        <div className={styles.aggregateBreakdown}>
                                            Based on: {isALevel ? 'A-Level' : 'FSc'} {fscMarks}% | {isALevel ? 'O-Level' : 'Matric'} {matricMarks}% | Expected Test {expectedTestScore}%
                                        </div>
                                        {result.adjustedFormula && (
                                            <div className={styles.aggregateNote} style={{ background: 'rgba(251, 146, 60, 0.15)' }}>
                                                {result.adjustedFormula}
                                            </div>
                                        )}
                                        {meritType === 'holistic' && (
                                            <div className={styles.aggregateNote}>
                                                Note: LUMS uses holistic admissions - this aggregate is just for reference
                                            </div>
                                        )}
                                        {result.hasTestComponent && !isIncomplete && (
                                            <div className={styles.aggregateNote}>
                                                Your actual aggregate will depend on your entry test performance
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Historical Merit Data */}
                        {admissionCriteria[selectedUniversity].meritHistory && (
                            <div className={styles.meritHistorySection}>
                                <h5>Last 2 Years {
                                    admissionCriteria[selectedUniversity].meritType === 'position' ? 'Merit Seats' :
                                        admissionCriteria[selectedUniversity].meritType === 'test_score' ? 'Test Score Cutoffs' :
                                            admissionCriteria[selectedUniversity].meritType === 'holistic' ? 'Eligibility Requirements' :
                                                admissionCriteria[selectedUniversity].meritType === 'estimated' ? 'Estimated Merit Data' :
                                                    'Merit Cutoffs'
                                }</h5>
                                <div className={styles.meritTable}>
                                    <div className={styles.meritTableHeader}>
                                        <span>Year</span>
                                        <span>Program/Criteria</span>
                                        <span>{
                                            admissionCriteria[selectedUniversity].meritType === 'position' ? 'Seats' :
                                                admissionCriteria[selectedUniversity].meritType === 'test_score' ? 'Score' :
                                                    admissionCriteria[selectedUniversity].meritType === 'holistic' ? 'Requirement' :
                                                        admissionCriteria[selectedUniversity].meritType === 'estimated' ? 'Estimate' :
                                                            'Cutoff'
                                        }</span>
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
                                                <span className={styles.meritProgram}>{program}</span>
                                                <span className={styles.meritCutoff}>
                                                    {cutoff}{!admissionCriteria[selectedUniversity].meritType && typeof cutoff === 'number' && '%'}
                                                </span>
                                            </div>
                                        ))
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tips */}
                        {admissionCriteria[selectedUniversity].tips && (
                            <div className={styles.tipSection}>
                                <span className={styles.tipIcon}></span>
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
                            <span className={styles.methodIcon}></span>
                            <div>
                                <strong>Entry Test (40-85%)</strong>
                                <p>NET, LCAT, ECAT, or university tests. Often the deciding factor.</p>
                            </div>
                        </div>
                        <div className={styles.methodItem}>
                            <span className={styles.methodIcon}></span>
                            <div>
                                <strong>FSc/A-Level (15-50%)</strong>
                                <p>Intermediate marks baseline. Most require 60-70% minimum.</p>
                            </div>
                        </div>
                        <div className={styles.methodItem}>
                            <span className={styles.methodIcon}></span>
                            <div>
                                <strong>Matric/O-Level (10-25%)</strong>
                                <p>SSC marks contribute to aggregate calculation.</p>
                            </div>
                        </div>
                        <div className={styles.methodItem}>
                            <span className={styles.methodIcon}></span>
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
                <span></span>
                These predictions are estimates based on historical data. Actual admission depends on
                test performance, seat availability, and university policies. Always check official sources.
            </div>
        </section>
    );
}
