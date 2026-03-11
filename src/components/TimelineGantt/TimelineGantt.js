'use client';

import { useState, useMemo } from 'react';
import styles from './TimelineGantt.module.css';
import { EVENT_COLORS, EVENT_LABELS } from '@/data/deadlines';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TIER = { safe: 'Safe', match: 'Match', reach: 'Reach', unknown: '—' };

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shortDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
}

function computeDateRange(timeline) {
    let earliest = Infinity, latest = -Infinity;
    for (const entry of timeline) {
        for (const ev of entry.events) {
            const t = new Date(ev.date).getTime();
            if (t < earliest) earliest = t;
            if (t > latest) latest = t;
        }
    }
    if (!isFinite(earliest)) {
        const now = new Date();
        earliest = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        latest = new Date(now.getFullYear(), now.getMonth() + 10, 28).getTime();
    }
    const s = new Date(earliest); s.setDate(1);
    const e = new Date(latest); e.setMonth(e.getMonth() + 2); e.setDate(0);
    return { start: s, end: e };
}

export default function TimelineGantt({ timeline = [], conflicts = [] }) {
    const [hovered, setHovered] = useState(null);

    const { rangeStart, rangeMs, months, todayPct, conflictDates } = useMemo(() => {
        const { start, end } = computeDateRange(timeline);
        const ms = end.getTime() - start.getTime();
        const months = [];
        const cur = new Date(start.getFullYear(), start.getMonth(), 1);
        while (cur <= end) {
            months.push({ label: MONTH_NAMES[cur.getMonth()], year: cur.getFullYear(), month: cur.getMonth() });
            cur.setMonth(cur.getMonth() + 1);
        }
        const now = new Date();
        let tPct = null;
        if (now >= start && now <= end) tPct = ((now.getTime() - start.getTime()) / ms) * 100;
        return { rangeStart: start, rangeMs: ms, months, todayPct: tPct, conflictDates: new Set(conflicts.map(c => c.date)) };
    }, [timeline, conflicts]);

    const pct = (dateStr) => {
        const off = new Date(dateStr).getTime() - rangeStart.getTime();
        return Math.max(0, Math.min(100, (off / rangeMs) * 100));
    };

    if (!timeline.length) {
        return (
            <div className={styles.empty}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p>No timeline data. Adjust filters or save some universities.</p>
            </div>
        );
    }

    return (
        <div className={styles.wrap}>
            {/* Month ruler */}
            <div className={styles.ruler}>
                <div className={styles.rulerLabel}>University</div>
                <div className={styles.rulerTrack}>
                    {months.map((m, i) => {
                        const left = pct(`${m.year}-${String(m.month + 1).padStart(2, '0')}-01`);
                        const next = i + 1 < months.length ? months[i + 1] : null;
                        const right = next ? pct(`${next.year}-${String(next.month + 1).padStart(2, '0')}-01`) : 100;
                        const isCur = m.month === new Date().getMonth() && m.year === new Date().getFullYear();
                        return (
                            <div key={`${m.label}${m.year}`} className={`${styles.rulerMonth} ${isCur ? styles.rulerCurrent : ''}`}
                                style={{ left: `${left}%`, width: `${right - left}%` }}>
                                {m.label} {(m.month === 0 || i === 0) ? `'${String(m.year).slice(2)}` : ''}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Rows */}
            <div className={styles.rows}>
                {todayPct != null && (
                    <div className={styles.todayLine} style={{ left: `calc(140px + (100% - 140px) * ${todayPct / 100})` }}>
                        <span className={styles.todayLabel}>Today</span>
                    </div>
                )}

                {timeline.map(entry => {
                    const tierCls = styles[`t${entry.tier}`] || styles.tunknown;
                    return (
                        <div key={entry.slug} className={styles.row}>
                            <div className={styles.rowName}>
                                <span className={styles.name} title={entry.name}>{entry.shortName}</span>
                                <span className={`${styles.tier} ${tierCls}`}>{TIER[entry.tier]}</span>
                            </div>
                            <div className={styles.track}>
                                {entry.events.map((ev, i) => {
                                    const left = pct(ev.date);
                                    const normType = ev.type === 'entry_test' ? 'test_date'
                                        : ev.type === 'fee_submission' ? 'fee_deadline'
                                        : ev.type === 'application' ? 'registration_close'
                                        : ev.type;
                                    const color = (EVENT_COLORS[normType] || EVENT_COLORS.result_date).border;
                                    const isTest = ev.type === 'test_date' || ev.type === 'entry_test';
                                    const isConflict = isTest && conflictDates.has(ev.date);
                                    const evId = `${entry.slug}-${i}`;
                                    const isHovered = hovered === evId;

                                    return (
                                        <div key={i} className={styles.evWrap} style={{ left: `${left}%` }}
                                            onMouseEnter={() => setHovered(evId)}
                                            onMouseLeave={() => setHovered(null)}>
                                            <div className={`${styles.evDot} ${isConflict ? styles.evConflict : ''}`}
                                                style={{ background: color, boxShadow: isHovered ? `0 0 0 3px ${color}40` : 'none' }} />
                                            {isHovered && (
                                                <div className={styles.tip}>
                                                    <span style={{ color }}>{ev.label || EVENT_LABELS[normType] || normType}</span>
                                                    <span className={styles.tipDate}>{formatDate(ev.date)}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Inline event labels for key dates */}
                                {entry.events.length > 0 && (
                                    <div className={styles.inlineLabels}>
                                        {entry.events.map((ev, i) => {
                                            const left = pct(ev.date);
                                            if (left < 2 || left > 95) return null;
                                            return (
                                                <span key={i} className={styles.inlineLabel} style={{ left: `${left}%` }}>
                                                    {shortDate(ev.date)}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className={styles.legend}>
                {[
                    { color: '#3B82F6', label: 'Apply By' },
                    { color: '#F59E0B', label: 'Entry Test' },
                    { color: '#A855F7', label: 'Merit List' },
                    { color: '#EF4444', label: 'Fee Deadline' },
                ].map(l => (
                    <div key={l.label} className={styles.legendItem}>
                        <div className={styles.legendDot} style={{ background: l.color }} />
                        <span>{l.label}</span>
                    </div>
                ))}
                <div className={styles.legendItem}>
                    <div className={styles.legendLine} />
                    <span>Today</span>
                </div>
            </div>
        </div>
    );
}
