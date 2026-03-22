'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { universities as uniData } from '@/data/universities';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(shortName) {
  return shortName.toLowerCase().replace(/[()&]/g, '').replace(/\s+/g, '-');
}

function getUniData(slug) {
  return uniData.find(u => toSlug(u.shortName) === slug) || null;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
}

function fmtDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(dateStr);
}

function getProgress(app) {
  const pct = app.remembered_answers?.fill_pct;
  if (pct != null) return Math.round(pct);
  const map = {
    saved: 0, pending: 0,
    account_created: 20,
    form_filling: 55,
    awaiting_review: 80,
    submitted: 100,
    accepted: 100, rejected: 100, waitlisted: 100,
  };
  return map[app.status] ?? 0;
}

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS = {
  saved:           { label: 'Saved',          color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: '🔖', step: 0 },
  pending:         { label: 'Pending',         color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: '⏳', step: 0 },
  account_created: { label: 'Account Created', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: '✅', step: 1 },
  form_filling:    { label: 'Filling Form',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  icon: '✏️', step: 1 },
  awaiting_review: { label: 'In Review',       color: '#c084fc', bg: 'rgba(192,132,252,0.12)', icon: '👁', step: 1 },
  submitted:       { label: 'Submitted',       color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  icon: '📤', step: 2 },
  accepted:        { label: 'Accepted',        color: '#4ade80', bg: 'rgba(74,222,128,0.18)',  icon: '🎉', step: 3 },
  rejected:        { label: 'Rejected',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: '❌', step: 3 },
  waitlisted:      { label: 'Waitlisted',      color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  icon: '🕐', step: 3 },
};

const STATUS_OPTIONS = [
  { value: 'saved',           label: 'Saved' },
  { value: 'account_created', label: 'Account Created' },
  { value: 'form_filling',    label: 'Filling Form' },
  { value: 'awaiting_review', label: 'In Review' },
  { value: 'submitted',       label: 'Submitted' },
  { value: 'accepted',        label: 'Accepted' },
  { value: 'rejected',        label: 'Rejected' },
  { value: 'waitlisted',      label: 'Waitlisted' },
];

const TAG_COLORS = {
  dream:  { color: '#f9a8d4', bg: 'rgba(249,168,212,0.1)' },
  target: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  safety: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
};

const FILTERS = ['All', 'Applying', 'Submitted', 'Decisions'];
const FILTER_STATUSES = {
  All:       null,
  Applying:  ['saved', 'pending', 'account_created', 'form_filling', 'awaiting_review'],
  Submitted: ['submitted'],
  Decisions: ['accepted', 'rejected', 'waitlisted'],
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [apps, setApps]           = useState([]);
  const [selected, setSelected]   = useState(null);
  const [filter, setFilter]       = useState('All');
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState('deadline');

  // Detail panel state
  const [editNotes, setEditNotes] = useState('');
  const [editConfirm, setEditConfirm] = useState('');
  const [editStatus, setEditStatus]   = useState('');
  const [saving, setSaving]           = useState(false);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setUser(data.session.user);
        loadApps(data.session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel('apps_rt')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'applications',
        filter: `student_id=eq.${user.id}`,
      }, (payload) => {
        setApps(prev => {
          if (payload.eventType === 'DELETE') return prev.filter(a => a.id !== payload.old.id);
          const idx = prev.findIndex(a => a.id === payload.new?.id);
          if (idx === -1 && payload.new) return [...prev, payload.new];
          return prev.map(a => a.id === payload.new?.id ? { ...a, ...payload.new } : a);
        });
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user]);

  async function loadApps(uid) {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('student_id', uid)
      .order('updated_at', { ascending: false });
    setApps(data || []);
    setLoading(false);
  }

  // ── Enrich apps with uni data ──
  const enriched = useMemo(() => apps.map(app => {
    const uni = getUniData(app.university_slug);
    const deadline = uni?.admissions?.deadline || null;
    const testDate = uni?.admissions?.testDate || null;
    const applyUrl = uni?.admissions?.applyUrl || (app.portal_domain ? `https://${app.portal_domain}` : null);
    const days = daysUntil(deadline);
    return { ...app, _uni: uni, _deadline: deadline, _testDate: testDate, _applyUrl: applyUrl, _daysLeft: days };
  }), [apps]);

  // ── Stats ──
  const stats = useMemo(() => {
    const total     = enriched.length;
    const upcoming  = enriched.filter(a => a._daysLeft != null && a._daysLeft >= 0 && a._daysLeft <= 14).length;
    const inProg    = enriched.filter(a => ['account_created','form_filling','awaiting_review'].includes(a.status)).length;
    const submitted = enriched.filter(a => a.status === 'submitted').length;
    const decisions = enriched.filter(a => ['accepted','rejected','waitlisted'].includes(a.status)).length;
    const accepted  = enriched.filter(a => a.status === 'accepted').length;
    return { total, upcoming, inProg, submitted, decisions, accepted };
  }, [enriched]);

  // ── Filtered + sorted list ──
  const visible = useMemo(() => {
    let list = enriched;
    const statuses = FILTER_STATUSES[filter];
    if (statuses) list = list.filter(a => statuses.includes(a.status));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.university_name?.toLowerCase().includes(q) ||
        a.program_applied?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'deadline') {
        const da = a._daysLeft ?? Infinity;
        const db = b._daysLeft ?? Infinity;
        const pastA = da < 0 ? 1 : 0;
        const pastB = db < 0 ? 1 : 0;
        if (pastA !== pastB) return pastA - pastB;
        return Math.abs(da) - Math.abs(db);
      }
      if (sortBy === 'status') return (STATUS[a.status]?.step ?? 0) - (STATUS[b.status]?.step ?? 0);
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
  }, [enriched, filter, search, sortBy]);

  // ── Open detail ──
  function openDetail(app) {
    setSelected(app);
    setEditNotes(app.notes || '');
    setEditConfirm(app.confirmation_number || '');
    setEditStatus(app.status || 'saved');
  }

  // ── Save detail ──
  async function saveDetail() {
    if (!selected) return;
    setSaving(true);
    const updates = {
      notes: editNotes,
      confirmation_number: editConfirm,
      status: editStatus,
      updated_at: new Date().toISOString(),
      ...(editStatus === 'submitted' && !selected.submitted_at ? { submitted_at: new Date().toISOString() } : {}),
    };
    const { error } = await supabase.from('applications').update(updates).eq('id', selected.id);
    if (!error) {
      setApps(prev => prev.map(a => a.id === selected.id ? { ...a, ...updates } : a));
      setSelected(prev => ({ ...prev, ...updates }));
    }
    setSaving(false);
  }

  async function quickStatus(appId, status) {
    const updates = {
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'submitted' ? { submitted_at: new Date().toISOString() } : {}),
    };
    await supabase.from('applications').update(updates).eq('id', appId);
    setApps(prev => prev.map(a => a.id === appId ? { ...a, ...updates } : a));
    if (selected?.id === appId) setSelected(prev => ({ ...prev, ...updates }));
  }

  // ── Auth screen ──
  if (!user && !loading) return (
    <div style={s.page}>
      <AppNav />
      <div style={s.authPrompt}>
        <div style={s.authIcon}>🎓</div>
        <h2 style={s.authTitle}>Track your applications</h2>
        <p style={s.authSub}>Sign in to see deadlines, fill progress, and application statuses all in one place.</p>
        <Link href="/profile" style={s.btnPrimary}>Sign In →</Link>
      </div>
    </div>
  );

  if (loading) return (
    <div style={s.page}>
      <AppNav />
      <div style={s.loadCenter}><div style={s.spinner} /></div>
    </div>
  );

  return (
    <div style={s.page}>
      <AppNav />

      {/* ── Stats Row ── */}
      <div style={s.statsRow}>
        <StatCard label="Total" value={stats.total}     color="#e4e4e7" />
        <StatCard label="Deadline ≤14d" value={stats.upcoming}  color="#fbbf24" urgent={stats.upcoming > 0} />
        <StatCard label="In Progress"   value={stats.inProg}    color="#60a5fa" />
        <StatCard label="Submitted"     value={stats.submitted} color="#4ade80" />
        <StatCard label="Decisions"     value={stats.decisions} color="#c084fc" />
        {stats.accepted > 0 && <StatCard label="Accepted 🎉" value={stats.accepted} color="#4ade80" urgent />}
      </div>

      {/* ── Toolbar ── */}
      <div style={s.toolbar}>
        <div style={s.filterTabs}>
          {FILTERS.map(f => (
            <button key={f} style={{ ...s.filterTab, ...(filter === f ? s.filterTabActive : {}) }} onClick={() => setFilter(f)}>
              {f}
              <span style={s.filterCount}>
                {f === 'All' ? enriched.length : (enriched.filter(a => (FILTER_STATUSES[f] || []).includes(a.status)).length)}
              </span>
            </button>
          ))}
        </div>
        <div style={s.toolbarRight}>
          <input
            style={s.searchInput}
            placeholder="Search universities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={s.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="deadline">Sort: Deadline</option>
            <option value="updated">Sort: Recent</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
      </div>

      {/* ── Cards ── */}
      {visible.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📭</div>
          <p style={s.emptyText}>
            {apps.length === 0
              ? 'No applications yet — save universities from the home page to get started.'
              : 'No applications match this filter.'}
          </p>
          {apps.length === 0 && <Link href="/" style={s.btnPrimary}>Browse Universities →</Link>}
        </div>
      ) : (
        <div style={s.grid}>
          {visible.map(app => <AppCard key={app.id} app={app} onOpen={openDetail} onQuickStatus={quickStatus} />)}
        </div>
      )}

      {/* ── Detail Panel ── */}
      {selected && (() => {
        const enrichedSel = enriched.find(a => a.id === selected.id) || selected;
        const cfg = STATUS[editStatus] || STATUS.saved;
        const pct = getProgress(enrichedSel);
        const tag = enrichedSel.tag;
        const tagStyle = tag ? TAG_COLORS[tag] : null;

        return (
          <div style={s.overlay} onClick={() => setSelected(null)}>
            <div style={s.panel} onClick={e => e.stopPropagation()}>

              {/* Panel Header */}
              <div style={s.panelHeader}>
                <div style={s.panelAvatar}>{(enrichedSel.university_name || '?').charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.panelTitle}>{enrichedSel.university_name}</div>
                  <div style={s.panelProgram}>{enrichedSel.program_applied || 'Program not specified'}</div>
                  {tagStyle && (
                    <span style={{ ...s.tagBadge, color: tagStyle.color, background: tagStyle.bg }}>
                      {tag}
                    </span>
                  )}
                </div>
                <button style={s.closeBtn} onClick={() => setSelected(null)}>✕</button>
              </div>

              <div style={s.panelBody}>

                {/* Progress Bar */}
                <div style={s.section}>
                  <div style={s.sectionLabel}>Fill Progress</div>
                  <div style={s.progressWrap}>
                    <div style={{ ...s.progressBar, width: `${pct}%`, background: pct === 100 ? '#4ade80' : pct > 50 ? '#60a5fa' : '#fbbf24' }} />
                  </div>
                  <div style={s.progressPct}>{pct}% complete</div>
                </div>

                {/* Deadline Info */}
                {enrichedSel._deadline && (
                  <div style={s.section}>
                    <div style={s.sectionLabel}>Key Dates</div>
                    <div style={s.dateRow}>
                      <span style={s.dateLabel}>Apply By</span>
                      <DeadlineChip days={enrichedSel._daysLeft} date={enrichedSel._deadline} />
                    </div>
                    {enrichedSel._testDate && (
                      <div style={s.dateRow}>
                        <span style={s.dateLabel}>Entry Test</span>
                        <span style={s.dateValue}>{fmtDate(enrichedSel._testDate)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status */}
                <div style={s.section}>
                  <label style={s.sectionLabel}>Status</label>
                  <select
                    style={{ ...s.input, color: cfg.color }}
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{STATUS[o.value].icon} {o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Confirmation Number */}
                <div style={s.section}>
                  <label style={s.sectionLabel}>Confirmation Number</label>
                  <input
                    style={s.input}
                    value={editConfirm}
                    onChange={e => setEditConfirm(e.target.value)}
                    placeholder="e.g. NUST-2026-00123"
                  />
                </div>

                {/* Notes */}
                <div style={s.section}>
                  <label style={s.sectionLabel}>Notes</label>
                  <textarea
                    style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Your notes about this application..."
                  />
                </div>

                {/* Portal Info */}
                {enrichedSel.portal_domain && (
                  <div style={s.section}>
                    <div style={s.sectionLabel}>Portal Info</div>
                    <div style={s.infoGrid}>
                      <div style={s.infoRow}>
                        <span style={s.infoLabel}>Portal</span>
                        <a href={`https://${enrichedSel.portal_domain}`} target="_blank" rel="noreferrer" style={s.link}>
                          {enrichedSel.portal_domain} ↗
                        </a>
                      </div>
                      {enrichedSel.portal_username && (
                        <div style={s.infoRow}>
                          <span style={s.infoLabel}>Email</span>
                          <span style={s.infoVal}>{enrichedSel.portal_username}</span>
                        </div>
                      )}
                      {enrichedSel.submitted_at && (
                        <div style={s.infoRow}>
                          <span style={s.infoLabel}>Submitted</span>
                          <span style={s.infoVal}>{fmtDate(enrichedSel.submitted_at)}</span>
                        </div>
                      )}
                      <div style={s.infoRow}>
                        <span style={s.infoLabel}>Last Updated</span>
                        <span style={s.infoVal}>{timeAgo(enrichedSel.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Panel Actions */}
              <div style={s.panelActions}>
                <button style={s.btnSave} onClick={saveDetail} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                {enrichedSel._applyUrl && (
                  <a href={enrichedSel._applyUrl} target="_blank" rel="noreferrer" style={s.btnFill}>
                    Fill Form ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── App Card ─────────────────────────────────────────────────────────────────

function AppCard({ app, onOpen, onQuickStatus }) {
  const cfg   = STATUS[app.status] || STATUS.saved;
  const pct   = getProgress(app);
  const tag   = app.tag;
  const tagC  = tag ? TAG_COLORS[tag] : null;
  const days  = app._daysLeft;
  const isUrgent = days != null && days >= 0 && days <= 7;
  const isPast   = days != null && days < 0;

  return (
    <div
      style={{
        ...s.card,
        ...(isUrgent ? s.cardUrgent : {}),
      }}
      onClick={() => onOpen(app)}
    >
      <div style={s.cardTop}>
        <div style={s.cardAvatar}>{(app.university_name || '?').charAt(0)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.cardName}>{app.university_name}</div>
          <div style={s.cardProg}>{app.program_applied || 'Program not set'}</div>
        </div>
        <span style={{ ...s.statusBadge, color: cfg.color, background: cfg.bg }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Progress bar */}
      <div style={s.cardProgress}>
        <div style={{ ...s.cardProgressBar, width: `${pct}%`, background: pct === 100 ? '#4ade80' : pct > 50 ? '#60a5fa' : '#fbbf24' }} />
      </div>

      <div style={s.cardMeta}>
        {/* Deadline */}
        {app._deadline ? (
          <span style={{ fontSize: 11, color: isUrgent ? '#fbbf24' : isPast ? '#ef4444' : '#94a3b8' }}>
            {isPast
              ? `Closed ${Math.abs(days)}d ago`
              : days === 0 ? '⚠️ Due today!'
              : `${days}d left`}
          </span>
        ) : <span style={{ fontSize: 11, color: '#52525b' }}>No deadline</span>}

        <div style={s.cardRight}>
          {tagC && <span style={{ ...s.tagPill, color: tagC.color, background: tagC.bg }}>{tag}</span>}
          <span style={{ fontSize: 10, color: '#52525b' }}>{timeAgo(app.updated_at)}</span>
        </div>
      </div>

      {/* Quick actions */}
      {app._applyUrl && (
        <a
          href={app._applyUrl}
          target="_blank"
          rel="noreferrer"
          style={s.cardFillBtn}
          onClick={e => { e.stopPropagation(); if (app.status === 'saved') onQuickStatus(app.id, 'form_filling'); }}
        >
          Fill Form ↗
        </a>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, urgent }) {
  return (
    <div style={{ ...s.statCard, ...(urgent && value > 0 ? { borderColor: color, boxShadow: `0 0 0 1px ${color}22` } : {}) }}>
      <div style={{ ...s.statValue, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

// ─── Deadline Chip ────────────────────────────────────────────────────────────

function DeadlineChip({ days, date }) {
  if (days == null) return <span style={s.dateValue}>{fmtDate(date)}</span>;
  if (days < 0) return <span style={{ ...s.dateValue, color: '#ef4444' }}>Closed · {fmtDate(date)}</span>;
  if (days === 0) return <span style={{ ...s.dateValue, color: '#fbbf24' }}>⚠️ Due today!</span>;
  if (days <= 7) return <span style={{ ...s.dateValue, color: '#fbbf24' }}>{days}d left · {fmtDate(date)}</span>;
  return <span style={{ ...s.dateValue, color: '#4ade80' }}>{days}d left · {fmtDate(date)}</span>;
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function AppNav() {
  return (
    <nav style={s.nav}>
      <Link href="/" style={s.brand}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c6 3 10 3 16 0v-5" />
        </svg>
        Ilm Se Urooj
      </Link>
      <div style={s.navLinks}>
        <Link href="/" style={s.navLink}>Explore</Link>
        <Link href="/profile" style={s.navLink}>Profile</Link>
        <Link href="/timeline" style={s.navLink}>Timeline</Link>
        <Link href="/applications" style={{ ...s.navLink, color: '#4ade80' }}>Applications</Link>
      </div>
    </nav>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #080b08 0%, #101410 60%, #080b08 100%)',
    fontFamily: "'Inter', -apple-system, sans-serif",
    color: '#e4e4e7',
    padding: '0 20px 80px',
  },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 0', maxWidth: 1200, margin: '0 auto',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 17, fontWeight: 700, color: '#4ade80', textDecoration: 'none',
  },
  navLinks: { display: 'flex', gap: 4 },
  navLink: {
    color: '#71717a', fontSize: 13, textDecoration: 'none',
    padding: '6px 12px', borderRadius: 8, transition: 'all 0.2s',
  },

  statsRow: {
    display: 'flex', gap: 12, maxWidth: 1200, margin: '28px auto 0', flexWrap: 'wrap',
  },
  statCard: {
    flex: '1 1 120px', background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
    padding: '16px 20px', textAlign: 'center', transition: 'all 0.2s',
  },
  statValue: { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 11, color: '#71717a', marginTop: 4, fontWeight: 500 },

  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    maxWidth: 1200, margin: '20px auto 0', gap: 12, flexWrap: 'wrap',
  },
  filterTabs: { display: 'flex', gap: 4 },
  filterTab: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)',
    background: 'transparent', color: '#71717a', cursor: 'pointer',
    fontSize: 13, fontFamily: 'inherit', transition: 'all 0.2s',
  },
  filterTabActive: {
    background: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.3)', color: '#4ade80',
  },
  filterCount: {
    fontSize: 10, padding: '1px 6px', background: 'rgba(255,255,255,0.06)',
    borderRadius: 6, color: '#52525b',
  },
  toolbarRight: { display: 'flex', gap: 8 },
  searchInput: {
    padding: '7px 12px', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
    color: '#e4e4e7', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 180,
  },
  sortSelect: {
    padding: '7px 10px', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
    color: '#94a3b8', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 14, maxWidth: 1200, margin: '20px auto 0',
  },
  card: {
    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  cardUrgent: { borderColor: 'rgba(251,191,36,0.3)', boxShadow: '0 0 0 1px rgba(251,191,36,0.1)' },
  cardTop: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  cardAvatar: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: 'rgba(74,222,128,0.1)', color: '#4ade80',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 15,
  },
  cardName: { fontSize: 14, fontWeight: 600, color: '#e4e4e7', lineHeight: 1.3 },
  cardProg: { fontSize: 11, color: '#71717a', marginTop: 2 },
  statusBadge: {
    fontSize: 10, padding: '3px 8px', borderRadius: 6,
    fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap',
  },
  cardProgress: {
    height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden',
  },
  cardProgressBar: { height: '100%', borderRadius: 2, transition: 'width 0.3s ease' },
  cardMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardRight: { display: 'flex', alignItems: 'center', gap: 6 },
  tagPill: { fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600 },
  cardFillBtn: {
    display: 'block', textAlign: 'center', padding: '7px 12px',
    background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
    borderRadius: 8, color: '#4ade80', fontSize: 12, fontWeight: 600,
    textDecoration: 'none', transition: 'all 0.2s',
  },

  empty: {
    textAlign: 'center', padding: '80px 24px', maxWidth: 480, margin: '0 auto',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#71717a', fontSize: 14, marginBottom: 20, lineHeight: 1.6 },

  authPrompt: {
    textAlign: 'center', padding: '100px 24px', maxWidth: 400, margin: '0 auto',
  },
  authIcon: { fontSize: 56, marginBottom: 16 },
  authTitle: { fontSize: 22, fontWeight: 700, margin: '0 0 8px' },
  authSub: { color: '#71717a', fontSize: 14, marginBottom: 24, lineHeight: 1.6 },
  btnPrimary: {
    display: 'inline-flex', padding: '10px 24px',
    background: 'linear-gradient(135deg, #16a34a, #4ade80)',
    color: '#080b08', borderRadius: 10, fontSize: 14, fontWeight: 700,
    textDecoration: 'none', border: 'none', cursor: 'pointer',
  },
  loadCenter: { display: 'flex', justifyContent: 'center', padding: 100 },
  spinner: {
    width: 32, height: 32, border: '3px solid rgba(255,255,255,0.08)',
    borderTopColor: '#4ade80', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  // ── Detail Panel ──
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
    zIndex: 1000, display: 'flex', justifyContent: 'flex-end',
  },
  panel: {
    width: 440, maxWidth: '100vw', height: '100vh',
    background: '#0c0f0c', borderLeft: '1px solid rgba(255,255,255,0.07)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    animation: 'slideIn 0.22s cubic-bezier(0.4,0,0.2,1)',
  },
  panelHeader: {
    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
  },
  panelAvatar: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    background: 'rgba(74,222,128,0.12)', color: '#4ade80',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 18,
  },
  panelTitle: { fontSize: 16, fontWeight: 700, color: '#e4e4e7', lineHeight: 1.3 },
  panelProgram: { fontSize: 12, color: '#71717a', marginTop: 2 },
  tagBadge: { display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600, marginTop: 4 },
  closeBtn: {
    background: 'none', border: 'none', color: '#52525b', fontSize: 18,
    cursor: 'pointer', padding: '4px 6px', flexShrink: 0, lineHeight: 1,
  },
  panelBody: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.8px' },
  input: {
    width: '100%', padding: '9px 12px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, color: '#e4e4e7', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  },
  progressWrap: { height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3, transition: 'width 0.4s ease' },
  progressPct: { fontSize: 11, color: '#71717a', marginTop: 2 },
  dateRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 },
  dateLabel: { color: '#71717a' },
  dateValue: { color: '#e4e4e7', fontSize: 12 },
  infoGrid: { background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 },
  infoLabel: { color: '#52525b', fontSize: 11 },
  infoVal: { color: '#a1a1aa', fontSize: 12 },
  link: { color: '#4ade80', textDecoration: 'none', fontSize: 12 },
  panelActions: {
    padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', gap: 10, flexShrink: 0,
  },
  btnSave: {
    flex: 1, padding: '10px', background: 'rgba(74,222,128,0.1)',
    border: '1px solid rgba(74,222,128,0.25)', borderRadius: 8,
    color: '#4ade80', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.2s',
  },
  btnFill: {
    flex: 1, padding: '10px', textAlign: 'center',
    background: 'linear-gradient(135deg, #16a34a, #4ade80)',
    border: 'none', borderRadius: 8, color: '#080b08',
    fontSize: 13, fontWeight: 700, textDecoration: 'none', cursor: 'pointer',
  },
};
