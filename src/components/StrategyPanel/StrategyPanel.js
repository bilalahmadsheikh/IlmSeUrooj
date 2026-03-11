'use client';

import { useMemo } from 'react';
import styles from './StrategyPanel.module.css';

const TIER_CONFIG = {
    safe: { label: 'Safe', color: '#22C55E' },
    match: { label: 'Match', color: '#F59E0B' },
    reach: { label: 'Reach', color: '#EF4444' },
    unknown: { label: '—', color: '#6B7280' },
};

function groupByUrgency(items) {
    const urgent = [];
    const upcoming = [];
    const later = [];
    const passed = [];

    for (const item of items) {
        if (item.daysRemaining == null) passed.push(item);
        else if (item.daysRemaining <= 14) urgent.push(item);
        else if (item.daysRemaining <= 60) upcoming.push(item);
        else later.push(item);
    }

    return [
        { key: 'urgent', title: 'Act Now', subtitle: 'Within 2 weeks', items: urgent, color: '#EF4444' },
        { key: 'upcoming', title: 'Coming Up', subtitle: 'Within 2 months', items: upcoming, color: '#F59E0B' },
        { key: 'later', title: 'Plan Ahead', subtitle: '2+ months away', items: later, color: '#22C55E' },
        { key: 'passed', title: 'Past Deadlines', subtitle: 'Already closed', items: passed, color: '#6B7280' },
    ].filter(g => g.items.length > 0);
}

export default function StrategyPanel({ strategy = [], conflicts = [], useProjected, onToggleProjected }) {
    const conflictUnis = useMemo(() => {
        const set = new Set();
        for (const c of conflicts) {
            for (const uni of c.universities) set.add(uni);
        }
        return set;
    }, [conflicts]);

    const groups = useMemo(() => groupByUrgency(strategy), [strategy]);

    return (
        <div className={styles.panel}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>Application Priority</h2>
                    <span className={styles.badge}>{strategy.length} universities</span>
                </div>
                {onToggleProjected && (
                    <div className={styles.toggle}>
                        <button className={`${styles.toggleBtn} ${useProjected ? styles.toggleActive : ''}`}
                            onClick={() => onToggleProjected(true)}>Projected</button>
                        <button className={`${styles.toggleBtn} ${!useProjected ? styles.toggleActive : ''}`}
                            onClick={() => onToggleProjected(false)}>Actual</button>
                    </div>
                )}
            </div>

            {/* Grouped list */}
            <div className={styles.body}>
                {strategy.length === 0 && (
                    <div className={styles.empty}>
                        <p>No data available.</p>
                        <p className={styles.emptyHint}>Complete your profile for personalized strategy.</p>
                    </div>
                )}

                {groups.map(group => (
                    <div key={group.key} className={styles.group}>
                        <div className={styles.groupHeader}>
                            <div className={styles.groupDot} style={{ background: group.color }} />
                            <span className={styles.groupTitle}>{group.title}</span>
                            <span className={styles.groupSubtitle}>{group.subtitle}</span>
                            <span className={styles.groupCount}>{group.items.length}</span>
                        </div>

                        <div className={styles.groupItems}>
                            {group.items.map((item) => {
                                const tier = TIER_CONFIG[item.tier] || TIER_CONFIG.unknown;
                                const hasConflict = conflictUnis.has(item.shortName);

                                return (
                                    <div key={item.slug} className={styles.card}>
                                        <div className={styles.cardLeft}>
                                            <div className={styles.cardRank} style={{ color: tier.color }}>
                                                #{item.order}
                                            </div>
                                            <div className={styles.cardInfo}>
                                                <div className={styles.cardName}>
                                                    {item.shortName}
                                                    <span className={styles.cardTier} style={{ color: tier.color, background: `${tier.color}15` }}>
                                                        {tier.label}
                                                    </span>
                                                    {hasConflict && (
                                                        <span className={styles.cardConflict} title="Test date conflict">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={styles.cardAction}>{item.nextAction}</div>
                                            </div>
                                        </div>
                                        <div className={styles.cardRight}>
                                            {/* Score bar */}
                                            <div className={styles.scoreBar}>
                                                <div className={styles.scoreBarFill} style={{ width: `${item.matchScore}%`, background: tier.color }} />
                                            </div>
                                            <span className={styles.scoreLabel} style={{ color: tier.color }}>{item.matchScore}%</span>

                                            {/* Days */}
                                            {item.daysRemaining != null ? (
                                                <span className={`${styles.daysBadge} ${
                                                    item.daysRemaining <= 7 ? styles.daysRed
                                                    : item.daysRemaining <= 30 ? styles.daysAmber
                                                    : styles.daysGreen
                                                }`}>
                                                    {item.daysRemaining}d
                                                </span>
                                            ) : (
                                                <span className={`${styles.daysBadge} ${styles.daysMuted}`}>—</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
