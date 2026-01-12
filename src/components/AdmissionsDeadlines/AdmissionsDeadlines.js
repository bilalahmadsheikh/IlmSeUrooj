'use client';

import { useState, useEffect } from 'react';
import styles from './AdmissionsDeadlines.module.css';
import { upcomingDeadlines } from '@/data/universities';

export default function AdmissionsDeadlines({ currentField }) {
    const [filter, setFilter] = useState('all');
    const [now, setNow] = useState(new Date());

    // Update time every minute for countdown
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Filter deadlines
    const filteredDeadlines = upcomingDeadlines.filter(d => {
        if (filter === 'all') return true;
        return d.field === filter;
    });

    // Calculate days remaining
    const getDaysRemaining = (deadline) => {
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Get urgency class
    const getUrgencyClass = (days) => {
        if (days <= 3) return styles.urgent;
        if (days <= 7) return styles.soon;
        if (days <= 14) return styles.upcoming;
        return '';
    };

    // Format date
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-PK', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <span className={styles.titleIcon}>📅</span>
                    Upcoming Admission Deadlines
                </h2>
                <p className={styles.subtitle}>
                    Don't miss your chance! Real 2026 deadlines from official sources.
                </p>
            </div>

            {/* Filter Tabs */}
            <div className={styles.filters}>
                <button
                    className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Fields
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'Pre-Engineering' ? styles.active : ''}`}
                    onClick={() => setFilter('Pre-Engineering')}
                >
                    Engineering
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'Business' ? styles.active : ''}`}
                    onClick={() => setFilter('Business')}
                >
                    Business
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'Computer Science' ? styles.active : ''}`}
                    onClick={() => setFilter('Computer Science')}
                >
                    CS
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'Medical' ? styles.active : ''}`}
                    onClick={() => setFilter('Medical')}
                >
                    Medical
                </button>
            </div>

            {/* Deadline Cards */}
            <div className={styles.grid}>
                {filteredDeadlines.map((deadline) => {
                    const daysLeft = getDaysRemaining(deadline.deadline);
                    const isPast = daysLeft < 0;

                    return (
                        <div
                            key={deadline.id}
                            className={`${styles.card} ${getUrgencyClass(daysLeft)} ${isPast ? styles.past : ''}`}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.uniLogo}>
                                    <span>{deadline.shortName.charAt(0)}</span>
                                </div>
                                <div className={styles.uniInfo}>
                                    <h3 className={styles.uniName}>{deadline.shortName}</h3>
                                    <p className={styles.program}>{deadline.program}</p>
                                </div>
                                <div className={styles.countdown}>
                                    {isPast ? (
                                        <span className={styles.expired}>Closed</span>
                                    ) : (
                                        <>
                                            <span className={styles.daysNumber}>{daysLeft}</span>
                                            <span className={styles.daysLabel}>days left</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.dateRow}>
                                    <span className={styles.dateLabel}>📝 Apply by:</span>
                                    <span className={styles.dateValue}>{formatDate(deadline.deadline)}</span>
                                </div>
                                {deadline.testDate && (
                                    <div className={styles.dateRow}>
                                        <span className={styles.dateLabel}>📝 {deadline.testName}:</span>
                                        <span className={styles.dateValue}>{formatDate(deadline.testDate)}</span>
                                    </div>
                                )}
                                <div className={styles.session}>
                                    <span className={styles.sessionBadge}>{deadline.session}</span>
                                    <span className={styles.fieldBadge}>{deadline.field}</span>
                                </div>
                            </div>

                            <a
                                href={deadline.applyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.applyBtn} ${isPast ? styles.disabled : ''}`}
                            >
                                {isPast ? 'Applications Closed' : 'Apply Now →'}
                            </a>
                        </div>
                    );
                })}
            </div>

            {filteredDeadlines.length === 0 && (
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>📭</span>
                    <p>No upcoming deadlines for this field.</p>
                </div>
            )}

            <div className={styles.disclaimer}>
                <span className={styles.disclaimerIcon}>ℹ️</span>
                Deadlines sourced from official university websites. Always verify on the official portal.
            </div>
        </section>
    );
}
