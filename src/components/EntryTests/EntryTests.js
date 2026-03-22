'use client';

import { useState } from 'react';
import styles from './EntryTests.module.css';
import { entryTestsDisplay as entryTests } from '@/data/entryTestsData';

export default function EntryTests({ savedUniversities = [] }) {
    const [showAll, setShowAll] = useState(false);

    const savedNames = savedUniversities.map(u => u.shortName || u.name || '');

    const isRelevant = (test) => {
        if (savedNames.length === 0) return false;
        return test.acceptedBy.some(accepted => {
            const lower = accepted.toLowerCase();
            return savedNames.some(name => {
                const nameLower = name.toLowerCase();
                return lower.includes(nameLower) || nameLower.includes(lower) ||
                    lower.replace(/\s+/g, '').includes(nameLower.replace(/\s+/g, ''));
            });
        });
    };

    const sorted = [...entryTests].sort((a, b) => {
        const aRelevant = isRelevant(a) ? 1 : 0;
        const bRelevant = isRelevant(b) ? 1 : 0;
        return bRelevant - aRelevant;
    });

    const visibleTests = showAll ? sorted : sorted.slice(0, 6);

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
                {visibleTests.map(test => {
                    const relevant = isRelevant(test);
                    return (
                    <div key={test.id} className={`${styles.testCard} ${relevant ? styles.testCardRelevant : ''}`}>
                        <div className={styles.cardTop}>
                            <div className={styles.testIcon}>{test.icon}</div>
                            <div className={styles.testInfo}>
                                <div className={styles.testName}>
                                    {test.name}
                                    {relevant && <span className={styles.relevantBadge}>For your saved unis</span>}
                                </div>
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
                                <span key={i} className={`${styles.uniTag} ${savedNames.some(n => uni.toLowerCase().includes(n.toLowerCase())) ? styles.uniTagSaved : ''}`}>{uni}</span>
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
                    );
                })}
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
