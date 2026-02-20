'use client';

import { useState } from 'react';
import styles from './EntryTests.module.css';
import { entryTests, testCategories, getTestCategory } from '@/data/entryTestsData';

function getCutoffClass(value) {
    const num = parseInt(value);
    if (isNaN(num)) {
        // SAT scores
        const satNum = parseInt(value);
        if (satNum >= 1400) return styles.cutoffHigh;
        if (satNum >= 1200) return styles.cutoffMedium;
        return styles.cutoffLow;
    }
    if (num >= 80) return styles.cutoffHigh;
    if (num >= 70) return styles.cutoffMedium;
    return styles.cutoffLow;
}

export default function EntryTests() {
    const [activeFilter, setActiveFilter] = useState('all');
    const [expandedTests, setExpandedTests] = useState(new Set());
    const [showAll, setShowAll] = useState(false);

    const toggleExpand = (testId) => {
        setExpandedTests(prev => {
            const next = new Set(prev);
            if (next.has(testId)) next.delete(testId);
            else next.add(testId);
            return next;
        });
    };

    const filteredTests = entryTests.filter(test => {
        if (activeFilter === 'all') return true;
        return getTestCategory(test) === activeFilter;
    });

    const visibleTests = showAll ? filteredTests : filteredTests.slice(0, 6);

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <span className={styles.titleIcon}>📝</span>
                    Entry Tests & Cutoffs
                </h2>
                <p className={styles.subtitle}>
                    Find which tests you need and last year's cutoff percentages
                </p>
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
                {testCategories.map(cat => (
                    <button
                        key={cat.value}
                        className={`${styles.filterTab} ${activeFilter === cat.value ? styles.filterTabActive : ''}`}
                        onClick={() => { setActiveFilter(cat.value); setShowAll(false); }}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Test Cards */}
            <div className={styles.testsGrid}>
                {visibleTests.map(test => {
                    const isExpanded = expandedTests.has(test.id);
                    const totalUnis = test.universities.length;

                    return (
                        <div key={test.id} className={styles.testCard}>
                            {/* Collapsed Header */}
                            <div
                                className={styles.cardHeader}
                                onClick={() => toggleExpand(test.id)}
                                role="button"
                                tabIndex={0}
                                aria-expanded={isExpanded}
                                onKeyDown={(e) => e.key === 'Enter' && toggleExpand(test.id)}
                            >
                                <div className={styles.cardHeaderLeft}>
                                    <div className={styles.testIcon}>📋</div>
                                    <div className={styles.testInfo}>
                                        <div className={styles.testName}>{test.name}</div>
                                        <div className={styles.testConductor}>by {test.conductor}</div>
                                    </div>
                                </div>
                                <span className={styles.uniCount}>
                                    {totalUnis} {totalUnis === 1 ? 'uni' : 'unis'}
                                </span>
                                <span className={`${styles.expandIcon} ${isExpanded ? styles.expandIconOpen : ''}`}>
                                    ▼
                                </span>
                            </div>

                            {/* Expandable Body */}
                            <div className={`${styles.cardBody} ${isExpanded ? styles.cardBodyOpen : ''}`}>
                                <div className={styles.cardContent}>
                                    {/* Test Details */}
                                    <div className={styles.testDetails}>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Format</span>
                                            <span className={styles.detailValue}>{test.format}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Total Marks</span>
                                            <span className={styles.detailValue}>{test.totalMarks}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Duration</span>
                                            <span className={styles.detailValue}>{test.duration}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Frequency</span>
                                            <span className={styles.detailValue}>{test.frequency}</span>
                                        </div>
                                    </div>

                                    {/* Subjects */}
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Subjects</span>
                                        <div className={styles.subjects}>
                                            {test.subjects.map((subj, i) => (
                                                <span key={i} className={styles.subjectTag}>{subj}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Universities & Cutoffs */}
                                    <div className={styles.uniSection}>
                                        <h4 className={styles.uniSectionTitle}>
                                            <span className={styles.uniSectionIcon}>🏫</span>
                                            Universities & Cutoffs (2025)
                                        </h4>

                                        {test.universities.map((uni, idx) => (
                                            <div key={idx} className={styles.uniRow}>
                                                <div className={styles.uniHeader}>
                                                    <span className={styles.uniName}>{uni.name}</span>
                                                    <span className={styles.weightage}>{uni.weightage}</span>
                                                </div>
                                                <div className={styles.cutoffGrid}>
                                                    {Object.entries(uni.cutoffs).map(([program, cutoff]) => (
                                                        <div key={program} className={styles.cutoffItem}>
                                                            <span className={styles.cutoffProgram}>{program}</span>
                                                            <span className={`${styles.cutoffValue} ${getCutoffClass(cutoff)}`}>
                                                                {cutoff}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Apply Link */}
                                    <a
                                        href={test.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.applyLink}
                                    >
                                        Visit Official Site <span className={styles.applyIcon}>↗</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* View More */}
            {!showAll && filteredTests.length > 6 && (
                <div className={styles.viewMore}>
                    <button className={styles.viewMoreBtn} onClick={() => setShowAll(true)}>
                        Show {filteredTests.length - 6} more tests
                    </button>
                </div>
            )}

            {/* Disclaimer */}
            <div className={styles.disclaimer}>
                ⚠️ Cutoff percentages are based on 2025 closing merit data and may vary each year.
                Always verify on the official university portal before applying.
            </div>
        </section>
    );
}
