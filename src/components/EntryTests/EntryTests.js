'use client';

import { useState } from 'react';
import styles from './EntryTests.module.css';

const entryTests = [
    {
        id: "net",
        name: "NET (NUST Entry Test)",
        conductor: "NUST",
        icon: "🎯",
        period: "Jan – Jul (Series I, II, III)",
        description: "NUST's own entry test covering English, Maths, Physics, Chemistry & Intelligence. Required for all NUST engineering, computing, and business programs. 200 marks, 3 hours.",
        acceptedBy: ["NUST"],
        website: "https://ugadmissions.nust.edu.pk"
    },
    {
        id: "ecat",
        name: "ECAT",
        conductor: "UET System",
        icon: "⚙️",
        period: "July – August (annually)",
        description: "Engineering College Admission Test for all public engineering universities in Punjab. Covers Maths, Physics, Chemistry & English. 400 total marks, 2 hours.",
        acceptedBy: ["UET Lahore", "UET Taxila", "Other Punjab Engineering Unis"],
        website: "https://uet.edu.pk"
    },
    {
        id: "sat",
        name: "SAT",
        conductor: "College Board (USA)",
        icon: "🌍",
        period: "7 dates per year (Mar, May, Jun, Aug, Oct, Nov, Dec)",
        description: "International standardized test accepted by top Pakistani universities as an alternative to local entry tests. Digital format, 2h 14min. Covers Reading/Writing and Mathematics.",
        acceptedBy: ["LUMS", "IBA", "NUST (Business)", "Habib", "Bahria", "FAST"],
        website: "https://satsuite.collegeboard.org"
    },
    {
        id: "fast-test",
        name: "FAST NU Test",
        conductor: "FAST-NUCES",
        icon: "💻",
        period: "June – July (annually)",
        description: "FAST's admission test for CS, Software Engineering, AI, and Business programs across all campuses. MCQ + Subjective format, 100 marks, 2 hours. Covers English, Maths & Analytical.",
        acceptedBy: ["FAST Isb", "FAST Lhr", "FAST Khi", "FAST Psh", "FAST CFD"],
        website: "https://nu.edu.pk/Admissions"
    },
    {
        id: "nts-nat",
        name: "NTS NAT",
        conductor: "National Testing Service",
        icon: "📊",
        period: "Multiple times per year (check NTS schedule)",
        description: "National Aptitude Test used by COMSATS and other NTS-affiliated universities. 90 MCQs, 100 marks (percentile), 2 hours. No negative marking. Valid for 1 year.",
        acceptedBy: ["COMSATS (all campuses)", "Other NTS-affiliated unis"],
        website: "https://nts.org.pk"
    },
    {
        id: "giki-test",
        name: "GIKI Entry Test",
        conductor: "GIKI",
        icon: "🏔️",
        period: "July (annually)",
        description: "GIKI's own admission test for engineering and CS programs. MCQ + Subjective, 200 marks, 3 hours. Covers Maths, Physics, English & Intelligence. Test weight: 85%.",
        acceptedBy: ["GIKI"],
        website: "https://giki.edu.pk/admissions"
    },
    {
        id: "iba-test",
        name: "IBA Aptitude Test",
        conductor: "IBA Karachi",
        icon: "📈",
        period: "February & July (twice yearly)",
        description: "IBA's admission test for BBA, BS CS, Economics, and Accounting programs. MCQ-based covering English, Maths & Analytical Reasoning. 100 marks, 2.5 hours.",
        acceptedBy: ["IBA Karachi"],
        website: "https://iba.edu.pk/admissions"
    },
    {
        id: "lcat",
        name: "LCAT",
        conductor: "LUMS",
        icon: "🎓",
        period: "February – March (annually)",
        description: "LUMS Common Admission Test for Business, Law, and Social Sciences programs. MCQ + Analytical Writing, 100 marks, 2.5 hours. SBASSE requires SAT instead.",
        acceptedBy: ["LUMS"],
        website: "https://admissions.lums.edu.pk"
    },
    {
        id: "pieas-test",
        name: "PIEAS Written Test",
        conductor: "PIEAS",
        icon: "⚛️",
        period: "April (annually)",
        description: "PIEAS admission test for Nuclear, Mechanical, Electrical, CS, and Chemical Engineering. MCQ + Descriptive, 200 marks, 3 hours. Test weight: 85%.",
        acceptedBy: ["PIEAS"],
        website: "https://admissions.pieas.edu.pk"
    },
    {
        id: "ned-test",
        name: "NED Entry Test",
        conductor: "NED University",
        icon: "🔧",
        period: "July (annually)",
        description: "NED University's admission test for engineering programs in Karachi. MCQ-based covering Maths, Physics, Chemistry & English. 200 marks, 2 hours.",
        acceptedBy: ["NED University"],
        website: "https://www.neduet.edu.pk"
    },
    {
        id: "bahria-test",
        name: "BUET (Bahria Entry Test)",
        conductor: "Bahria University",
        icon: "⚓",
        period: "June – July (annually)",
        description: "Bahria University's admission test for CS, SE, Business, and Medical programs across all campuses. MCQ-based, 100 marks, 1.5 hours.",
        acceptedBy: ["Bahria Isb", "Bahria Lhr", "Bahria Khi"],
        website: "https://bahria.edu.pk"
    },
    {
        id: "air-test",
        name: "Air University Entry Test",
        conductor: "Air University",
        icon: "✈️",
        period: "June – July (annually)",
        description: "Air University's admission test for Aerospace, CS, SE, EE, and Business programs. MCQ-based, 100 marks, 1.5 hours. Air Force affiliated.",
        acceptedBy: ["Air University"],
        website: "https://au.edu.pk"
    }
];

export default function EntryTests() {
    const [showAll, setShowAll] = useState(false);
    const visibleTests = showAll ? entryTests : entryTests.slice(0, 6);

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <span className={styles.titleIcon}>📝</span>
                    Entry Tests Guide
                </h2>
                <p className={styles.subtitle}>
                    Which tests to give, when they happen, and where to apply
                </p>
            </div>

            <div className={styles.testsGrid}>
                {visibleTests.map(test => (
                    <div key={test.id} className={styles.testCard}>
                        <div className={styles.cardTop}>
                            <div className={styles.testIcon}>{test.icon}</div>
                            <div className={styles.testInfo}>
                                <div className={styles.testName}>{test.name}</div>
                                <div className={styles.testConductor}>by {test.conductor}</div>
                            </div>
                        </div>

                        <div className={styles.testPeriod}>
                            <span className={styles.periodIcon}>📅</span>
                            {test.period}
                        </div>

                        <p className={styles.testDescription}>{test.description}</p>

                        <div className={styles.acceptedBy}>
                            {test.acceptedBy.map((uni, i) => (
                                <span key={i} className={styles.uniTag}>{uni}</span>
                            ))}
                        </div>

                        <a
                            href={test.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.applyBtn}
                        >
                            Apply / Register ↗
                        </a>
                    </div>
                ))}
            </div>

            {!showAll && entryTests.length > 6 && (
                <div className={styles.viewMore}>
                    <button className={styles.viewMoreBtn} onClick={() => setShowAll(true)}>
                        Show {entryTests.length - 6} more tests
                    </button>
                </div>
            )}

            <div className={styles.disclaimer}>
                ⚠️ Test dates and registration windows may change — always verify on the official test portal.
            </div>
        </section>
    );
}
