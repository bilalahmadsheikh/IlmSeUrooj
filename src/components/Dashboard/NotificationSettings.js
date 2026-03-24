'use client';

import { useState, useEffect } from 'react';

export default function NotificationSettings({ apiFetch }) {
    const [prefs, setPrefs] = useState({
        whatsapp_number: '',
        whatsapp_enabled: false,
        email_enabled: true,
        deadline_alerts: true,
        deadline_alert_days: [30, 14, 7, 3, 1],
        payment_alerts: true,
        merit_list_alerts: true,
        weekly_digest: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const load = async () => {
        const res = await apiFetch('/api/notifications');
        if (res?.preferences) setPrefs(p => ({ ...p, ...res.preferences }));
        setLoading(false);
    };

    useEffect(() => { load(); }, [apiFetch]);

    const save = async () => {
        setSaving(true);
        const res = await apiFetch('/api/notifications', {
            method: 'PUT',
            body: JSON.stringify(prefs),
        });
        if (res?.preferences) {
            setPrefs(p => ({ ...p, ...res.preferences }));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
        setSaving(false);
    };

    const toggleDay = (day) => {
        setPrefs(p => ({
            ...p,
            deadline_alert_days: p.deadline_alert_days.includes(day)
                ? p.deadline_alert_days.filter(d => d !== day)
                : [...p.deadline_alert_days, day].sort((a, b) => b - a),
        }));
    };

    if (loading) return <div className="dash-empty">Loading preferences…</div>;

    return (
        <div>
            <div className="dash-section">
                <h2 className="dash-section-title">Notification Settings</h2>
                <p style={{ fontSize: 13, color: '#a1a1aa', marginTop: -8, marginBottom: 20 }}>
                    Configure how and when you receive alerts about deadlines, payments, and merit lists.
                </p>

                {/* WhatsApp */}
                <div style={{
                    background: '#1a1c1a',
                    border: '1px solid #27272a',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: 24 }}></span>
                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7', margin: 0 }}>
                                WhatsApp Notifications
                            </h3>
                            <p style={{ fontSize: 12, color: '#71717a', margin: 0 }}>
                                Get reminders directly on WhatsApp
                            </p>
                        </div>
                        <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={prefs.whatsapp_enabled}
                                onChange={e => setPrefs(p => ({ ...p, whatsapp_enabled: e.target.checked }))}
                                style={{ width: 16, height: 16, accentColor: '#4ade80' }}
                            />
                            <span style={{ fontSize: 13, color: '#a1a1aa' }}>
                                {prefs.whatsapp_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </label>
                    </div>
                    {prefs.whatsapp_enabled && (
                        <div className="dash-field">
                            <label className="dash-label">WhatsApp Number (with country code)</label>
                            <input
                                className="dash-input"
                                type="tel"
                                value={prefs.whatsapp_number}
                                onChange={e => setPrefs(p => ({ ...p, whatsapp_number: e.target.value }))}
                                placeholder="+923001234567"
                                style={{ maxWidth: 280 }}
                            />
                            <p style={{ fontSize: 11, color: '#71717a', margin: '4px 0 0' }}>
                                i WhatsApp integration uses a bot service. Numbers are kept private.
                            </p>
                        </div>
                    )}
                </div>

                {/* Email */}
                <div style={{ background: '#1a1c1a', border: '1px solid #27272a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <ToggleRow
                        icon=""
                        title="Email Notifications"
                        desc="Receive alerts via email"
                        checked={prefs.email_enabled}
                        onChange={v => setPrefs(p => ({ ...p, email_enabled: v }))}
                    />
                </div>

                {/* Alert types */}
                <div style={{ background: '#1a1c1a', border: '1px solid #27272a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 12, fontWeight: 600 }}>Alert Types</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <ToggleRow
                            icon=""
                            title="Deadline Alerts"
                            desc="Get reminded before application deadlines"
                            checked={prefs.deadline_alerts}
                            onChange={v => setPrefs(p => ({ ...p, deadline_alerts: v }))}
                        />
                        <ToggleRow
                            icon=""
                            title="Payment Reminders"
                            desc="Alerts for pending and due payments"
                            checked={prefs.payment_alerts}
                            onChange={v => setPrefs(p => ({ ...p, payment_alerts: v }))}
                        />
                        <ToggleRow
                            icon=""
                            title="Merit List Alerts"
                            desc="Notify when merit lists are announced"
                            checked={prefs.merit_list_alerts}
                            onChange={v => setPrefs(p => ({ ...p, merit_list_alerts: v }))}
                        />
                        <ToggleRow
                            icon=""
                            title="Weekly Digest"
                            desc="Summary of upcoming deadlines every week"
                            checked={prefs.weekly_digest}
                            onChange={v => setPrefs(p => ({ ...p, weekly_digest: v }))}
                        />
                    </div>
                </div>

                {/* Deadline timing */}
                {prefs.deadline_alerts && (
                    <div style={{ background: '#1a1c1a', border: '1px solid #27272a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                        <h3 style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 8, fontWeight: 600 }}>
                            Remind me before deadlines:
                        </h3>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {[30, 14, 7, 3, 1].map(day => (
                                <button
                                    key={day}
                                    onClick={() => toggleDay(day)}
                                    style={{
                                        padding: '6px 14px',
                                        border: `1px solid ${prefs.deadline_alert_days.includes(day) ? '#4ade80' : '#27272a'}`,
                                        background: prefs.deadline_alert_days.includes(day) ? 'rgba(74,222,128,0.1)' : 'transparent',
                                        color: prefs.deadline_alert_days.includes(day) ? '#4ade80' : '#71717a',
                                        borderRadius: 20,
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {day === 1 ? '1 day' : `${day} days`}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button className="dash-btn" onClick={save} disabled={saving}>
                    {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Preferences'}
                </button>
            </div>

            <div className="dash-section">
                <h2 className="dash-section-title">How Notifications Work</h2>
                <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.7 }}>
                    <p>• Deadline alerts are sent based on the deadlines you track in the Timeline tab.</p>
                    <p>• Payment reminders are triggered by due dates in your Payment Tracker.</p>
                    <p>• WhatsApp notifications require the bot to be active — this feature is coming soon.</p>
                    <p>• Email notifications are sent to your registered account email.</p>
                </div>
            </div>
        </div>
    );
}

function ToggleRow({ icon, title, desc, checked, onChange }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#e4e4e7' }}>{title}</div>
                <div style={{ fontSize: 11, color: '#71717a' }}>{desc}</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => onChange(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#4ade80' }}
                />
            </label>
        </div>
    );
}
