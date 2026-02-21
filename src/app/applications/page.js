'use client';

import { useState, useEffect } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#a1a1aa', bg: 'rgba(161,161,170,0.12)' },
    account_created: { label: 'Account Created', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
    form_filling: { label: 'Filling', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    awaiting_review: { label: 'In Review', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    submitted: { label: 'Submitted', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
    error: { label: 'Error', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    accepted: { label: 'Accepted', color: '#22c55e', bg: 'rgba(34,197,94,0.25)' },
    rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.25)' },
    waitlisted: { label: 'Waitlisted', color: '#fbbf24', bg: 'rgba(251,191,36,0.25)' },
};

export default function ApplicationsPage() {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // For now, show empty state — auth integration comes with the extension
        // In production, this would use Supabase client-side auth
        setLoading(false);
        setApps([]);
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.page}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c6 3 10 3 16 0v-5" />
                        </svg>
                        <h1 style={styles.title}>Ilm Se Urooj</h1>
                    </div>
                    <p style={styles.subtitle}>Application Dashboard</p>
                </div>

                {/* Stats Cards */}
                <div style={styles.statsGrid}>
                    <StatCard label="Total" value={apps.length} color="#e4e4e7" />
                    <StatCard label="Submitted" value={apps.filter(a => a.status === 'submitted').length} color="#4ade80" />
                    <StatCard label="Accepted" value={apps.filter(a => a.status === 'accepted').length} color="#22c55e" />
                    <StatCard label="Pending" value={apps.filter(a => a.status === 'pending').length} color="#a1a1aa" />
                </div>

                {/* Applications Table */}
                <div style={styles.tableCard}>
                    {loading ? (
                        <div style={styles.center}>
                            <div style={styles.spinner}></div>
                        </div>
                    ) : error ? (
                        <div style={styles.center}>
                            <p style={{ color: '#ef4444' }}>{error}</p>
                        </div>
                    ) : apps.length === 0 ? (
                        <div style={styles.emptyState}>
                            <span style={{ fontSize: 48 }}>🎓</span>
                            <h2 style={{ margin: '12px 0 4px', color: '#e4e4e7' }}>No applications yet</h2>
                            <p style={{ color: '#a1a1aa', fontSize: 13 }}>
                                Install the Ilm Se Urooj Chrome extension and visit a university portal to get started.
                            </p>
                        </div>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>University</th>
                                    <th style={styles.th}>Program</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Confirmation</th>
                                    <th style={styles.th}>Date</th>
                                    <th style={styles.th}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {apps.map((app) => {
                                    const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                                    return (
                                        <tr key={app.id} style={styles.tr}>
                                            <td style={styles.td}>
                                                <strong>{app.university_name}</strong>
                                            </td>
                                            <td style={{ ...styles.td, color: '#a1a1aa' }}>
                                                {app.program_applied || '—'}
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    ...styles.badge,
                                                    color: status.color,
                                                    background: status.bg,
                                                }}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>
                                                {app.confirmation_number || '—'}
                                            </td>
                                            <td style={{ ...styles.td, color: '#a1a1aa', fontSize: 12 }}>
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={styles.td}>
                                                <button
                                                    onClick={() => window.open(`https://${app.portal_domain}`, '_blank')}
                                                    style={styles.openBtn}
                                                >
                                                    Open Portal →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div style={styles.statCard}>
            <span style={{ fontSize: 28, fontWeight: 700, color }}>{value}</span>
            <span style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: '#0c0e0b',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '40px 20px',
        color: '#e4e4e7',
    },
    page: {
        maxWidth: 960,
        margin: '0 auto',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 700,
        color: '#4ade80',
        margin: 0,
    },
    subtitle: {
        fontSize: 13,
        color: '#a1a1aa',
        margin: 0,
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        background: '#161916',
        border: '1px solid #27272a',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
    },
    tableCard: {
        background: '#161916',
        border: '1px solid #27272a',
        borderRadius: 12,
        overflow: 'hidden',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        textAlign: 'left',
        padding: '12px 16px',
        fontSize: 11,
        fontWeight: 600,
        color: '#a1a1aa',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '1px solid #27272a',
    },
    tr: {
        borderBottom: '1px solid #1e211e',
        transition: 'background 0.15s ease',
    },
    td: {
        padding: '12px 16px',
        fontSize: 13,
    },
    badge: {
        fontSize: 10,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 20,
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
    },
    openBtn: {
        background: 'rgba(74, 222, 128, 0.1)',
        color: '#4ade80',
        border: '1px solid rgba(74, 222, 128, 0.2)',
        borderRadius: 6,
        padding: '4px 12px',
        fontSize: 11,
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '48px 24px',
    },
    center: {
        display: 'flex',
        justifyContent: 'center',
        padding: 48,
    },
    spinner: {
        width: 24,
        height: 24,
        border: '3px solid #27272a',
        borderTopColor: '#4ade80',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
};
