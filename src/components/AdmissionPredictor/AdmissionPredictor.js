'use client';

import { useState, useMemo, useEffect } from 'react';
import styles from './AdmissionPredictor.module.css';
import { universities } from '@/data/universities';
import SearchableSelect from '@/components/SearchableSelect/SearchableSelect';
import { useProfile } from '@/hooks/useProfile';

// ─── Admission criteria ────────────────────────────────────────────────────
// meritHistory always keyed by year, program names are the raw strings
// that appear on official merit lists — used for display + field filtering.
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
        description: 'Top engineering university. NUST does not officially release cutoffs — aggregates are estimated from public merit lists.',
        cutoffs: { engineering: 72, cs: 78, business: 65 },
        meritType: 'estimated',
        meritHistory: {
            // Source: NUST official merit lists, NTS.org.pk, community analysis
            2024: {
                'CS (SEECS)': '~73%', 'SE (SEECS)': '~74%', 'EE (SEECS)': '~68%',
                'Mech Eng (SMME)': '~69%', 'Civil Eng (SCEE)': '~65%', 'Chem Eng': '~63%',
                'BBA (NUST)': '~67%',
            },
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
        description: 'No fixed cutoffs — holistic admissions. Test scores, academics, essays, and interviews evaluated together.',
        cutoffs: { business: 85, cs: 82 },
        meritType: 'holistic',
        meritHistory: {
            // Source: lums.edu.pk/admissions class profile
            2024: { 'Min FSc': '70%', 'Avg Admitted FSc': '~88%', 'Min A-Level': '2Bs+1C', 'Avg LCAT': '~75th percentile' },
        },
        tips: 'LUMS uses holistic admissions — no fixed cutoffs exist. Strong essays and interview can compensate for lower scores.'
    },

    // === FAST Campus-Specific ===
    // Source: nu.edu.pk/Admissions/MeritList
    'FAST Isb': {
        minFsc: 60,
        competitiveFsc: 73,
        formula: 'NU Test (50%) + FSc Part-I (50%)',
        formulaBreakdown: [
            { component: 'FAST NU Test', weight: 50, icon: '' },
            { component: 'FSc Part-I Marks', weight: 50, icon: '' }
        ],
        description: 'FAST Islamabad — Most competitive FAST campus.',
        cutoffs: { cs: 75.3, se: 73, ai: 74, ds: 71.69, cyber: 71.45 },
        meritHistory: {
            2024: { 'CS': '75.3%', 'SE': '73.01%', 'AI': '74.0%', 'DS': '71.69%', 'Cyber Security': '71.45%' },
        },
        tips: 'Most competitive FAST campus. CS needs 75%+, SE needs 73%+. Very limited seats.'
    },
    'FAST Lhr': {
        minFsc: 60,
        competitiveFsc: 70,
        formula: 'NU Test (50%) + FSc Part-I (50%)',
        formulaBreakdown: [
            { component: 'FAST NU Test', weight: 50, icon: '' },
            { component: 'FSc Part-I Marks', weight: 50, icon: '' }
        ],
        description: 'FAST Lahore — HIGHEST CS cutoffs in FAST system.',
        cutoffs: { cs: 76.8, se: 75.6, ds: 74.4, cyber: 75.6 },
        meritHistory: {
            2024: { 'CS': '76.8%', 'SE': '75.6%', 'DS': '74.4%', 'Cyber Security': '75.6%' },
        },
        tips: 'HIGHEST FAST cutoffs! CS needs 77%+. Even harder than Islamabad for CS.'
    },
    'FAST Khi': {
        minFsc: 60,
        competitiveFsc: 69,
        formula: 'NU Test (50%) + FSc Part-I (50%)',
        formulaBreakdown: [
            { component: 'FAST NU Test', weight: 50, icon: '' },
            { component: 'FSc Part-I Marks', weight: 50, icon: '' }
        ],
        description: 'FAST Karachi — Moderate cutoffs, good for 66–70% scorers.',
        cutoffs: { cs: 68.08, se: 66.52, ai: 67.43, ds: 66.14 },
        meritHistory: {
            2024: { 'CS': '68.08%', 'SE': '66.52%', 'AI': '67.43%', 'DS': '66.14%' },
        },
        tips: 'Moderate cutoffs ~68%. Two campuses in Karachi. Good industry connections.'
    },
    'FAST Psh': {
        minFsc: 50,
        competitiveFsc: 55,
        formula: 'NU Test (50%) + FSc Part-I (50%)',
        formulaBreakdown: [
            { component: 'FAST NU Test', weight: 50, icon: '' },
            { component: 'FSc Part-I Marks', weight: 50, icon: '' }
        ],
        description: 'FAST Peshawar — Lower cutoffs than major campuses.',
        cutoffs: { cs: 58.46, se: 59.73, ai: 64.57 },
        meritHistory: {
            2024: { 'CS': '58.46%', 'SE': '59.73%', 'AI': '64.57%' },
        },
        tips: 'Lower FAST cutoffs. CS needs ~58%. Great option for FAST degree at moderate score.'
    },
    'FAST CFD': {
        minFsc: 50,
        competitiveFsc: 55,
        formula: 'NU Test (50%) + FSc Part-I (50%)',
        formulaBreakdown: [
            { component: 'FAST NU Test', weight: 50, icon: '' },
            { component: 'FSc Part-I Marks', weight: 50, icon: '' }
        ],
        description: 'FAST Chiniot-Faisalabad — Moderate cutoffs, good for 66–68% scorers.',
        cutoffs: { cs: 67.02, se: 66.68, ai: 66.35 },
        meritHistory: {
            2024: { 'CS': '67.02%', 'SE': '66.68%', 'AI': '66.35%' },
        },
        tips: 'Moderate cutoffs ~67%. Good for students not making Isb/Lhr.'
    },

    // === COMSATS Campus-Specific ===
    // Source: comsats.edu.pk merit lists
    'COMSATS Isb': {
        minFsc: 60,
        competitiveFsc: 85,
        formula: 'NTS NAT (50%) + FSc (40%) + Matric (10%)',
        formulaBreakdown: [
            { component: 'NTS NAT Test', weight: 50, icon: '' },
            { component: 'FSc Marks', weight: 40, icon: '' },
            { component: 'Matric Marks', weight: 10, icon: '' }
        ],
        description: 'COMSATS Islamabad — Flagship campus with high CS cutoffs.',
        cutoffs: { cs: 82.7, se: 81.6, ai: 80.2, cyber: 79.2, ds: 78.3 },
        meritHistory: {
            2024: { 'CS': '82.7%', 'SE': '81.6%', 'AI': '80.2%', 'Cyber': '79.2%', 'DS': '78.3%' },
        },
        tips: 'High cutoffs (82.7% for CS)! CS is very competitive despite being federal. Business easier.'
    },
    'COMSATS Lhr': {
        minFsc: 60,
        competitiveFsc: 86,
        formula: 'NTS NAT (50%) + FSc (40%) + Matric (10%)',
        formulaBreakdown: [
            { component: 'NTS NAT Test', weight: 50, icon: '' },
            { component: 'FSc Marks', weight: 40, icon: '' },
            { component: 'Matric Marks', weight: 10, icon: '' }
        ],
        description: 'COMSATS Lahore — HIGHEST COMSATS cutoffs for CS.',
        cutoffs: { cs: 87.36, se: 85.6, ce: 83.09, pharmd: 83.52, ee: 76.74 },
        meritHistory: {
            // CE = Civil Engineering, EE = Electrical Engineering at COMSATS Lahore
            2024: { 'CS': '87.36%', 'SE': '85.6%', 'Civil Eng': '83.09%', 'Electrical Eng': '76.74%', 'Pharm-D': '83.52%' },
        },
        tips: 'HIGHEST COMSATS cutoffs (87.36% CS)! Consider Wah/Abbottabad for lower cutoffs.'
    },
    'COMSATS Wah': {
        minFsc: 60,
        competitiveFsc: 80,
        formula: 'NTS NAT (50%) + FSc (40%) + Matric (10%)',
        formulaBreakdown: [
            { component: 'NTS NAT Test', weight: 50, icon: '' },
            { component: 'FSc Marks', weight: 40, icon: '' },
            { component: 'Matric Marks', weight: 10, icon: '' }
        ],
        description: 'COMSATS Wah — Good middle-ground option near Islamabad.',
        cutoffs: { cs: 80, se: 80, ai: 80 },
        meritHistory: {
            2024: { 'CS': '~80%', 'SE': '~80%', 'AI': '~80%' },
        },
        tips: 'Moderate cutoffs ~80%. Near Islamabad/Taxila. Good option if Islamabad cutoff is too high.'
    },
    'COMSATS Abbottabad': {
        minFsc: 60,
        competitiveFsc: 78,
        formula: 'NTS NAT (50%) + FSc (40%) + Matric (10%)',
        formulaBreakdown: [
            { component: 'NTS NAT Test', weight: 50, icon: '' },
            { component: 'FSc Marks', weight: 40, icon: '' },
            { component: 'Matric Marks', weight: 10, icon: '' }
        ],
        description: 'COMSATS Abbottabad — Beautiful location with moderate cutoffs.',
        cutoffs: { cs: 78, se: 75, pharmd: 77 },
        meritHistory: {
            2024: { 'CS': '78.2%', 'SE': '74.8%', 'Pharm-D': '76.7%' },
        },
        tips: 'Scenic campus in Abbottabad. CS ~78%, SE ~75%. Strong Pharm-D program.'
    },
    'COMSATS Sahiwal': {
        minFsc: 55,
        competitiveFsc: 68,
        formula: 'NTS NAT (50%) + FSc (40%) + Matric (10%)',
        formulaBreakdown: [
            { component: 'NTS NAT Test', weight: 50, icon: '' },
            { component: 'FSc Marks', weight: 40, icon: '' },
            { component: 'Matric Marks', weight: 10, icon: '' }
        ],
        description: 'COMSATS Sahiwal — Lower cutoffs, easier admission.',
        cutoffs: { cs: 68, se: 66 },
        meritHistory: {
            2024: { 'CS': '~68%', 'SE': '~66%' },
        },
        tips: 'Easy admission — CS ~68%. Good for students who want COMSATS quality at lower scores.'
    },
    'COMSATS Attock': {
        minFsc: 55,
        competitiveFsc: 62,
        formula: 'NTS NAT (50%) + FSc (40%) + Matric (10%)',
        formulaBreakdown: [
            { component: 'NTS NAT Test', weight: 50, icon: '' },
            { component: 'FSc Marks', weight: 40, icon: '' },
            { component: 'Matric Marks', weight: 10, icon: '' }
        ],
        description: 'COMSATS Attock — One of the easiest COMSATS campuses.',
        cutoffs: { cs: 62, se: 60 },
        meritHistory: {
            2024: { 'CS': '~62%', 'SE': '~60%' },
        },
        tips: 'Very easy admission — CS ~62%. Near Islamabad. Great backup option.'
    },
    'COMSATS Vehari': {
        minFsc: 50,
        competitiveFsc: 58,
        formula: 'NTS NAT (50%) + FSc (40%) + Matric (10%)',
        formulaBreakdown: [
            { component: 'NTS NAT Test', weight: 50, icon: '' },
            { component: 'FSc Marks', weight: 40, icon: '' },
            { component: 'Matric Marks', weight: 10, icon: '' }
        ],
        description: 'COMSATS Vehari — Lowest COMSATS cutoffs.',
        cutoffs: { cs: 58, se: 56 },
        meritHistory: {
            2024: { 'CS': '~58%', 'SE': '~56%' },
        },
        tips: 'Easiest COMSATS campus — CS as low as 55–58%.'
    },

    IBA: {
        minFsc: 65,
        competitiveFsc: 80,
        formula: 'Test-Based Merit (IBA Aptitude Test Score)',
        formulaBreakdown: [
            { component: 'IBA Aptitude Test', weight: 100, icon: '' },
            { component: 'Min FSc for eligibility', weight: 0, icon: '' }
        ],
        description: 'Asia\'s oldest business school. Publishes TEST SCORE cutoffs, not aggregate percentages.',
        cutoffs: { business: 75, cs: 70 },
        meritType: 'test_score',
        meritHistory: {
            // Source: iba.edu.pk/admissions
            2024: { 'Total Score (min)': '180 / 360', 'Math (min)': '80', 'English (min)': '80', 'CS score (min)': '~168 / 360' },
        },
        tips: 'IBA publishes test score cutoffs, not aggregates. 2024 BBA cutoff was 180/360 total. Focus on verbal & quant.'
    },

    // === UET Campus-Specific ===
    // Source: uet.edu.pk/admissions/merit-lists
    'UET Lahore': {
        minFsc: 60,
        competitiveFsc: 80,
        formula: 'ECAT (30%) + FSc (45%) + Matric (25%)',
        formulaBreakdown: [
            { component: 'ECAT Test', weight: 30, icon: '' },
            { component: 'FSc Marks', weight: 45, icon: '' },
            { component: 'Matric Marks', weight: 25, icon: '' }
        ],
        description: 'UET Lahore — Flagship campus with highest cutoffs.',
        cutoffs: { me: 82, cs: 80, ee: 80 },
        meritHistory: {
            2024: {
                'CS (Comp Eng)': '80.45%', 'Mechanical': '81.65%', 'Electrical': '80.08%',
                'Civil': '76.3%', 'Chemical': '74.1%',
            },
        },
        tips: 'Most competitive UET campus. ME/CS need 80%+. Min 132/400 in ECAT for eligibility.'
    },
    'UET Taxila': {
        minFsc: 60,
        competitiveFsc: 75,
        formula: 'ECAT (30%) + FSc (45%) + Matric (25%)',
        formulaBreakdown: [
            { component: 'ECAT Test', weight: 30, icon: '' },
            { component: 'FSc Marks', weight: 45, icon: '' },
            { component: 'Matric Marks', weight: 25, icon: '' }
        ],
        description: 'UET Taxila — Slightly lower cutoffs than Lahore campus.',
        cutoffs: { me: 75, se: 73, ee: 72 },
        meritHistory: {
            // Source: uettaxila.edu.pk/admissions
            2024: { 'SE (Software)': '~73%', 'Mechanical': '~75%', 'Electrical': '~72%', 'Civil': '~69%' },
        },
        tips: 'Lower cutoffs than Lahore — ~73–75%. Near Islamabad. Good option if Lahore is too competitive.'
    },

    GIKI: {
        minFsc: 60,
        competitiveFsc: 78,
        formula: 'GIKI Test (85%) + FSc Part-I (15%)',
        formulaBreakdown: [
            { component: 'GIKI Entry Test', weight: 85, icon: '' },
            { component: 'FSc Part-I Marks', weight: 15, icon: '' }
        ],
        description: 'Elite residential institute. Releases MERIT POSITIONS only (rank of last admitted student), not percentage cutoffs.',
        cutoffs: { engineering: 75, cs: 78 },
        meritType: 'position',
        meritHistory: {
            // Source: giki.edu.pk/admissions — closing merit positions 2024
            2024: { 'CS (closed at)': '#326', 'ME (closed at)': '#1,400+', 'EE (closed at)': '#2,000+' },
        },
        tips: 'GIKI releases closing merit positions. CS most competitive (~326). ME/EE close at 1,300–2,000+.'
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
            // Source: pieas.edu.pk/admissions — estimated from community analysis
            2024: { 'CS (est. pos.)': '~360', 'ME (est. pos.)': '~1,220', 'EE (est. pos.)': '~1,741' },
        },
        tips: 'PIEAS releases positions, aggregates are estimated. Top 1,400 positions have good chances. Govt job guarantee!'
    },
    NED: {
        minFsc: 60,
        competitiveFsc: 85,
        formula: 'NED Test (60%) + Academics (40%)',
        formulaBreakdown: [
            { component: 'NED Entry Test', weight: 60, icon: '' },
            { component: 'Academic Record', weight: 40, icon: '' }
        ],
        description: 'Historic Karachi engineering university. Formula updated in 2024 to 60% test + 40% academics.',
        cutoffs: { se: 87, cs: 84, ee: 76 },
        meritHistory: {
            // Source: neduet.edu.pk/admissions/merit-list-2024
            2024: { 'Software Eng': '86.86%', 'CS': '84.2%', 'Computer Sys Eng': '83.9%', 'Electrical': '76.5%', 'Civil': '73.2%' },
        },
        tips: 'NED changed formula in 2024! Now 60% test weight. Software Eng most competitive at 87%.'
    },

    // === Bahria Campus-Specific ===
    // Source: bahria.edu.pk/buic/admissions/merit-list
    'Bahria Isb': {
        minFsc: 55,
        competitiveFsc: 80,
        formula: 'Entry Test (50%) + Intermediate (50%)',
        formulaBreakdown: [
            { component: 'Bahria Entry Test', weight: 50, icon: '' },
            { component: 'Intermediate Marks', weight: 50, icon: '' }
        ],
        description: 'Bahria Islamabad — Most competitive Bahria campus.',
        cutoffs: { cs: 80, se: 78, bba: 65 },
        meritHistory: {
            2024: { 'CS': '>82%', 'SE': '>80%', 'BBA': '~65%' },
        },
        tips: 'Most competitive Bahria campus — CS needs 80%+. Navy dependents get reserved seats.'
    },
    'Bahria Lhr': {
        minFsc: 55,
        competitiveFsc: 72,
        formula: 'Entry Test (50%) + Intermediate (50%)',
        formulaBreakdown: [
            { component: 'Bahria Entry Test', weight: 50, icon: '' },
            { component: 'Intermediate Marks', weight: 50, icon: '' }
        ],
        description: 'Bahria Lahore — Moderate cutoffs, lower than Islamabad.',
        cutoffs: { cs: 72, se: 70, bba: 60 },
        meritHistory: {
            2024: { 'CS': '~72%', 'SE': '~70%', 'BBA': '~60%' },
        },
        tips: 'Lower cutoffs than Islamabad — CS ~70–72%. Growing campus with good facilities.'
    },
    'Bahria Khi': {
        minFsc: 50,
        competitiveFsc: 68,
        formula: 'Entry Test (50%) + Intermediate (50%)',
        formulaBreakdown: [
            { component: 'Bahria Entry Test', weight: 50, icon: '' },
            { component: 'Intermediate Marks', weight: 50, icon: '' }
        ],
        description: 'Bahria Karachi — Easiest Bahria campus, has medical programs.',
        cutoffs: { cs: 68, se: 65, bba: 55 },
        meritHistory: {
            2024: { 'CS': '~68%', 'SE': '~65%', 'BBA': '~55%' },
        },
        tips: 'Easiest Bahria campus — CS ~65–68%. Has medical programs (MBBS, BDS).'
    },
};

// ── Field ↔ cutoff-key mapping ─────────────────────────────────────────────
const FIELD_CUTOFF_KEYS = {
    'Pre-Engineering': ['engineering', 'me', 'ee', 'ce'],
    'Computer Science': ['cs', 'se', 'ai', 'ds', 'cyber'],
    'Business': ['business', 'bba'],
    'Medical': ['mbbs', 'pharmd'],
};

const PROGRAM_LABELS = {
    cs: 'CS', se: 'SE', ai: 'AI', ds: 'DS', cyber: 'Cyber',
    engineering: 'Engineering', me: 'Mech. Eng', ee: 'Elec. Eng', ce: 'Civil Eng',
    business: 'Business', bba: 'BBA',
    mbbs: 'MBBS', pharmd: 'Pharm-D',
};

// ── Merit history helpers ──────────────────────────────────────────────────

/**
 * Classify a merit-list program name string into a field of study.
 * Returns null if the program can't be classified.
 */
function classifyMeritProg(progName) {
    const p = ` ${progName.toLowerCase().replace(/[()]/g, ' ')} `;

    // Computer Science indicators
    if (/\bcs\b/.test(p) || /\bse\b/.test(p) || /\bai\b/.test(p) ||
        /\bds\b/.test(p) || /\bcyber/.test(p) || /software/.test(p) ||
        /artificial/.test(p) || /data sci/.test(p) || /computing/.test(p) ||
        /seecs/.test(p) || /information tech/.test(p)) {
        return 'Computer Science';
    }

    // Pre-Engineering indicators
    if (/\bme\b/.test(p) || /\bee\b/.test(p) || /\bce\b/.test(p) ||
        /mechanical/.test(p) || /electrical/.test(p) || /civil/.test(p) ||
        /chemical/.test(p) || /aerospace/.test(p) || /petroleum/.test(p) ||
        /\beng\b/.test(p) || /engineering/.test(p) || /mechatronics/.test(p)) {
        return 'Pre-Engineering';
    }

    // Business indicators
    if (/\bbba\b/.test(p) || /\bmba\b/.test(p) || /business/.test(p) ||
        /accounting/.test(p) || /finance/.test(p) || /economics/.test(p)) {
        return 'Business';
    }

    // Medical indicators
    if (/mbbs/.test(p) || /\bbds\b/.test(p) || /pharm/.test(p) ||
        /medicine/.test(p) || /medical/.test(p)) {
        return 'Medical';
    }

    return null;
}

/**
 * Return { year, programs } for the most recent year,
 * filtered to only programs matching the given field.
 * Falls back to all programs if none match (e.g. holistic unis).
 */
function filterMeritByField(meritHistory, field) {
    if (!meritHistory) return null;
    const years = Object.keys(meritHistory).sort().reverse();
    const latestYear = years[0];
    if (!latestYear) return null;

    const allProgs = meritHistory[latestYear];
    const filtered = {};
    let hasMatch = false;

    Object.entries(allProgs).forEach(([prog, val]) => {
        if (classifyMeritProg(prog) === field) {
            filtered[prog] = val;
            hasMatch = true;
        }
    });

    // Fallback: if nothing matched the field (e.g. LUMS holistic), show all
    return { year: latestYear, programs: hasMatch ? filtered : allProgs };
}

// ── Cutoff / bucket helpers ────────────────────────────────────────────────

function getPrimaryFieldCutoff(criteria, field) {
    const keys = FIELD_CUTOFF_KEYS[field] || [];
    for (const key of keys) {
        if (criteria?.cutoffs?.[key] != null) return { key, value: criteria.cutoffs[key] };
    }
    return null;
}

function getFieldPrograms(criteria, field) {
    const keys = FIELD_CUTOFF_KEYS[field] || [];
    return keys
        .filter(k => criteria?.cutoffs?.[k] != null)
        .map(k => ({ key: k, label: PROGRAM_LABELS[k] || k.toUpperCase(), cutoff: criteria.cutoffs[k] }));
}

function getBucket(gap) {
    if (gap >= 2)   return { bucket: 'safety',   color: 'green',  bucketLabel: 'Safety'   };
    if (gap >= -3)  return { bucket: 'match',    color: 'yellow', bucketLabel: 'Match'    };
    if (gap >= -10) return { bucket: 'reach',    color: 'orange', bucketLabel: 'Reach'    };
    return                  { bucket: 'longshot', color: 'red',    bucketLabel: 'Longshot' };
}

/** Universities using positions / holistic / test scores don't get a chance card */
function isRequirementsBased(meritType) {
    return meritType === 'position' || meritType === 'holistic' || meritType === 'test_score';
}

// ── Reverse calculator ─────────────────────────────────────────────────────

function calculateReverseTestScore(fsc, matric, targetCutoff, uniName) {
    const criteria = admissionCriteria[uniName];
    if (!criteria?.formulaBreakdown) return null;

    let testWeight = 0;
    let nonTestContrib = 0;

    criteria.formulaBreakdown.forEach(comp => {
        const name = comp.component.toLowerCase();
        const w = comp.weight;
        if (name.includes('test') || name.includes('lcat') || name.includes('sat') ||
            name.includes('net') || name.includes('ecat') || name.includes('nat') || name.includes('aptitude')) {
            testWeight += w;
        } else if (name.includes('fsc') || name.includes('intermediate') ||
                   name.includes('academic') || name.includes('a-level') || name.includes('hssc')) {
            nonTestContrib += fsc * w / 100;
        } else if (name.includes('matric') || name.includes('o-level') || name.includes('ssc')) {
            nonTestContrib += matric * w / 100;
        } else if (name.includes('essay') || name.includes('interview')) {
            nonTestContrib += 70 * w / 100;
        }
    });

    if (testWeight === 0) return null;
    const required = (targetCutoff - nonTestContrib) * 100 / testWeight;
    return Math.ceil(required * 10) / 10;
}

// ── calculateUserAggregate ─────────────────────────────────────────────────
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

        if (name.includes('test') || name.includes('lcat') || name.includes('sat') ||
            name.includes('net') || name.includes('ecat') || name.includes('nat') || name.includes('aptitude')) {
            aggregate += (testScore * weight) / 100;
            hasTestComponent = true;
        } else if (name.includes('fsc') || name.includes('f.sc') || name.includes('a-level') ||
                   name.includes('academic') || name.includes('intermediate') || name.includes('hssc')) {
            if (educationStatus === 'alevel_incomplete') {
                aggregate += (matric * weight) / 100;
                adjustedFormula = 'Using O-Level equivalence only (A-Level pending)';
            } else {
                aggregate += (fsc * weight) / 100;
            }
        } else if (name.includes('matric') || name.includes('o-level') || name.includes('ssc')) {
            aggregate += (matric * weight) / 100;
        } else if (name.includes('essay') || name.includes('interview')) {
            aggregate += (70 * weight) / 100;
        }
    });

    if (educationStatus === 'fsc_incomplete') {
        adjustedFormula = 'Using FSc Part-I marks (provisional)';
    }

    if (totalWeight > 0 && totalWeight !== 100) {
        aggregate = (aggregate / totalWeight) * 100;
    }

    return {
        aggregate: aggregate.toFixed(1),
        hasTestComponent,
        adjustedFormula,
        educationStatus,
        isIncomplete: educationStatus.includes('incomplete'),
    };
}

// ── calculateChance (aggregate-based when possible) ───────────────────────
function calculateChance(fsc, matric, field, testScore, uniName, educationStatus = 'fsc_complete') {
    const criteria = admissionCriteria[uniName];
    if (!criteria) return { chance: 'Unknown', bucket: 'unknown', color: 'gray', score: 0 };

    if (fsc < criteria.minFsc) {
        return {
            chance: 'Not Eligible', bucket: 'ineligible', color: 'red', score: 0,
            reason: `Minimum ${criteria.minFsc}% FSc required`,
        };
    }

    const primaryCutoffInfo = getPrimaryFieldCutoff(criteria, field);
    const aggResult = calculateUserAggregate(fsc, matric, testScore, uniName, educationStatus);
    const userAgg = aggResult ? parseFloat(aggResult.aggregate) : null;

    if (userAgg !== null && primaryCutoffInfo) {
        const gap = userAgg - primaryCutoffInfo.value;
        const { bucket, color, bucketLabel } = getBucket(gap);
        const score = Math.round(Math.min(100, Math.max(0, 50 + gap * 5)));
        const absGap = Math.abs(gap).toFixed(1);

        const reason =
            gap >= 5  ? `${absGap}% above cutoff — strong candidate` :
            gap >= 2  ? `${absGap}% above cutoff — competitive position` :
            gap >= 0  ? 'Right at cutoff — entry test performance is decisive' :
            gap >= -3 ? `${absGap}% below cutoff — entry test is key` :
            gap >= -10 ? `${absGap}% below cutoff — need excellent test score` :
                         `${absGap}% below cutoff — consider backup options`;

        return { chance: bucketLabel, bucket, color, score, gap, userAggregate: userAgg, cutoff: primaryCutoffInfo.value, reason, aggResult };
    }

    // Fallback heuristic (NUST estimated, etc.)
    let score = 0;
    if (fsc >= criteria.competitiveFsc) score += 40;
    else if (fsc >= criteria.minFsc + 10) score += 25;
    else score += 10;

    if (testScore >= 80) score += 40;
    else if (testScore >= 70) score += 30;
    else if (testScore >= 60) score += 20;
    else if (testScore >= 50) score += 10;

    if (matric >= 90) score += 15;
    else if (matric >= 80) score += 10;
    else if (matric >= 70) score += 5;

    if (score >= 80) return { chance: 'High', bucket: 'safety', color: 'green', score, reason: 'Strong candidate with competitive scores' };
    if (score >= 60) return { chance: 'Medium', bucket: 'match', color: 'yellow', score, reason: 'Decent chance, entry test performance is key' };
    if (score >= 40) return { chance: 'Low', bucket: 'reach', color: 'orange', score, reason: 'Need excellent entry test score to compensate' };
    return { chance: 'Very Low', bucket: 'longshot', color: 'red', score, reason: 'Consider backup options' };
}

// ── Gauge component ────────────────────────────────────────────────────────
function Gauge({ score }) {
    const R = 40;
    const circ = Math.PI * R;
    const clampedScore = Math.min(100, Math.max(0, score));
    const offset = circ * (1 - clampedScore / 100);
    const strokeColor = clampedScore >= 65 ? '#10B981' : clampedScore >= 40 ? '#F59E0B' : '#EF4444';
    return (
        <div className={styles.gaugeWrapper}>
            <svg width="110" height="66" viewBox="0 0 110 66" className={styles.gaugeSvg}>
                <path d="M15 55 A40 40 0 0 1 95 55" fill="none" stroke="var(--color-bg-tertiary)" strokeWidth="10" strokeLinecap="round" />
                <path d="M15 55 A40 40 0 0 1 95 55" fill="none"
                    stroke={strokeColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${circ} ${circ}`}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
                />
            </svg>
            <div className={styles.gaugeValue} style={{ color: strokeColor }}>{clampedScore}</div>
            <div className={styles.gaugeLabel}>Competitiveness</div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdmissionPredictor({ savedIds = [] }) {
    const { profile, getEffectiveInterData } = useProfile();
    const [fscMarks, setFscMarks] = useState(75);
    const [matricMarks, setMatricMarks] = useState(85);
    const [expectedTestScore, setExpectedTestScore] = useState(70);
    const [selectedField, setSelectedField] = useState('Pre-Engineering');
    const [selectedUniversity, setSelectedUniversity] = useState('GIKI');
    const [educationStatus, setEducationStatus] = useState('fsc_complete');
    const [profilePreFilled, setProfilePreFilled] = useState(false);
    const [showReverse, setShowReverse] = useState(false);

    useEffect(() => {
        if (!profile) return;
        let didPrefill = false;

        const interData = getEffectiveInterData();
        if (interData?.percentage && !interData.cannotCalculate) {
            setFscMarks(Math.round(parseFloat(interData.percentage)));
            didPrefill = true;
        }

        if (profile.matric_percentage) {
            setMatricMarks(Math.round(parseFloat(profile.matric_percentage)));
            didPrefill = true;
        } else if (profile.ibcc_equivalent_matric) {
            setMatricMarks(Math.round(parseFloat(profile.ibcc_equivalent_matric)));
            didPrefill = true;
        }

        if (profile.net_score || profile.ecat_score) {
            setExpectedTestScore(Math.round(parseFloat(profile.net_score || profile.ecat_score)));
            didPrefill = true;
        }

        if (profile.preferred_field) {
            const fieldMap = {
                'Pre-Engineering': 'Pre-Engineering', 'Computer Science': 'Computer Science',
                'Business': 'Business', 'Medical': 'Medical', 'Pre-Medical': 'Medical',
            };
            const mapped = fieldMap[profile.preferred_field];
            if (mapped) { setSelectedField(mapped); didPrefill = true; }
        }

        if (profile.education_system === 'cambridge') {
            setEducationStatus(profile.inter_status === 'not_started' || profile.inter_status === 'part1_only'
                ? 'alevel_incomplete' : 'alevel_complete');
        } else if (profile.inter_status) {
            const statusMap = {
                'completed': 'fsc_complete', 'result_awaited': 'fsc_complete',
                'appearing': 'fsc_incomplete', 'part1_only': 'fsc_incomplete', 'not_started': 'fsc_incomplete',
            };
            if (statusMap[profile.inter_status]) setEducationStatus(statusMap[profile.inter_status]);
        }

        if (didPrefill) setProfilePreFilled(true);
    }, [profile]);

    const availableUniversities = useMemo(() => {
        return universities.filter(uni =>
            uni.fields.includes(selectedField) && admissionCriteria[uni.shortName]
        );
    }, [selectedField]);

    // ── Split predictions into aggregate-chance vs requirements-only ───────
    const { aggregatePredictions, requirementsPredictions } = useMemo(() => {
        let filtered = universities.filter(uni => uni.fields.includes(selectedField));
        if (selectedUniversity !== 'All') {
            filtered = filtered.filter(uni => uni.shortName === selectedUniversity);
        }

        const aggregate = [];
        const requirements = [];

        filtered.forEach(uni => {
            const criteria = admissionCriteria[uni.shortName];
            const meritType = criteria?.meritType;
            const filteredHistory = filterMeritByField(criteria?.meritHistory, selectedField);

            if (isRequirementsBased(meritType)) {
                requirements.push({ ...uni, criteria, filteredHistory });
                return;
            }

            // Aggregate-based chance card
            const prediction = calculateChance(fscMarks, matricMarks, selectedField, expectedTestScore, uni.shortName, educationStatus);
            const programs = getFieldPrograms(criteria, selectedField);
            const userAgg = prediction.userAggregate;
            const programCutoffs = userAgg != null
                ? programs.map(p => ({ ...p, gap: userAgg - p.cutoff, ...getBucket(userAgg - p.cutoff) }))
                : programs;

            aggregate.push({ ...uni, criteria, prediction, programCutoffs, filteredHistory });
        });

        return {
            aggregatePredictions: aggregate.sort((a, b) => b.prediction.score - a.prediction.score),
            requirementsPredictions: requirements,
        };
    }, [fscMarks, matricMarks, expectedTestScore, selectedField, selectedUniversity, educationStatus]);

    const bucketGroups = useMemo(() => {
        if (selectedUniversity !== 'All') return null;
        const groups = { safety: [], match: [], reach: [], longshot: [], ineligible: [], unknown: [] };
        aggregatePredictions.forEach(p => {
            const b = p.prediction.bucket || 'unknown';
            (groups[b] || groups.unknown).push(p);
        });
        return groups;
    }, [aggregatePredictions, selectedUniversity]);

    // Filtered merit for methodology section
    const methodologyMerit = useMemo(() => {
        if (selectedUniversity === 'All') return null;
        const crit = admissionCriteria[selectedUniversity];
        return filterMeritByField(crit?.meritHistory, selectedField);
    }, [selectedUniversity, selectedField]);

    // Reverse calculator
    const reverseCalcData = useMemo(() => {
        if (selectedUniversity === 'All' || !showReverse) return null;
        const criteria = admissionCriteria[selectedUniversity];
        if (!criteria) return null;
        const meritType = criteria.meritType;
        if (meritType === 'position' || meritType === 'holistic') return { unsupported: true, meritType };

        const programs = getFieldPrograms(criteria, selectedField);
        if (!programs.length) return null;

        const testWeight = criteria.formulaBreakdown?.reduce((acc, comp) => {
            const name = comp.component.toLowerCase();
            if (name.includes('test') || name.includes('lcat') || name.includes('sat') ||
                name.includes('net') || name.includes('ecat') || name.includes('nat') || name.includes('aptitude')) {
                return acc + comp.weight;
            }
            return acc;
        }, 0) || 0;

        if (testWeight === 0) return { noTest: true };

        return programs.map(prog => ({
            ...prog,
            requiredTestScore: calculateReverseTestScore(fscMarks, matricMarks, prog.cutoff, selectedUniversity),
        }));
    }, [selectedUniversity, selectedField, fscMarks, matricMarks, showReverse]);

    // Fix #6: default to most competitive uni when field changes
    const handleFieldChange = (newField) => {
        setSelectedField(newField);
        const currentUni = universities.find(u => u.shortName === selectedUniversity);
        if (selectedUniversity === 'All' || (currentUni && !currentUni.fields.includes(newField))) {
            const matches = universities
                .filter(u => u.fields.includes(newField) && admissionCriteria[u.shortName])
                .sort((a, b) => (a.ranking || 999) - (b.ranking || 999));
            setSelectedUniversity(matches[0]?.shortName || 'All');
        }
    };

    // ── Aggregate-based card renderer ──────────────────────────────────────
    const renderCard = (uni) => {
        const isSavedUni = savedIds.includes(uni.id);
        const { prediction, programCutoffs, filteredHistory } = uni;

        return (
            <div key={uni.id} className={`${styles.predictionCard} ${isSavedUni ? styles.predictionCardSaved : ''}`}>
                <div className={styles.predictionHeader}>
                    <div className={styles.uniLogo}>{uni.shortName.charAt(0)}</div>
                    <div className={styles.uniInfo}>
                        <h4>{uni.shortName}{isSavedUni && <span className={styles.savedTag}>Saved</span>}</h4>
                        <p>{uni.city} • {uni.type}</p>
                    </div>
                    <div className={`${styles.chanceBadge} ${styles[prediction.color]}`}>
                        <span className={styles.chanceText}>{prediction.chance}</span>
                        {prediction.gap != null ? (
                            <span className={`${styles.chanceScore} ${prediction.gap >= 0 ? styles.gapPos : styles.gapNeg}`}>
                                {prediction.gap >= 0 ? `+${prediction.gap.toFixed(1)}%` : `${prediction.gap.toFixed(1)}%`}
                            </span>
                        ) : (
                            <span className={styles.chanceScore}>{prediction.score}/100</span>
                        )}
                    </div>
                </div>

                <div className={styles.predictionBody}>
                    {uni.criteria && (
                        <>
                            {/* Aggregate gap indicator */}
                            {prediction.userAggregate != null && prediction.cutoff != null && (
                                <div className={styles.aggregateGapRow}>
                                    <span>Your agg: <strong>{prediction.userAggregate.toFixed(1)}%</strong></span>
                                    <span className={styles.gapArrow}>→</span>
                                    <span>Cutoff: <strong>{prediction.cutoff}%</strong></span>
                                    <span className={`${styles.gapPill} ${prediction.gap >= 0 ? styles.gapPillPos : styles.gapPillNeg}`}>
                                        {prediction.gap >= 0 ? `+${prediction.gap.toFixed(1)}%` : `${prediction.gap.toFixed(1)}%`}
                                    </span>
                                </div>
                            )}

                            {/* Program-level table (multiple programs) */}
                            {programCutoffs.length > 1 && (
                                <div className={styles.programTable}>
                                    {programCutoffs.map(prog => (
                                        <div key={prog.key} className={styles.programRow}>
                                            <span className={styles.progLabel}>{prog.label}</span>
                                            <span className={styles.progCutoff}>{prog.cutoff}%</span>
                                            {prog.gap != null && (
                                                <span className={`${styles.progGap} ${prog.gap >= 0 ? styles.gapPos : styles.gapNeg}`}>
                                                    {prog.gap >= 0 ? `+${prog.gap.toFixed(1)}` : prog.gap.toFixed(1)}
                                                </span>
                                            )}
                                            {prog.bucketLabel && (
                                                <span className={`${styles.progBucket} ${styles[prog.color]}`}>{prog.bucketLabel}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Inline field-filtered merit history */}
                            {filteredHistory && Object.keys(filteredHistory.programs).length > 0 && (
                                <div className={styles.inlineHistory}>
                                    <span className={styles.historyYear}>{filteredHistory.year}:</span>
                                    {Object.entries(filteredHistory.programs).slice(0, 3).map(([prog, cut]) => (
                                        <span key={prog} className={styles.historyItem}>
                                            {prog} <strong>{cut}</strong>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <p className={styles.reason}>{prediction.reason}</p>
                        </>
                    )}
                </div>

                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{
                        width: `${prediction.score}%`,
                        background: prediction.color === 'green' ? 'var(--color-success)' :
                            prediction.color === 'yellow' ? 'var(--color-warning)' :
                            prediction.color === 'orange' ? '#f97316' : 'var(--color-danger)'
                    }} />
                </div>
            </div>
        );
    };

    // ── Requirements card renderer (GIKI/IBA/LUMS) ────────────────────────
    const renderRequirementsCard = (uni) => {
        const isSavedUni = savedIds.includes(uni.id);
        const { criteria, filteredHistory } = uni;
        const meritType = criteria?.meritType;

        const typeConfig = {
            position:   { icon: '#', label: 'Merit Position', note: 'Admission is by merit position (rank of last admitted student), not aggregate %.' },
            test_score: { icon: '✎', label: 'Test Score',    note: 'Admission is based entirely on entry test score. FSc determines eligibility only.' },
            holistic:   { icon: '◈', label: 'Holistic',      note: 'Holistic admissions — essays, interview, and test scores evaluated together. No fixed cutoffs.' },
        };
        const cfg = typeConfig[meritType] || { icon: '?', label: 'Requirements', note: '' };

        return (
            <div key={uni.id} className={`${styles.predictionCard} ${styles.requirementsCard} ${isSavedUni ? styles.predictionCardSaved : ''}`}>
                <div className={styles.predictionHeader}>
                    <div className={`${styles.uniLogo} ${styles.reqLogo}`}>{uni.shortName.charAt(0)}</div>
                    <div className={styles.uniInfo}>
                        <h4>{uni.shortName}{isSavedUni && <span className={styles.savedTag}>Saved</span>}</h4>
                        <p>{uni.city} • {uni.type}</p>
                    </div>
                    <div className={`${styles.chanceBadge} ${styles.reqBadge}`}>
                        <span className={styles.reqBadgeIcon}>{cfg.icon}</span>
                        <span className={styles.reqBadgeLabel}>{cfg.label}</span>
                    </div>
                </div>

                <div className={styles.predictionBody}>
                    <p className={styles.reqNote}>{cfg.note}</p>

                    {filteredHistory && Object.keys(filteredHistory.programs).length > 0 && (
                        <div className={styles.reqTable}>
                            <div className={styles.reqTableTitle}>{filteredHistory.year} data</div>
                            {Object.entries(filteredHistory.programs).map(([prog, val]) => (
                                <div key={prog} className={styles.reqRow}>
                                    <span className={styles.reqProg}>{prog}</span>
                                    <span className={styles.reqVal}>{val}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {criteria?.tips && <p className={styles.reason}>{criteria.tips}</p>}
                </div>
            </div>
        );
    };

    const gaugeScore = selectedUniversity !== 'All' && aggregatePredictions.length > 0
        ? aggregatePredictions[0].prediction.score
        : 0;

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <span className={styles.titleIcon}></span>
                    Admission Chance Predictor
                </h2>
                <p className={styles.subtitle}>Enter your marks to see your chances at top Pakistani universities</p>
                {profilePreFilled && (
                    <span className={styles.profileBadge}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        Pre-filled from your profile
                    </span>
                )}
            </div>

            {/* Input Form */}
            <div className={styles.inputCard}>
                <div className={styles.slidersRow}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            FSc / Inter Percentage
                            <span className={styles.value}>{fscMarks}%</span>
                        </label>
                        <input type="range" min="50" max="100" value={fscMarks}
                            onChange={(e) => setFscMarks(parseInt(e.target.value))}
                            className={styles.slider} />
                        <div className={styles.sliderLabels}><span>50%</span><span>100%</span></div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            Matric / SSC Percentage
                            <span className={styles.value}>{matricMarks}%</span>
                        </label>
                        <input type="range" min="50" max="100" value={matricMarks}
                            onChange={(e) => setMatricMarks(parseInt(e.target.value))}
                            className={styles.slider} />
                        <div className={styles.sliderLabels}><span>50%</span><span>100%</span></div>
                    </div>

                    <div className={`${styles.inputGroup} ${styles.testSlider}`}>
                        <label className={styles.label}>
                            Entry Test Score
                            <span className={styles.value}>{expectedTestScore}%</span>
                        </label>
                        <input type="range" min="30" max="100" value={expectedTestScore}
                            onChange={(e) => setExpectedTestScore(parseInt(e.target.value))}
                            className={styles.slider} />
                        <div className={styles.sliderLabels}><span>30%</span><span>100%</span></div>
                    </div>
                </div>

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
                                    label: `${uni.shortName} — ${uni.city}`
                                }))
                            ]}
                            placeholder="Select university..."
                        />
                    </div>
                </div>
            </div>

            {/* Methodology */}
            <div className={styles.methodology}>
                <div className={styles.methodologyTop}>
                    <h4>
                        {selectedUniversity !== 'All'
                            ? `How ${selectedUniversity} Calculates Merit`
                            : 'How We Calculate Chances'}
                    </h4>
                    {selectedUniversity !== 'All' && aggregatePredictions.length > 0 && (
                        <Gauge score={gaugeScore} />
                    )}
                </div>

                {selectedUniversity !== 'All' && admissionCriteria[selectedUniversity] ? (
                    <>
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
                                                <div className={styles.weightFill} style={{ width: `${item.weight}%` }} />
                                                <span className={styles.weightPercent}>{item.weight}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* User aggregate */}
                            {(() => {
                                const result = calculateUserAggregate(fscMarks, matricMarks, expectedTestScore, selectedUniversity, educationStatus);
                                if (!result) return null;
                                const meritType = admissionCriteria[selectedUniversity]?.meritType;
                                const isALevel = educationStatus.includes('alevel');
                                const isIncomplete = educationStatus.includes('incomplete');

                                if (meritType === 'position' || meritType === 'test_score') {
                                    return (
                                        <div className={styles.userAggregateSection}>
                                            <div className={styles.aggregateNote}>
                                                {selectedUniversity} uses {meritType === 'position' ? 'merit positions' : 'test scores'} — aggregate % is not the selection criterion
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
                                            <div className={styles.aggregateNote}>Note: LUMS uses holistic admissions — this aggregate is just for reference</div>
                                        )}
                                        {result.hasTestComponent && !isIncomplete && (
                                            <div className={styles.aggregateNote}>Your actual aggregate will depend on your entry test performance</div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Merit history — last year only, filtered by selected field */}
                        {methodologyMerit && Object.keys(methodologyMerit.programs).length > 0 && (
                            <div className={styles.meritHistorySection}>
                                <h5>
                                    {admissionCriteria[selectedUniversity].meritType === 'position' ? 'Closing Merit Positions' :
                                     admissionCriteria[selectedUniversity].meritType === 'test_score' ? 'Test Score Requirements' :
                                     admissionCriteria[selectedUniversity].meritType === 'holistic' ? 'Admission Profile' :
                                     admissionCriteria[selectedUniversity].meritType === 'estimated' ? 'Estimated Cutoffs' :
                                     'Merit Cutoffs'}
                                    {' — '}{methodologyMerit.year}
                                    {' '}<span className={styles.meritFieldTag}>{selectedField}</span>
                                </h5>
                                <div className={styles.meritTable}>
                                    <div className={styles.meritTableHeader2}>
                                        <span>Program</span><span>Cutoff / Value</span>
                                    </div>
                                    {Object.entries(methodologyMerit.programs).map(([prog, val]) => (
                                        <div key={prog} className={styles.meritTableRow2}>
                                            <span className={styles.meritProgram}>{prog}</span>
                                            <span className={styles.meritCutoff}>{val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {admissionCriteria[selectedUniversity].tips && (
                            <div className={styles.tipSection}>
                                <span className={styles.tipIcon}></span>
                                <p>{admissionCriteria[selectedUniversity].tips}</p>
                            </div>
                        )}

                        <p className={styles.uniDescription}>{admissionCriteria[selectedUniversity].description}</p>

                        {/* Reverse Calculator */}
                        <div className={styles.reverseSection}>
                            <button className={styles.reverseToggle} onClick={() => setShowReverse(v => !v)}>
                                <span>{showReverse ? '▲' : '▼'}</span>
                                What entry test score do I need?
                            </button>

                            {showReverse && reverseCalcData && (
                                <div className={styles.reverseBody}>
                                    {reverseCalcData.unsupported ? (
                                        <p className={styles.reverseNote}>
                                            {reverseCalcData.meritType === 'position'
                                                ? 'This university uses merit positions — focus on maximising your test score.'
                                                : 'Holistic admissions — no single score determines admission.'}
                                        </p>
                                    ) : reverseCalcData.noTest ? (
                                        <p className={styles.reverseNote}>This university does not use a standardised entry test.</p>
                                    ) : (
                                        <>
                                            <p className={styles.reverseIntro}>
                                                With FSc <strong>{fscMarks}%</strong> and Matric <strong>{matricMarks}%</strong>, to reach each program cutoff at <strong>{selectedUniversity}</strong>:
                                            </p>
                                            <div className={styles.reverseTable}>
                                                {reverseCalcData.map(prog => {
                                                    const req = prog.requiredTestScore;
                                                    const isMet = req !== null && expectedTestScore >= req;
                                                    const isImpossible = req !== null && req > 100;
                                                    return (
                                                        <div key={prog.key} className={styles.reverseRow}>
                                                            <span className={styles.revProgLabel}>{prog.label}</span>
                                                            <span className={styles.revCutoff}>cutoff {prog.cutoff}%</span>
                                                            <span className={`${styles.revRequired} ${isImpossible ? styles.revImpossible : isMet ? styles.revMet : ''}`}>
                                                                {req === null ? 'N/A'
                                                                    : isImpossible ? 'Not reachable (boost FSc/Matric)'
                                                                    : `Need ${req}% test`}
                                                            </span>
                                                            {!isImpossible && req !== null && (
                                                                <span className={`${styles.revStatus} ${isMet ? styles.revStatusGreen : styles.revStatusOrange}`}>
                                                                    {isMet ? '✓ Already there' : `↑ ${(req - expectedTestScore).toFixed(1)}% more`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className={styles.methodologyGrid}>
                        <div className={styles.methodItem}><span className={styles.methodIcon}></span>
                            <div><strong>Entry Test (40–85%)</strong><p>NET, LCAT, ECAT, or university tests. Often the deciding factor.</p></div>
                        </div>
                        <div className={styles.methodItem}><span className={styles.methodIcon}></span>
                            <div><strong>FSc/A-Level (15–50%)</strong><p>Intermediate marks baseline. Most require 60–70% minimum.</p></div>
                        </div>
                        <div className={styles.methodItem}><span className={styles.methodIcon}></span>
                            <div><strong>Matric/O-Level (10–25%)</strong><p>SSC marks contribute to aggregate calculation.</p></div>
                        </div>
                        <div className={styles.methodItem}><span className={styles.methodIcon}></span>
                            <div><strong>Interview (0–30%)</strong><p>LUMS, PIEAS require interviews. Others are test-only.</p></div>
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

                {/* Aggregate-based — bucketed or flat */}
                {selectedUniversity === 'All' && bucketGroups ? (
                    <div className={styles.bucketedList}>
                        {[
                            { key: 'safety',     label: 'Safety',      icon: '✓', desc: '2%+ above cutoff' },
                            { key: 'match',      label: 'Match',       icon: '~', desc: 'Within 3% of cutoff' },
                            { key: 'reach',      label: 'Reach',       icon: '↑', desc: '3–10% below cutoff' },
                            { key: 'longshot',   label: 'Longshot',    icon: '!', desc: '10%+ below cutoff' },
                            { key: 'ineligible', label: 'Not Eligible', icon: '✕', desc: 'Below minimum FSc' },
                        ].filter(g => bucketGroups[g.key]?.length > 0).map(group => (
                            <div key={group.key} className={styles.bucketSection}>
                                <div className={`${styles.bucketHeader} ${styles[`bucket_${group.key}`]}`}>
                                    <span className={styles.bucketIcon}>{group.icon}</span>
                                    <span className={styles.bucketLabel}>{group.label}</span>
                                    <span className={styles.bucketDesc}>{group.desc}</span>
                                    <span className={styles.bucketCount}>{bucketGroups[group.key].length}</span>
                                </div>
                                <div className={styles.predictionsList}>
                                    {bucketGroups[group.key].map(uni => renderCard(uni))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.predictionsList}>
                        {aggregatePredictions.map(uni => renderCard(uni))}
                    </div>
                )}

                {/* Requirements-based unis (GIKI, IBA, LUMS) */}
                {requirementsPredictions.length > 0 && (
                    <div className={styles.requirementsSection}>
                        {selectedUniversity === 'All' && (
                            <div className={styles.requirementsSectionHeader}>
                                <span>No % Cutoff — Requirements Only</span>
                                <span className={styles.bucketCount}>{requirementsPredictions.length}</span>
                            </div>
                        )}
                        <div className={styles.predictionsList}>
                            {requirementsPredictions.map(uni => renderRequirementsCard(uni))}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.disclaimer}>
                <span></span>
                These predictions are estimates based on historical merit data. Actual admission depends on
                test performance, seat availability, and university policies. Always check official sources.
            </div>
        </section>
    );
}
