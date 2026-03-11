'use client';

import { useState } from 'react';
import styles from './ConflictAlert.module.css';

export default function ConflictAlert({ conflicts = [] }) {
    const [dismissed, setDismissed] = useState(false);

    if (conflicts.length === 0 || dismissed) return null;

    return (
        <div className={styles.banner}>
            <div className={styles.bannerIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
            </div>
            <div className={styles.bannerContent}>
                <span className={styles.bannerTitle}>
                    {conflicts.length} test date {conflicts.length === 1 ? 'conflict' : 'conflicts'} detected
                </span>
                <span className={styles.bannerList}>
                    {conflicts.map((c, i) => {
                        const dateStr = new Date(c.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
                        return (
                            <span key={i} className={styles.bannerItem}>
                                {c.universities.join(' & ')} on {dateStr}
                            </span>
                        );
                    })}
                </span>
            </div>
            <button className={styles.dismissBtn} onClick={() => setDismissed(true)} title="Dismiss">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
    );
}
