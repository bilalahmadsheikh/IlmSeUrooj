'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import TimelineGantt from '@/components/TimelineGantt/TimelineGantt';
import StrategyPanel from '@/components/StrategyPanel/StrategyPanel';
import ConflictAlert from '@/components/ConflictAlert/ConflictAlert';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { getBrowserClient } from '@/lib/supabase-browser';
import { universities as allUniversities, filterOptions } from '@/data/universities';
import {
    buildDeadlinesFromUniversities,
    mergeSupabaseDeadlines,
    detectRealConflicts,
    toSlug,
} from '@/data/deadlines';
import { computeMatchScore } from '@/data/meritFormulas';
import { loadSavedFromStorage } from '@/utils/savedStorage';
import { findUniversityByApplication } from '@/utils/universityHelpers';

export default function TimelinePage() {
    const [timeline, setTimeline] = useState([]);
    const [conflicts, setConflicts] = useState([]);
    const [strategy, setStrategy] = useState([]);
    const [loading, setLoading] = useState(true);
    const [field, setField] = useState('');
    const [savedOnly, setSavedOnly] = useState(false);
    const [useProjected, setUseProjected] = useState(true);
    const [savedSlugs, setSavedSlugs] = useState([]);
    const [activeTab, setActiveTab] = useState('gantt');
    const ganttRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const localRows = loadSavedFromStorage();
                const localIds = new Set(localRows.map(r => r.id));
                const localUnis = localRows
                    .map(r => allUniversities.find(u => u.id === r.id || u.id === parseInt(r.id, 10)))
                    .filter(Boolean);

                const supabase = getBrowserClient();
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token && !cancelled) {
                    try {
                        const res = await fetch('/api/applications', { credentials: 'include' });
                        if (res.ok) {
                            const { applications } = await res.json();
                            const savedFromApi = (applications || []).filter(a => a.status === 'saved');
                            for (const app of savedFromApi) {
                                const uni = findUniversityByApplication(app, allUniversities);
                                if (uni && !localIds.has(uni.id)) {
                                    localUnis.push(uni);
                                    localIds.add(uni.id);
                                }
                            }
                        }
                    } catch { /* API unavailable, use localStorage only */ }
                }

                if (!cancelled) {
                    const slugs = localUnis.map(u => toSlug(u.shortName));
                    setSavedSlugs(slugs);
                }
            } catch { /* empty */ }
        })();
        return () => { cancelled = true; };
    }, []);

    const fetchStrategy = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = getBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();

            const params = new URLSearchParams();
            if (field) params.set('field', field);
            if (savedOnly && savedSlugs.length > 0) params.set('savedOnly', savedSlugs.join(','));
            if (!useProjected) params.set('projected', 'false');

            const headers = {};
            if (session?.access_token) {
                headers.Authorization = `Bearer ${session.access_token}`;
            }

            const res = await fetch(`/api/timeline/strategy?${params}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setTimeline(data.timeline || []);
                setConflicts(data.conflicts || []);
                setStrategy(data.strategy || []);
                setLoading(false);
                return;
            }
            computeClientSide(supabase);
        } catch {
            computeClientSide(null);
        }
    }, [field, savedOnly, useProjected, savedSlugs]);

    async function computeClientSide(supabase) {
        let deadlinesMap = buildDeadlinesFromUniversities();
        try {
            const client = supabase || getBrowserClient();
            const { data: supabaseRows } = await client
                .from('university_deadlines')
                .select('*')
                .eq('is_active', true)
                .order('deadline_date', { ascending: true });
            if (supabaseRows && supabaseRows.length > 0) {
                deadlinesMap = mergeSupabaseDeadlines(deadlinesMap, supabaseRows);
            }
        } catch { /* fallback */ }

        const entries = [];
        for (const [slug, data] of Object.entries(deadlinesMap)) {
            if (savedOnly && savedSlugs.length > 0 && !savedSlugs.includes(slug)) continue;
            const { score, tier } = computeMatchScore(data.shortName, null, false, field || null, null);
            entries.push({ slug, name: data.name, shortName: data.shortName, events: data.events, matchScore: score, tier });
        }

        const conflictsFound = detectRealConflicts(entries);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const strat = entries.map((entry, i) => {
            const upcoming = entry.events.filter(e => new Date(e.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date));
            const next = upcoming[0];
            const daysRemaining = next ? Math.ceil((new Date(next.date) - today) / 86400000) : null;
            const dateStr = next ? new Date(next.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : '';
            const labels = {
                registration_open: `Registration opens ${dateStr}`,
                registration_close: `Register by ${dateStr}`,
                test_date: `${next?.label || 'Test'} on ${dateStr}`,
                entry_test: `${next?.label || 'Test'} on ${dateStr}`,
                merit_list: `${next?.label || 'Merit list'} on ${dateStr}`,
                fee_deadline: `Pay fee by ${dateStr}`,
                fee_submission: `Pay fee by ${dateStr}`,
            };
            return {
                order: i + 1, slug: entry.slug, university: entry.name, shortName: entry.shortName,
                matchScore: entry.matchScore, tier: entry.tier, reason: `Score: ${entry.matchScore}%`,
                nextAction: next ? (labels[next.type] || `${next.label || next.type} on ${dateStr}`) : 'All deadlines passed',
                daysRemaining,
            };
        });
        strat.sort((a, b) => {
            const uA = a.daysRemaining != null ? 1 / (a.daysRemaining + 1) : 0;
            const uB = b.daysRemaining != null ? 1 / (b.daysRemaining + 1) : 0;
            return (uB * 40 + b.matchScore * 0.6) - (uA * 40 + a.matchScore * 0.6);
        });
        strat.forEach((s, i) => { s.order = i + 1; });
        entries.sort((a, b) => b.matchScore - a.matchScore);
        setTimeline(entries);
        setConflicts(conflictsFound);
        setStrategy(strat);
        setLoading(false);
    }

    useEffect(() => { fetchStrategy(); }, [fetchStrategy]);

    const stats = useMemo(() => {
        if (!timeline.length) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let upcoming = 0;
        let urgent = 0;
        for (const entry of timeline) {
            for (const ev of entry.events) {
                const d = new Date(ev.date);
                if (d >= today) {
                    upcoming++;
                    const diff = Math.ceil((d - today) / 86400000);
                    if (diff <= 14) urgent++;
                }
            }
        }
        return {
            universities: timeline.length,
            upcoming,
            urgent,
            conflicts: conflicts.length,
        };
    }, [timeline, conflicts]);

    return (
        <div className={styles.page}>
            <div className={styles.bgMesh} />

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <div className={styles.headerLeft}>
                        <Link href="/" className={styles.logoLink}>
                            <span className={styles.logoIcon}>&#x1F393;</span>
                            <span className={styles.logoText}>Ilm Se Urooj</span>
                        </Link>
                        <div className={styles.headerDivider} />
                        <h1 className={styles.pageTitle}>Application Timeline</h1>
                    </div>
                    <div className={styles.headerRight}>
                        <ThemeToggle />
                        <Link href="/profile" className={styles.headerNavLink}>Profile</Link>
                        <Link href="/applications" className={styles.headerNavLink}>Applications</Link>
                        <Link href="/" className={styles.headerNavBtn}>
                            <span>Explore</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Stats bar */}
            {!loading && stats && (
                <div className={styles.statsBar}>
                    <div className={styles.statsInner}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats.universities}</span>
                            <span className={styles.statLabel}>Universities</span>
                        </div>
                        <div className={styles.statDot} />
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats.upcoming}</span>
                            <span className={styles.statLabel}>Upcoming Events</span>
                        </div>
                        <div className={styles.statDot} />
                        <div className={`${styles.statItem} ${stats.urgent > 0 ? styles.statUrgent : ''}`}>
                            <span className={styles.statValue}>{stats.urgent}</span>
                            <span className={styles.statLabel}>Within 2 Weeks</span>
                        </div>
                        {stats.conflicts > 0 && (
                            <>
                                <div className={styles.statDot} />
                                <div className={`${styles.statItem} ${styles.statConflict}`}>
                                    <span className={styles.statValue}>{stats.conflicts}</span>
                                    <span className={styles.statLabel}>Conflicts</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarInner}>
                    <div className={styles.toolbarLeft}>
                        <div className={styles.tabGroup}>
                            <button className={`${styles.tab} ${activeTab === 'gantt' ? styles.tabActive : ''}`} onClick={() => setActiveTab('gantt')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="12" width="12" height="4" rx="1"/><rect x="3" y="20" width="15" height="4" rx="1"/></svg>
                                Timeline
                            </button>
                            <button className={`${styles.tab} ${activeTab === 'strategy' ? styles.tabActive : ''}`} onClick={() => setActiveTab('strategy')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                Strategy
                            </button>
                        </div>

                        <div className={styles.filterGroup}>
                            <select className={styles.filterSelect} value={field} onChange={e => setField(e.target.value)}>
                                <option value="">All Fields</option>
                                {filterOptions.fields.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>

                            <label className={styles.checkLabel}>
                                <input type="checkbox" checked={savedOnly} onChange={e => setSavedOnly(e.target.checked)} />
                                <span className={styles.checkBox}>
                                    {savedOnly && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                </span>
                                Saved only
                            </label>
                        </div>
                    </div>

                    <div className={styles.toolbarRight}>
                        <button className={styles.refreshBtn} onClick={fetchStrategy} title="Refresh data">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className={styles.main}>
                <div className={styles.mainInner}>
                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner} />
                            <p className={styles.loadingText}>Loading timeline data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Conflicts banner */}
                            {conflicts.length > 0 && (
                                <ConflictAlert conflicts={conflicts} />
                            )}

                            {/* Tab content */}
                            {activeTab === 'gantt' ? (
                                <div className={styles.ganttSection} ref={ganttRef}>
                                    <TimelineGantt timeline={timeline} conflicts={conflicts} />
                                </div>
                            ) : (
                                <StrategyPanel
                                    strategy={strategy}
                                    conflicts={conflicts}
                                    useProjected={useProjected}
                                    onToggleProjected={setUseProjected}
                                />
                            )}

                            {/* No-conflicts message at bottom if on gantt tab */}
                            {activeTab === 'gantt' && conflicts.length === 0 && (
                                <div className={styles.noConflictsBanner}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                    No test date conflicts detected
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
