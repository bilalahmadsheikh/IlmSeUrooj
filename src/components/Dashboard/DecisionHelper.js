'use client';

import { useState, useEffect } from 'react';

const STATUSES = [
    { value: 'applied', label: 'Applied', color: '#60a5fa' },
    { value: 'test_scheduled', label: 'Test Scheduled', color: '#a78bfa' },
    { value: 'test_given', label: 'Test Given', color: '#818cf8' },
    { value: 'awaiting_merit', label: 'Awaiting Merit List', color: '#fbbf24' },
    { value: 'selected', label: 'Selected (Merit)', color: '#34d399' },
    { value: 'waitlisted', label: 'Waitlisted', color: '#fb923c' },
    { value: 'rejected', label: 'Rejected', color: '#ef4444' },
    { value: 'accepted', label: 'Offer Accepted', color: '#4ade80' },
    { value: 'declined', label: 'Offer Declined', color: '#71717a' },
    { value: 'enrolled', label: 'Enrolled ✓', color: '#4ade80' },
];

export default function DecisionHelper({ apiFetch }) {
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        university_name: '',
        program: '',
        decision_status: 'applied',
        merit_position: '',
        deadline_to_respond: '',
        financial_aid_offered: false,
        financial_aid_amount: '',
        notes: '',
    });

    const load = async () => {
        const res = await apiFetch('/api/decisions');
        if (res?.decisions) setDecisions(res.decisions);
        setLoading(false);
    };

    useEffect(() => { load(); }, [apiFetch]);

    const addDecision = async () => {
        if (!form.university_name || !form.program) return;
        const res = await apiFetch('/api/decisions', {
            method: 'POST',
            body: JSON.stringify({
                ...form,
                university_id: form.university_name.toLowerCase().replace(/\s+/g, '_'),
                merit_position: form.merit_position ? Number(form.merit_position) : null,
                financial_aid_amount: form.financial_aid_amount ? Number(form.financial_aid_amount) : null,
            }),
        });
        if (res?.decision) {
            setDecisions(prev => [res.decision, ...prev]);
            setForm({ university_name: '', program: '', decision_status: 'applied', merit_position: '', deadline_to_respond: '', financial_aid_offered: false, financial_aid_amount: '', notes: '' });
            setShowForm(false);
        }
    };

    const updateStatus = async (id, decision_status) => {
        const res = await apiFetch('/api/decisions', {
            method: 'PUT',
            body: JSON.stringify({ id, decision_status }),
        });
        if (res?.decision) setDecisions(prev => prev.map(d => d.id === id ? res.decision : d));
    };

    const setFinalChoice = async (id) => {
        const res = await apiFetch('/api/decisions', {
            method: 'PUT',
            body: JSON.stringify({ id, is_final_choice: true, decision_status: 'accepted' }),
        });
        if (res?.decision) {
            setDecisions(prev => prev.map(d => ({
                ...d,
                is_final_choice: d.id === id,
                decision_status: d.id === id ? 'accepted' : d.decision_status,
            })));
        }
    };

    const deleteDecision = async (id) => {
        await apiFetch(`/api/decisions?id=${id}`, { method: 'DELETE' });
        setDecisions(prev => prev.filter(d => d.id !== id));
    };

    const finalChoice = decisions.find(d => d.is_final_choice);
    const accepted = decisions.filter(d => d.decision_status === 'accepted' || d.decision_status === 'selected');

    if (loading) return <div className="dash-empty">Loading decisions…</div>;

    return (
        <div>
            {finalChoice && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(34,211,238,0.1))',
                    border: '1px solid rgba(74,222,128,0.3)',
                    borderRadius: 16,
                    padding: '20px 24px',
                    marginBottom: 20,
                    textAlign: 'center',
                }}>
                    <h3 style={{ color: '#4ade80', fontSize: 18, margin: '0 0 4px' }}>Final Choice Made!</h3>
                    <p style={{ color: '#a1a1aa', fontSize: 14, margin: 0 }}>
                        <strong style={{ color: '#e4e4e7' }}>{finalChoice.university_name}</strong> — {finalChoice.program}
                    </p>
                </div>
            )}

            <div className="dash-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 className="dash-section-title" style={{ marginBottom: 0 }}>Post-Admission Decision Helper</h2>
                    <button className="dash-btn" onClick={() => setShowForm(!showForm)}>
                        {showForm ? '✕ Cancel' : '+ Add Application'}
                    </button>
                </div>

                {accepted.length > 1 && !finalChoice && (
                    <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#fbbf24' }}>
                        You have <strong>{accepted.length} offers</strong>. Mark your final choice to proceed with enrollment.
                    </div>
                )}

                {showForm && (
                    <div style={{ background: '#1a1c1a', border: '1px solid #27272a', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                        <div className="dash-grid-2" style={{ marginBottom: 12 }}>
                            <div className="dash-field">
                                <label className="dash-label">University *</label>
                                <input className="dash-input" value={form.university_name} onChange={e => setForm(f => ({ ...f, university_name: e.target.value }))} placeholder="e.g. COMSATS" />
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Program *</label>
                                <input className="dash-input" value={form.program} onChange={e => setForm(f => ({ ...f, program: e.target.value }))} placeholder="e.g. BS Computer Science" />
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Status</label>
                                <select className="dash-select" value={form.decision_status} onChange={e => setForm(f => ({ ...f, decision_status: e.target.value }))}>
                                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Merit Position</label>
                                <input className="dash-input" type="number" value={form.merit_position} onChange={e => setForm(f => ({ ...f, merit_position: e.target.value }))} placeholder="e.g. 45" />
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Response Deadline</label>
                                <input type="date" className="dash-input" value={form.deadline_to_respond} onChange={e => setForm(f => ({ ...f, deadline_to_respond: e.target.value }))} />
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Financial Aid Amount (PKR)</label>
                                <input className="dash-input" type="number" value={form.financial_aid_amount} onChange={e => setForm(f => ({ ...f, financial_aid_amount: e.target.value }))} placeholder="0 if none" />
                            </div>
                            <div className="dash-field" style={{ gridColumn: '1/-1' }}>
                                <label className="dash-label">Notes</label>
                                <input className="dash-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this offer" />
                            </div>
                        </div>
                        <button className="dash-btn" onClick={addDecision}>Add Application</button>
                    </div>
                )}

                {decisions.length === 0 ? (
                    <div className="dash-empty">No applications tracked yet. Add your university applications to track their status.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {decisions.map(dec => {
                            const statusObj = STATUSES.find(s => s.value === dec.decision_status) ?? STATUSES[0];
                            const deadline = dec.deadline_to_respond ? new Date(dec.deadline_to_respond + 'T00:00:00') : null;
                            const deadlineOverdue = deadline && deadline < new Date();
                            return (
                                <div
                                    key={dec.id}
                                    style={{
                                        background: dec.is_final_choice
                                            ? 'linear-gradient(135deg, rgba(74,222,128,0.08), rgba(34,211,238,0.04))'
                                            : '#1a1c1a',
                                        border: `1px solid ${dec.is_final_choice ? 'rgba(74,222,128,0.3)' : '#27272a'}`,
                                        borderRadius: 12,
                                        padding: 16,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e4e4e7', margin: 0 }}>
                                                    {dec.university_name}
                                                </h3>
                                                {dec.is_final_choice && <span className="dash-tag dash-tag-green">★ Final Choice</span>}
                                            </div>
                                            <p style={{ fontSize: 13, color: '#a1a1aa', margin: 0 }}>{dec.program}</p>
                                        </div>
                                        <span
                                            className="dash-tag"
                                            style={{ background: `${statusObj.color}20`, color: statusObj.color }}
                                        >
                                            {statusObj.label}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, fontSize: 12, color: '#71717a' }}>
                                        {dec.merit_position && <span>Merit: #{dec.merit_position}</span>}
                                        {dec.financial_aid_amount > 0 && (
                                            <span style={{ color: '#4ade80' }}>Aid: Rs {Number(dec.financial_aid_amount).toLocaleString()}</span>
                                        )}
                                        {deadline && (
                                            <span style={{ color: deadlineOverdue ? '#ef4444' : '#71717a' }}>
                                                {deadlineOverdue ? '! ' : ''}
                                                Respond by: {deadline.toLocaleDateString()}
                                            </span>
                                        )}
                                        {dec.notes && <span>{dec.notes}</span>}
                                    </div>

                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {/* Quick status update */}
                                        <select
                                            className="dash-select"
                                            style={{ fontSize: 12, padding: '5px 10px' }}
                                            value={dec.decision_status}
                                            onChange={e => updateStatus(dec.id, e.target.value)}
                                        >
                                            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                        {!dec.is_final_choice && (dec.decision_status === 'selected' || dec.decision_status === 'accepted') && (
                                            <button
                                                className="dash-btn"
                                                style={{ fontSize: 12, padding: '5px 12px' }}
                                                onClick={() => setFinalChoice(dec.id)}
                                            >
                                                ★ Set as Final Choice
                                            </button>
                                        )}
                                        <button className="dash-btn-danger" onClick={() => deleteDecision(dec.id)}>✕</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Decision guide */}
            <div className="dash-section">
                <h2 className="dash-section-title">Decision Guide</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                        { num: '1.', tip: 'Compare fees and scholarships across all your offers before deciding.' },
                        { num: '2.', tip: 'Check the deadline to respond. Late responses may forfeit your seat.' },
                        { num: '3.', tip: 'Confirm hostel availability separately — seats fill fast.' },
                        { num: '4.', tip: 'Once enrolled, submit your fee challan within the specified timeframe.' },
                        { num: '5.', tip: 'Keep attested document copies ready — you will need them on the first day.' },
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: '#1a1c1a', borderRadius: 8, fontSize: 13 }}>
                            <span style={{ fontSize: 14, color: '#a1a1aa', minWidth: 20 }}>{item.num}</span>
                            <span style={{ color: '#a1a1aa' }}>{item.tip}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
