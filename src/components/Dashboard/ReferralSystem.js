'use client';

import { useState, useEffect } from 'react';

export default function ReferralSystem({ apiFetch, userId }) {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [copied, setCopied] = useState('');
    const [totalPoints, setTotalPoints] = useState(0);

    const load = async () => {
        const res = await apiFetch('/api/referrals');
        if (res?.referrals) {
            setReferrals(res.referrals);
            setTotalPoints(res.referrals.reduce((sum, r) => sum + (r.reward_points ?? 0), 0));
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, [apiFetch]);

    const sendReferral = async () => {
        if (!email.trim() || !email.includes('@')) return;
        setSending(true);
        const res = await apiFetch('/api/referrals', {
            method: 'POST',
            body: JSON.stringify({ referred_email: email }),
        });
        if (res?.referral) {
            setReferrals(prev => [res.referral, ...prev]);
            setEmail('');
        }
        setSending(false);
    };

    const copyCode = async (code) => {
        await navigator.clipboard.writeText(code).catch(() => {});
        setCopied(code);
        setTimeout(() => setCopied(''), 2000);
    };

    const shareLink = (code) => {
        const url = `${window.location.origin}/?ref=${code}`;
        navigator.clipboard.writeText(url).catch(() => {});
        setCopied(url);
        setTimeout(() => setCopied(''), 2000);
    };

    const STATUS_COLORS = {
        pending: '#fbbf24',
        registered: '#4ade80',
        active: '#60a5fa',
        rewarded: '#a78bfa',
    };

    if (loading) return <div className="dash-empty">Loading referrals…</div>;

    return (
        <div>
            {/* Points banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(74,222,128,0.1))',
                border: '1px solid rgba(167,139,250,0.3)',
                borderRadius: 16,
                padding: '20px 24px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
            }}>
                <div style={{ fontSize: 48 }}>👥</div>
                <div>
                    <h2 style={{ color: '#e4e4e7', fontSize: 20, margin: '0 0 4px' }}>
                        Referral Program
                    </h2>
                    <p style={{ color: '#a1a1aa', fontSize: 13, margin: '0 0 8px' }}>
                        Invite friends & siblings. Earn <strong style={{ color: '#4ade80' }}>50 points</strong> per person who joins.
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 24, fontWeight: 700, color: '#a78bfa' }}>
                            {totalPoints} pts
                        </span>
                        <span style={{ fontSize: 13, color: '#71717a', alignSelf: 'flex-end', paddingBottom: 2 }}>
                            {referrals.filter(r => r.status !== 'pending').length} successful referrals
                        </span>
                    </div>
                </div>
            </div>

            <div className="dash-section">
                <h2 className="dash-section-title">📨 Invite Someone</h2>
                <p style={{ fontSize: 13, color: '#a1a1aa', marginTop: -8, marginBottom: 16 }}>
                    Enter their email to generate a unique referral code for them.
                </p>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <input
                        className="dash-input"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="sibling@example.com"
                        onKeyDown={e => e.key === 'Enter' && sendReferral()}
                        style={{ flex: 1 }}
                    />
                    <button className="dash-btn" onClick={sendReferral} disabled={sending || !email.includes('@')} style={{ whiteSpace: 'nowrap' }}>
                        {sending ? 'Creating…' : 'Generate Code'}
                    </button>
                </div>

                {referrals.length === 0 ? (
                    <div className="dash-empty">
                        No referrals yet. Invite a sibling or friend to use IlmSeUrooj and earn points!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {referrals.map(ref => (
                            <div
                                key={ref.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '14px 16px',
                                    background: '#1a1c1a',
                                    border: '1px solid #27272a',
                                    borderRadius: 10,
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 14, color: '#e4e4e7', fontWeight: 500 }}>
                                            {ref.referred_email}
                                        </span>
                                        <span
                                            className="dash-tag"
                                            style={{ background: `${STATUS_COLORS[ref.status]}20`, color: STATUS_COLORS[ref.status] }}
                                        >
                                            {ref.status}
                                        </span>
                                        {ref.reward_points > 0 && (
                                            <span className="dash-tag dash-tag-blue">+{ref.reward_points} pts</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#71717a', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                        <code style={{ color: '#a1a1aa', fontFamily: 'monospace' }}>{ref.referral_code}</code>
                                        <span>Sent {new Date(ref.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        className="dash-btn-ghost"
                                        style={{ fontSize: 11 }}
                                        onClick={() => copyCode(ref.referral_code)}
                                    >
                                        {copied === ref.referral_code ? '✓ Copied' : 'Copy Code'}
                                    </button>
                                    <button
                                        className="dash-btn-ghost"
                                        style={{ fontSize: 11 }}
                                        onClick={() => shareLink(ref.referral_code)}
                                    >
                                        {copied.includes(ref.referral_code) && copied.includes('http') ? '✓ Copied' : 'Share Link'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="dash-section">
                <h2 className="dash-section-title">🎁 How It Works</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                        { step: '1', text: 'Generate a referral code for a friend or sibling.' },
                        { step: '2', text: 'Share the code or link with them.' },
                        { step: '3', text: 'When they register using your code, you both get credited.' },
                        { step: '4', text: 'Earn 50 points per successful referral. Points can be redeemed for premium features.' },
                    ].map(item => (
                        <div key={item.step} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: '#1a1c1a', borderRadius: 8 }}>
                            <div style={{
                                width: 24, height: 24, borderRadius: '50%',
                                background: 'rgba(167,139,250,0.2)', color: '#a78bfa',
                                fontSize: 12, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>{item.step}</div>
                            <span style={{ fontSize: 13, color: '#a1a1aa', alignSelf: 'center' }}>{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
