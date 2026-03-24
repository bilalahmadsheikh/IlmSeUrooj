'use client';

import { useState, useEffect } from 'react';

export default function AnalyticsDashboard({ apiFetch }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/analytics').then(res => {
            if (res?.analytics) setData(res.analytics);
            setLoading(false);
        });
    }, [apiFetch]);

    if (loading) return <div className="dash-empty">Loading overview…</div>;
    if (!data) return <div className="dash-empty">No data yet.</div>;

    const { applications, payments, documents, tasks, referrals } = data;

    return (
        <div>
            <div className="dash-section">
                <h2 className="dash-section-title">Your Admission Journey Overview</h2>
                <div className="dash-grid-3" style={{ marginBottom: 20 }}>
                    <div className="dash-stat-card">
                        <div className="dash-stat-value">{applications.total}</div>
                        <div className="dash-stat-label">Universities Applied</div>
                    </div>
                    <div className="dash-stat-card">
                        <div className="dash-stat-value">{applications.accepted}</div>
                        <div className="dash-stat-label">Accepted Offers</div>
                    </div>
                    <div className="dash-stat-card">
                        <div className="dash-stat-value" style={{ fontSize: 18 }}>
                            {applications.finalChoice ?? '—'}
                        </div>
                        <div className="dash-stat-label">Final Choice</div>
                    </div>
                </div>

                {/* Application Status Breakdown */}
                <h3 style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 10, fontWeight: 600 }}>
                    Application Status Breakdown
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Object.entries(applications.byStatus).length === 0
                        ? <span className="dash-tag dash-tag-gray">No applications yet</span>
                        : Object.entries(applications.byStatus).map(([status, count]) => (
                            <span key={status} className={`dash-tag ${statusTagClass(status)}`}>
                                {formatStatus(status)}: {count}
                            </span>
                        ))
                    }
                </div>
            </div>

            <div className="dash-grid-2">
                {/* Financial Summary */}
                <div className="dash-section">
                    <h2 className="dash-section-title">Financial Summary</h2>
                    <div className="dash-grid-2">
                        <div className="dash-stat-card">
                            <div className="dash-stat-value" style={{ fontSize: 20 }}>
                                Rs {payments.totalPaid.toLocaleString()}
                            </div>
                            <div className="dash-stat-label">Total Paid</div>
                        </div>
                        <div className="dash-stat-card">
                            <div className="dash-stat-value" style={{ fontSize: 20, color: '#fbbf24' }}>
                                Rs {payments.totalPending.toLocaleString()}
                            </div>
                            <div className="dash-stat-label">Pending</div>
                        </div>
                    </div>
                    <p style={{ fontSize: 12, color: '#71717a', marginTop: 12, marginBottom: 0 }}>
                        {payments.paidCount} of {payments.count} payments completed
                    </p>
                </div>

                {/* Task Progress */}
                <div className="dash-section">
                    <h2 className="dash-section-title">Task Progress</h2>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, color: '#a1a1aa' }}>Completion Rate</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>
                                {tasks.completionRate}%
                            </span>
                        </div>
                        <div style={{ height: 8, background: '#27272a', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${tasks.completionRate}%`,
                                background: 'linear-gradient(to right, #4ade80, #22d3ee)',
                                borderRadius: 4,
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                    </div>
                    <div className="dash-grid-3">
                        <div className="dash-stat-card">
                            <div className="dash-stat-value" style={{ fontSize: 22 }}>{tasks.total}</div>
                            <div className="dash-stat-label">Total</div>
                        </div>
                        <div className="dash-stat-card">
                            <div className="dash-stat-value" style={{ fontSize: 22 }}>{tasks.completed}</div>
                            <div className="dash-stat-label">Done</div>
                        </div>
                        <div className="dash-stat-card">
                            <div className="dash-stat-value" style={{ fontSize: 22, color: tasks.overdue > 0 ? '#ef4444' : '#4ade80' }}>
                                {tasks.overdue}
                            </div>
                            <div className="dash-stat-label">Overdue</div>
                        </div>
                    </div>
                </div>

                {/* Documents */}
                <div className="dash-section">
                    <h2 className="dash-section-title">Documents</h2>
                    <div className="dash-stat-card" style={{ marginBottom: 12 }}>
                        <div className="dash-stat-value">{documents.total}</div>
                        <div className="dash-stat-label">Documents Uploaded</div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {documents.types.map(t => (
                            <span key={t} className="dash-tag dash-tag-blue">{formatDocType(t)}</span>
                        ))}
                        {documents.types.length === 0 &&
                            <span className="dash-tag dash-tag-gray">No documents yet</span>
                        }
                    </div>
                </div>

                {/* Referrals */}
                <div className="dash-section">
                    <h2 className="dash-section-title">Referrals</h2>
                    <div className="dash-grid-3">
                        <div className="dash-stat-card">
                            <div className="dash-stat-value" style={{ fontSize: 22 }}>{referrals.total}</div>
                            <div className="dash-stat-label">Sent</div>
                        </div>
                        <div className="dash-stat-card">
                            <div className="dash-stat-value" style={{ fontSize: 22 }}>{referrals.successful}</div>
                            <div className="dash-stat-label">Joined</div>
                        </div>
                        <div className="dash-stat-card">
                            <div className="dash-stat-value" style={{ fontSize: 22, color: '#fbbf24' }}>
                                {referrals.points}
                            </div>
                            <div className="dash-stat-label">Points</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dash-section" style={{ textAlign: 'center', padding: '16px 24px' }}>
                <p style={{ fontSize: 12, color: '#71717a', margin: 0 }}>
                    Use the tabs above to manage your timeline, documents, payments, and more.
                    All data syncs with your profile automatically.
                </p>
            </div>
        </div>
    );
}

function statusTagClass(status) {
    const map = {
        accepted: 'dash-tag-green',
        enrolled: 'dash-tag-green',
        selected: 'dash-tag-green',
        rejected: 'dash-tag-red',
        waitlisted: 'dash-tag-yellow',
        applied: 'dash-tag-blue',
        awaiting_merit: 'dash-tag-yellow',
    };
    return map[status] ?? 'dash-tag-gray';
}

function formatStatus(s) {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDocType(t) {
    return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
