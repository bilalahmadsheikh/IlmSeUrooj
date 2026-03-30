'use client';

import { useState, useEffect } from 'react';
import styles from './AdmissionsDeadlines.module.css';
import { upcomingDeadlines } from '@/data/universities';

// Responsive visibility limits
const DESKTOP_LIMITS = [6, 15];
const MOBILE_LIMITS = [3, 10];
const MOBILE_BREAKPOINT = 768;

export default function AdmissionsDeadlines({ currentField, savedIds = [] }) {
    const [filter, setFilter] = useState('all');
    const [showElapsed, setShowElapsed] = useState(false);
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [now, setNow] = useState(new Date());
    const [isMobile, setIsMobile] = useState(false);
    const savedIdSet = new Set(savedIds);

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < MOBILE_BREAKPOINT;
            setIsMobile(mobile);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Update time every minute for countdown
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Calculate days remaining
    const getDaysRemaining = (deadline) => {
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Filter deadlines by field, saved-only, and upcoming/elapsed
    const filteredDeadlines = upcomingDeadlines.filter(d => {
        if (filter !== 'all' && d.field !== filter) return false;
        if (showSavedOnly && savedIdSet.size > 0 && !savedIdSet.has(d.id)) return false;

        const daysLeft = getDaysRemaining(d.deadline);
        if (showElapsed) {
            return daysLeft < 0;
        } else {
            return daysLeft >= 0;
        }
    }).sort((a, b) => {
        // Sort by closest deadline first (upcoming) or most recent first (elapsed)
        const dateA = new Date(a.deadline);
        const dateB = new Date(b.deadline);
        return showElapsed ? dateB - dateA : dateA - dateB;
    });

    // Get urgency class
    const getUrgencyClass = (days) => {
        if (days <= 3) return styles.urgent;
        if (days <= 7) return styles.soon;
        if (days <= 14) return styles.upcoming;
        return '';
    };

    // Check if deadline data is stale (not verified in >25 days — scraper runs every 20 days)
    const isStale = (deadline) => {
        if (!deadline.lastVerified) return true; // No timestamp = assume stale
        const verified = new Date(deadline.lastVerified);
        const daysSinceVerify = Math.floor((now - verified) / (1000 * 60 * 60 * 24));
        return daysSinceVerify > 25;
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

    // Visible deadlines (cap at initial limit — rest lives on Timeline)
    const visibleDeadlines = filteredDeadlines.slice(0, isMobile ? MOBILE_LIMITS[0] : DESKTOP_LIMITS[0]);
    const urgentCount = filteredDeadlines.filter(d => getDaysRemaining(d.deadline) >= 0 && getDaysRemaining(d.deadline) <= 7).length;

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <span className={styles.titleIcon}></span>
                    {showElapsed ? 'Elapsed Deadlines' : 'Upcoming Admission Deadlines'}
                </h2>
                <p className={styles.subtitle}>
                    {showElapsed
                        ? 'Past deadlines for reference. Applications are closed.'
                        : `Don't miss your chance! Real ${new Date().getFullYear()} deadlines from official sources.`
                    }
                </p>
            </div>

            {/* Toggle and Filter Tabs */}
            <div className={styles.filters}>
                {/* Upcoming/Elapsed Toggle */}
                <div className={styles.toggleWrapper}>
                    <button
                        className={`${styles.toggleBtn} ${!showElapsed ? styles.active : ''}`}
                        onClick={() => setShowElapsed(false)}
                    >
                        Upcoming
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${showElapsed ? styles.active : ''}`}
                        onClick={() => setShowElapsed(true)}
                    >
                        Elapsed
                    </button>
                </div>

                {/* Saved filter */}
                {savedIds.length > 0 && (
                    <button
                        className={`${styles.filterBtn} ${showSavedOnly ? styles.savedActive : ''}`}
                        onClick={() => setShowSavedOnly(!showSavedOnly)}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={showSavedOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        {' '}Saved ({savedIds.length})
                    </button>
                )}

                {/* Field Filters */}
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
                {visibleDeadlines.map((deadline) => {
                    const daysLeft = getDaysRemaining(deadline.deadline);
                    const isPast = daysLeft < 0;

                    return (
                        <div
                            key={deadline.id}
                            className={`${styles.card} ${getUrgencyClass(daysLeft)} ${isPast ? styles.past : ''} ${savedIdSet.has(deadline.id) ? styles.cardSaved : ''}`}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.uniLogo}>
                                    <span>{deadline.shortName.charAt(0)}</span>
                                </div>
                                <div className={styles.uniInfo}>
                                    <h3 className={styles.uniName}>
                                        {deadline.shortName}
                                        {savedIdSet.has(deadline.id) && (
                                            <svg className={styles.savedIcon} width="14" height="14" viewBox="0 0 24 24" fill="#10B981" stroke="#10B981" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                                        )}
                                    </h3>
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
                                    <span className={styles.dateLabel}>Apply by:</span>
                                    <span className={styles.dateValue}>{formatDate(deadline.deadline)}</span>
                                </div>
                                {deadline.testDate && (
                                    <div className={styles.dateRow}>
                                        <span className={styles.dateLabel}>{deadline.testName}:</span>
                                        <span className={styles.dateValue}>{formatDate(deadline.testDate)}</span>
                                    </div>
                                )}
                                <div className={styles.session}>
                                    <span className={styles.sessionBadge}>{deadline.session}</span>
                                    <span className={styles.fieldBadge}>{deadline.field}</span>
                                    {isStale(deadline) && (
                                        <span className={styles.staleBadge} title="This deadline has not been verified recently. Please confirm on the official website.">
                                            ! Not recently verified
                                        </span>
                                    )}
                                </div>
                            </div>

                            <a
                                href={deadline.applyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.applyBtn} ${isPast ? styles.disabled : ''}`}
                            >
                                {isPast ? 'Applications Closed' : 'Apply Now'}
                            </a>
                        </div>
                    );
                })}
            </div>

            {filteredDeadlines.length === 0 && (
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}></span>
                    <p>No upcoming deadlines for this field.</p>
                </div>
            )}

            {/* Timeline CTA */}
            {!showElapsed && filteredDeadlines.length > 0 && (
                <div className={styles.timelineCta}>
                    <div className={styles.timelineCtaLeft}>
                        <p className={styles.timelineCtaLabel}>
                            {filteredDeadlines.length} upcoming{urgentCount > 0 && <span className={styles.timelineCtaUrgentPill}>{urgentCount} urgent</span>}
                        </p>
                        <h3 className={styles.timelineCtaTitle}>See all deadlines on the Timeline</h3>
                        <p className={styles.timelineCtaSub}>Visual Gantt · Conflict detection · Strategy planner</p>
                    </div>
                    <a href="/timeline" className={styles.timelineCtaBtn}>
                        Open Timeline
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </a>
                </div>
            )}
        </section>
    );
}
