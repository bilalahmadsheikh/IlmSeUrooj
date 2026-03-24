'use client';

import { useState, useEffect } from 'react';

const PAYMENT_TYPES = ['application_fee', 'admission_fee', 'semester_fee', 'hostel_fee', 'transport_fee', 'security_deposit', 'other'];
const METHODS = ['bank_transfer', 'online', 'cash', 'cheque', 'other'];
const STATUS_COLORS = { pending: '#fbbf24', paid: '#4ade80', failed: '#ef4444', refunded: '#60a5fa' };

export default function PaymentTracker({ apiFetch }) {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        university_name: '',
        payment_type: 'application_fee',
        amount: '',
        currency: 'PKR',
        status: 'pending',
        payment_method: 'online',
        reference_number: '',
        due_date: '',
        paid_at: '',
        notes: '',
    });

    const load = async () => {
        const res = await apiFetch('/api/payments');
        if (res?.payments) setPayments(res.payments);
        setLoading(false);
    };

    useEffect(() => { load(); }, [apiFetch]);

    const addPayment = async () => {
        if (!form.university_name || !form.amount) return;
        const res = await apiFetch('/api/payments', {
            method: 'POST',
            body: JSON.stringify({ ...form, university_id: form.university_name.toLowerCase().replace(/\s+/g, '_'), amount: Number(form.amount) }),
        });
        if (res?.payment) {
            setPayments(prev => [...prev, res.payment]);
            setForm({ university_name: '', payment_type: 'application_fee', amount: '', currency: 'PKR', status: 'pending', payment_method: 'online', reference_number: '', due_date: '', paid_at: '', notes: '' });
            setShowForm(false);
        }
    };

    const markPaid = async (payment) => {
        const res = await apiFetch('/api/payments', {
            method: 'PUT',
            body: JSON.stringify({ id: payment.id, status: 'paid', paid_at: new Date().toISOString().split('T')[0] }),
        });
        if (res?.payment) setPayments(prev => prev.map(p => p.id === payment.id ? res.payment : p));
    };

    const deletePayment = async (id) => {
        await apiFetch(`/api/payments?id=${id}`, { method: 'DELETE' });
        setPayments(prev => prev.filter(p => p.id !== id));
    };

    const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
    const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
    const overdue = payments.filter(p => p.status === 'pending' && p.due_date && new Date(p.due_date) < new Date());

    if (loading) return <div className="dash-empty">Loading payments…</div>;

    return (
        <div>
            {overdue.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#ef4444' }}>
                    <strong>! {overdue.length} overdue payment{overdue.length > 1 ? 's' : ''}!</strong> Deadlines have passed.
                </div>
            )}

            {/* Summary */}
            <div className="dash-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 className="dash-section-title" style={{ marginBottom: 0 }}>Payment Tracker</h2>
                    <button className="dash-btn" onClick={() => setShowForm(!showForm)}>
                        {showForm ? '✕ Cancel' : '+ Add Payment'}
                    </button>
                </div>

                <div className="dash-grid-3" style={{ marginBottom: 20 }}>
                    <div className="dash-stat-card">
                        <div className="dash-stat-value" style={{ fontSize: 20 }}>Rs {totalPaid.toLocaleString()}</div>
                        <div className="dash-stat-label">Total Paid</div>
                    </div>
                    <div className="dash-stat-card">
                        <div className="dash-stat-value" style={{ fontSize: 20, color: '#fbbf24' }}>Rs {totalPending.toLocaleString()}</div>
                        <div className="dash-stat-label">Pending</div>
                    </div>
                    <div className="dash-stat-card">
                        <div className="dash-stat-value" style={{ fontSize: 20 }}>{payments.length}</div>
                        <div className="dash-stat-label">Total Records</div>
                    </div>
                </div>

                {showForm && (
                    <div style={{ background: '#1a1c1a', border: '1px solid #27272a', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                        <div className="dash-grid-2" style={{ marginBottom: 12 }}>
                            <div className="dash-field">
                                <label className="dash-label">University *</label>
                                <input className="dash-input" value={form.university_name} onChange={e => setForm(f => ({ ...f, university_name: e.target.value }))} placeholder="e.g. COMSATS" />
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Payment Type</label>
                                <select className="dash-select" value={form.payment_type} onChange={e => setForm(f => ({ ...f, payment_type: e.target.value }))}>
                                    {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                </select>
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Amount (PKR) *</label>
                                <input className="dash-input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 5000" />
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Payment Method</label>
                                <select className="dash-select" value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                                    {METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                </select>
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Due Date</label>
                                <input type="date" className="dash-input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Reference / Transaction ID</label>
                                <input className="dash-input" value={form.reference_number} onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))} placeholder="Optional" />
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Status</label>
                                <select className="dash-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                    {['pending', 'paid', 'failed', 'refunded'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Notes</label>
                                <input className="dash-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
                            </div>
                        </div>
                        <button className="dash-btn" onClick={addPayment}>Add Payment Record</button>
                    </div>
                )}

                {payments.length === 0 ? (
                    <div className="dash-empty">No payments recorded yet. Add application fees, admission fees, etc.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {payments.map(pay => {
                            const isOverdue = pay.status === 'pending' && pay.due_date && new Date(pay.due_date) < new Date();
                            return (
                                <div
                                    key={pay.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '14px 16px',
                                        background: '#1a1c1a',
                                        border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : '#27272a'}`,
                                        borderRadius: 10,
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>
                                                {pay.university_name}
                                            </span>
                                            <span
                                                className="dash-tag"
                                                style={{
                                                    background: `${STATUS_COLORS[pay.status]}20`,
                                                    color: STATUS_COLORS[pay.status],
                                                }}
                                            >
                                                {pay.status}
                                            </span>
                                            {isOverdue && <span className="dash-tag dash-tag-red">OVERDUE</span>}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#71717a', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                            <span>{pay.payment_type?.replace(/_/g, ' ')}</span>
                                            <span style={{ color: '#4ade80', fontWeight: 600 }}>Rs {Number(pay.amount).toLocaleString()}</span>
                                            {pay.due_date && <span>Due: {new Date(pay.due_date + 'T00:00:00').toLocaleDateString()}</span>}
                                            {pay.reference_number && <span>Ref: {pay.reference_number}</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {pay.status === 'pending' && (
                                            <button className="dash-btn" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => markPaid(pay)}>
                                                Mark Paid
                                            </button>
                                        )}
                                        <button className="dash-btn-danger" onClick={() => deletePayment(pay.id)}>✕</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
