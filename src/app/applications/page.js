'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { universities as uniData } from '@/data/universities';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STATUS_CONFIG = {
    saved: { label: 'Saved', color: '#9ca3af', bg: 'rgba(156,163,175,0.2)', col: 0 },
    pending: { label: 'Pending', color: '#9ca3af', bg: 'rgba(156,163,175,0.2)', col: 0 },
    account_created: { label: 'Account Created', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', col: 1 },
    form_filling: { label: 'Filling Form', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', col: 1 },
    awaiting_review: { label: 'In Review', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', col: 1 },
    submitted: { label: 'Submitted', color: '#4ade80', bg: 'rgba(74,222,128,0.15)', col: 2 },
    accepted: { label: 'Accepted', color: '#4ade80', bg: 'rgba(74,222,128,0.2)', col: 3 },
    rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', col: 3 },
    waitlisted: { label: 'Waitlisted', color: '#fb923c', bg: 'rgba(251,146,60,0.15)', col: 3 },
};

const KANBAN_COLS = ['Saved', 'Applying', 'Submitted', 'Decision'];

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function ApplicationsPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [apps, setApps] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [confirmNum, setConfirmNum] = useState('');

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
        const channel = supabase
            .channel('applications_realtime')
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'applications',
                filter: `student_id=eq.${user.id}`
            }, (payload) => {
                setApps(prev => {
                    if (payload.eventType === 'DELETE') return prev.filter(a => a.id !== payload.old.id);
                    const idx = prev.findIndex(a => a.id === (payload.new?.id || payload.old?.id));
                    if (idx === -1 && payload.new) return [...prev, payload.new];
                    return prev.map(a => a.id === payload.new?.id ? payload.new : a);
                });
            })
            .subscribe();
        // Mark last seen
        localStorage.setItem('applications_last_seen', new Date().toISOString());
        return () => supabase.removeChannel(channel);
    }, [user]);

    async function loadApps(userId) {
        const { data } = await supabase.from('applications')
            .select('*').eq('student_id', userId).order('updated_at', { ascending: false });
        setApps(data || []);
        setLoading(false);
    }

    // Kanban columns
    const columns = useMemo(() => {
        const cols = [[], [], [], []];
        apps.forEach(app => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.saved;
            cols[cfg.col].push(app);
        });
        return cols;
    }, [apps]);

    // Detail panel actions
    async function updateAppStatus(appId, newStatus) {
        const { error } = await supabase.from('applications')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', appId);
        if (!error) {
            setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus, updated_at: new Date().toISOString() } : a));
            setSelectedApp(prev => prev && prev.id === appId ? { ...prev, status: newStatus } : prev);
        }
    }

    async function saveAppNotes(appId) {
        setSavingNotes(true);
        await supabase.from('applications')
            .update({ notes, updated_at: new Date().toISOString() })
            .eq('id', appId);
        setApps(prev => prev.map(a => a.id === appId ? { ...a, notes } : a));
        setSavingNotes(false);
    }

    async function saveConfirmation(appId) {
        await supabase.from('applications')
            .update({ confirmation_number: confirmNum, status: 'submitted', updated_at: new Date().toISOString() })
            .eq('id', appId);
        setApps(prev => prev.map(a => a.id === appId ? { ...a, confirmation_number: confirmNum, status: 'submitted' } : a));
    }

    function openDetail(app) {
        setSelectedApp(app);
        setNotes(app.notes || '');
        setConfirmNum(app.confirmation_number || '');
    }

    // Auth screen
    if (!user && !loading) {
        return (
            <div className="apps-page">
                <style jsx>{appStyles}</style>
                <AppNav />
                <div className="auth-prompt">
                    <h2>Sign in to view your applications</h2>
                    <Link href="/profile" className="btn-primary-app">Sign In →</Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="apps-page">
                <style jsx>{appStyles}</style>
                <div className="loading-center"><div className="spinner-app"></div></div>
            </div>
        );
    }

    return (
        <div className="apps-page">
            <style jsx>{appStyles}</style>
            <AppNav />

            <div className="apps-header">
                <h1>📊 Application Pipeline</h1>
                <span className="apps-count">{apps.length} universities</span>
            </div>

            {apps.length === 0 ? (
                <div className="empty-state-app">
                    <p>Start by swiping universities on the main page, or visit a university portal with the extension installed.</p>
                    <Link href="/" className="btn-primary-app">Browse Universities →</Link>
                </div>
            ) : (
                <div className="kanban">
                    {KANBAN_COLS.map((colTitle, ci) => (
                        <div key={colTitle} className="kanban-col">
                            <div className="kanban-col-header">
                                <span>{colTitle}</span>
                                <span className="kanban-count">{columns[ci].length}</span>
                            </div>
                            <div className="kanban-cards">
                                {columns[ci].map(app => {
                                    const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.saved;
                                    return (
                                        <button key={app.id} className="kanban-card" onClick={() => openDetail(app)}>
                                            <strong>{app.university_name}</strong>
                                            <span className="kanban-program">{app.program_applied || 'Not specified'}</span>
                                            <div className="kanban-card-footer">
                                                <span className="status-badge-app" style={{ color: cfg.color, background: cfg.bg }}>
                                                    {cfg.label}
                                                </span>
                                                <span className="kanban-time">{timeAgo(app.updated_at)}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Panel */}
            {selectedApp && (
                <div className="detail-overlay" onClick={() => setSelectedApp(null)}>
                    <div className="detail-panel" onClick={e => e.stopPropagation()}>
                        <div className="detail-header">
                            <div>
                                <h2>{selectedApp.university_name}</h2>
                                <span className="detail-program">{selectedApp.program_applied || 'Program not specified'}</span>
                            </div>
                            <button className="detail-close" onClick={() => setSelectedApp(null)}>×</button>
                        </div>

                        <div className="detail-body">
                            <div className="detail-row">
                                <span className="detail-label">Portal</span>
                                <a href={`https://${selectedApp.portal_domain}`} target="_blank" rel="noreferrer" className="detail-link">
                                    {selectedApp.portal_domain} ↗
                                </a>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Email</span>
                                <span>{selectedApp.portal_username || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Status</span>
                                <span className="status-badge-app" style={{
                                    color: (STATUS_CONFIG[selectedApp.status] || STATUS_CONFIG.saved).color,
                                    background: (STATUS_CONFIG[selectedApp.status] || STATUS_CONFIG.saved).bg
                                }}>
                                    {(STATUS_CONFIG[selectedApp.status] || STATUS_CONFIG.saved).label}
                                </span>
                            </div>
                            {selectedApp.submitted_at && (
                                <div className="detail-row">
                                    <span className="detail-label">Submitted</span>
                                    <span>{new Date(selectedApp.submitted_at).toLocaleDateString()}</span>
                                </div>
                            )}

                            <div className="detail-section">
                                <label className="detail-label">Confirmation #</label>
                                <div className="detail-input-row">
                                    <input value={confirmNum} onChange={e => setConfirmNum(e.target.value)} placeholder="Enter confirmation number" />
                                    <button className="btn-sm-app" onClick={() => saveConfirmation(selectedApp.id)}>Save</button>
                                </div>
                            </div>

                            <div className="detail-section">
                                <label className="detail-label">Notes</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Your notes about this application..." />
                                <button className="btn-sm-app" onClick={() => saveAppNotes(selectedApp.id)} disabled={savingNotes}>
                                    {savingNotes ? 'Saving...' : 'Save Notes'}
                                </button>
                            </div>
                        </div>

                        <div className="detail-actions">
                            <a href={`https://${selectedApp.portal_domain}`} target="_blank" rel="noreferrer" className="btn-primary-app">
                                Open Portal →
                            </a>
                            {selectedApp.status !== 'accepted' && (
                                <button className="btn-success-app" onClick={() => updateAppStatus(selectedApp.id, 'accepted')}>
                                    Mark as Accepted
                                </button>
                            )}
                            {selectedApp.status !== 'rejected' && (
                                <button className="btn-danger-app" onClick={() => updateAppStatus(selectedApp.id, 'rejected')}>
                                    Mark as Rejected
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AppNav() {
    return (
        <nav className="app-nav">
            <Link href="/" className="app-brand">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c6 3 10 3 16 0v-5" />
                </svg>
                <span>Ilm Se Urooj</span>
            </Link>
            <div className="app-nav-links">
                <Link href="/">Explore</Link>
                <Link href="/profile">Profile</Link>
                <Link href="/extension">Extension</Link>
            </div>
        </nav>
    );
}

const appStyles = `
  .apps-page { min-height: 100vh; background: linear-gradient(135deg, #0c0e0b 0%, #1a1d1a 50%, #0c0e0b 100%); font-family: 'Inter', -apple-system, sans-serif; color: #e4e4e7; padding: 0 24px 60px; }
  .app-nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 0; max-width: 1200px; margin: 0 auto; }
  .app-brand { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 700; color: #4ade80; text-decoration: none; }
  .app-nav-links { display: flex; gap: 12px; }
  .app-nav-links a { color: #a1a1aa; font-size: 13px; text-decoration: none; padding: 6px 12px; border-radius: 8px; }
  .app-nav-links a:hover { color: #e4e4e7; background: rgba(255,255,255,0.06); }

  .apps-header { display: flex; align-items: center; gap: 12px; max-width: 1200px; margin: 0 auto; padding: 12px 0 24px; }
  .apps-header h1 { font-size: 22px; font-weight: 700; margin: 0; }
  .apps-count { font-size: 13px; color: #71717a; background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 12px; }

  .kanban { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; max-width: 1200px; margin: 0 auto; }
  @media (max-width: 900px) { .kanban { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 500px) { .kanban { grid-template-columns: 1fr; } }
  .kanban-col { background: rgba(22,25,22,0.5); border: 1px solid #1f2a1c; border-radius: 12px; padding: 12px; min-height: 200px; }
  .kanban-col-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 8px 12px; font-size: 13px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1f2a1c; margin-bottom: 8px; }
  .kanban-count { font-size: 11px; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 8px; }
  .kanban-cards { display: flex; flex-direction: column; gap: 8px; }
  .kanban-card { background: #0c0e0b; border: 1px solid #27272a; border-radius: 10px; padding: 14px; text-align: left; cursor: pointer; transition: all 0.2s; width: 100%; font-family: inherit; color: inherit; display: flex; flex-direction: column; gap: 4px; }
  .kanban-card:hover { border-color: #4ade80; transform: translateY(-1px); }
  .kanban-card strong { font-size: 13px; color: #e4e4e7; }
  .kanban-program { font-size: 11px; color: #71717a; }
  .kanban-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
  .kanban-time { font-size: 10px; color: #52525b; }
  .status-badge-app { font-size: 10px; padding: 2px 8px; border-radius: 8px; font-weight: 600; }

  .empty-state-app { text-align: center; padding: 80px 24px; max-width: 500px; margin: 0 auto; color: #a1a1aa; }
  .auth-prompt { text-align: center; padding: 100px 24px; }
  .auth-prompt h2 { font-size: 20px; margin-bottom: 16px; }

  .btn-primary-app { display: inline-flex; padding: 10px 24px; background: #4ade80; color: #0c0e0b; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; text-decoration: none; cursor: pointer; transition: all 0.2s; }
  .btn-primary-app:hover { background: #22c55e; transform: translateY(-1px); }

  /* Detail Panel */
  .detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; justify-content: flex-end; }
  .detail-panel { width: 420px; max-width: 100vw; height: 100vh; background: #0c0e0b; border-left: 1px solid #27272a; overflow-y: auto; animation: slideIn 0.2s ease-out; display: flex; flex-direction: column; }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .detail-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 24px; border-bottom: 1px solid #1f2a1c; }
  .detail-header h2 { font-size: 18px; margin: 0 0 4px; }
  .detail-program { font-size: 13px; color: #71717a; }
  .detail-close { background: none; border: none; color: #71717a; font-size: 24px; cursor: pointer; padding: 4px 8px; }
  .detail-close:hover { color: #e4e4e7; }
  .detail-body { padding: 24px; flex: 1; display: flex; flex-direction: column; gap: 16px; }
  .detail-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
  .detail-label { font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .detail-link { color: #4ade80; text-decoration: none; font-size: 13px; }
  .detail-link:hover { text-decoration: underline; }
  .detail-section { display: flex; flex-direction: column; gap: 8px; }
  .detail-section textarea, .detail-section input, .detail-input-row input { width: 100%; padding: 10px 12px; background: #161916; border: 1px solid #27272a; border-radius: 8px; color: #e4e4e7; font-size: 13px; font-family: inherit; resize: vertical; box-sizing: border-box; }
  .detail-section textarea:focus, .detail-section input:focus, .detail-input-row input:focus { border-color: #4ade80; outline: none; }
  .detail-input-row { display: flex; gap: 8px; }
  .detail-input-row input { flex: 1; }
  .btn-sm-app { padding: 8px 16px; background: rgba(74,222,128,0.1); color: #4ade80; border: 1px solid rgba(74,222,128,0.2); border-radius: 8px; font-size: 12px; cursor: pointer; font-family: inherit; white-space: nowrap; }
  .btn-sm-app:hover { background: rgba(74,222,128,0.2); }
  .btn-sm-app:disabled { opacity: 0.5; cursor: not-allowed; }
  .detail-actions { padding: 20px 24px; border-top: 1px solid #1f2a1c; display: flex; gap: 8px; flex-wrap: wrap; }
  .btn-success-app { padding: 8px 16px; background: rgba(74,222,128,0.1); color: #4ade80; border: 1px solid rgba(74,222,128,0.2); border-radius: 8px; font-size: 12px; cursor: pointer; font-family: inherit; }
  .btn-success-app:hover { background: rgba(74,222,128,0.2); }
  .btn-danger-app { padding: 8px 16px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; font-size: 12px; cursor: pointer; font-family: inherit; }
  .btn-danger-app:hover { background: rgba(239,68,68,0.2); }

  .loading-center { display: flex; justify-content: center; padding: 120px; }
  .spinner-app { width: 32px; height: 32px; border: 3px solid #27272a; border-top-color: #4ade80; border-radius: 50%; animation: spin-app 0.8s linear infinite; }
  @keyframes spin-app { to { transform: rotate(360deg); } }
`;
