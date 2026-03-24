'use client';

import { useState, useEffect } from 'react';

const UNI_LIST = [
    { id: 'comsats', name: 'COMSATS University' },
    { id: 'nust', name: 'NUST' },
    { id: 'uet', name: 'UET Lahore' },
    { id: 'pu', name: 'University of Punjab' },
    { id: 'lums', name: 'LUMS' },
    { id: 'fast', name: 'FAST-NUCES' },
    { id: 'iit', name: 'IIT' },
    { id: 'giki', name: 'GIKI' },
];

export default function FeeEstimator({ apiFetch }) {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUni, setSelectedUni] = useState('');
    const [compare, setCompare] = useState([]);
    const [semesters, setSemesters] = useState(8);
    const [hasHostel, setHasHostel] = useState(false);

    const loadFees = async (uniId) => {
        setLoading(true);
        const res = await fetch(`/api/fees?university_id=${uniId}`);
        const data = await res.json();
        if (data?.fees) setFees(data.fees);
        setLoading(false);
    };

    useEffect(() => {
        if (selectedUni) loadFees(selectedUni);
    }, [selectedUni]);

    const addToCompare = (fee) => {
        if (compare.find(c => c.id === fee.id)) return;
        if (compare.length >= 4) return;
        setCompare(prev => [...prev, fee]);
    };

    const removeCompare = (id) => setCompare(prev => prev.filter(c => c.id !== id));

    const estimateTotal = (fee) => {
        const sem = (fee.semester_fee ?? 0) * semesters;
        const hostel = hasHostel ? (fee.hostel_fee ?? 0) * semesters : 0;
        const adm = fee.admission_fee ?? 0;
        const sec = fee.security_deposit ?? 0;
        return sem + hostel + adm + sec;
    };

    return (
        <div>
            <div className="dash-section">
                <h2 className="dash-section-title">Fee Estimation Dashboard</h2>
                <p style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 16, marginTop: -8 }}>
                    Estimate your total university costs and compare across institutions.
                </p>

                {/* Calculator settings */}
                <div style={{
                    background: '#1a1c1a',
                    border: '1px solid #27272a',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                }}>
                    <h3 style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 12, fontWeight: 600 }}>
                        Calculator Settings
                    </h3>
                    <div className="dash-grid-2">
                        <div className="dash-field">
                            <label className="dash-label">Number of Semesters</label>
                            <select
                                className="dash-select"
                                value={semesters}
                                onChange={e => setSemesters(Number(e.target.value))}
                            >
                                {[4, 6, 8, 10].map(n => (
                                    <option key={n} value={n}>{n} semesters ({n / 2} years)</option>
                                ))}
                            </select>
                        </div>
                        <div className="dash-field">
                            <label className="dash-label">Include Hostel Fees</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={hasHostel}
                                    onChange={e => setHasHostel(e.target.checked)}
                                    style={{ width: 16, height: 16, accentColor: '#4ade80' }}
                                />
                                <span style={{ fontSize: 13, color: '#a1a1aa' }}>
                                    {hasHostel ? 'Yes — add hostel costs' : 'No hostel needed'}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* University selector */}
                <div className="dash-field" style={{ marginBottom: 16 }}>
                    <label className="dash-label">Select University to View Fees</label>
                    <select
                        className="dash-select"
                        value={selectedUni}
                        onChange={e => setSelectedUni(e.target.value)}
                        style={{ maxWidth: 300 }}
                    >
                        <option value="">— Choose University —</option>
                        {UNI_LIST.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>

                {loading && <div className="dash-empty">Loading fees…</div>}

                {!loading && fees.length === 0 && selectedUni && (
                    <div className="dash-empty">
                        No fee data available for this university yet.
                        <br />
                        <span style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
                            Fee data is added regularly. Check the university portal for exact figures.
                        </span>
                    </div>
                )}

                {fees.length > 0 && (
                    <div>
                        <h3 style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 12 }}>
                            Available Programs ({fees[0]?.university_name})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {fees.map(fee => {
                                const total = estimateTotal(fee);
                                return (
                                    <div
                                        key={fee.id}
                                        style={{
                                            background: '#1a1c1a',
                                            border: '1px solid #27272a',
                                            borderRadius: 12,
                                            padding: 16,
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <div>
                                                <h4 style={{ fontSize: 15, fontWeight: 600, color: '#e4e4e7', margin: 0, marginBottom: 4 }}>
                                                    {fee.program}
                                                </h4>
                                                <span className="dash-tag dash-tag-gray">
                                                    {fee.degree_level?.replace(/\b\w/g, c => c.toUpperCase()) ?? 'Undergraduate'}
                                                </span>
                                            </div>
                                            <button
                                                className="dash-btn-ghost"
                                                onClick={() => addToCompare(fee)}
                                                style={{ fontSize: 11 }}
                                            >
                                                + Compare
                                            </button>
                                        </div>
                                        <div className="dash-grid-3" style={{ gap: 8 }}>
                                            <FeeItem label="Per Semester" value={fee.semester_fee} />
                                            <FeeItem label="Admission Fee" value={fee.admission_fee} />
                                            <FeeItem label="Security Deposit" value={fee.security_deposit} />
                                            {hasHostel && <FeeItem label="Hostel/Semester" value={fee.hostel_fee} />}
                                            <FeeItem label={`Total (${semesters} sem${hasHostel ? ' + hostel' : ''})`} value={total} highlight />
                                        </div>
                                        {fee.notes && (
                                            <p style={{ fontSize: 11, color: '#71717a', marginTop: 10, marginBottom: 0 }}>
                                                i {fee.notes}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Comparison panel */}
            {compare.length > 0 && (
                <div className="dash-section">
                    <h2 className="dash-section-title">Fee Comparison</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #27272a' }}>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', color: '#71717a', fontWeight: 500 }}>
                                        Program
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '8px 12px', color: '#71717a', fontWeight: 500 }}>
                                        Per Semester
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '8px 12px', color: '#71717a', fontWeight: 500 }}>
                                        Admission
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '8px 12px', color: '#4ade80', fontWeight: 600 }}>
                                        Est. Total
                                    </th>
                                    <th style={{ padding: '8px 12px' }} />
                                </tr>
                            </thead>
                            <tbody>
                                {compare.map(fee => {
                                    const total = estimateTotal(fee);
                                    return (
                                        <tr key={fee.id} style={{ borderBottom: '1px solid #1f2520' }}>
                                            <td style={{ padding: '10px 12px', color: '#e4e4e7' }}>
                                                <div style={{ fontWeight: 500 }}>{fee.university_name}</div>
                                                <div style={{ color: '#71717a', fontSize: 11 }}>{fee.program}</div>
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#a1a1aa' }}>
                                                Rs {(fee.semester_fee ?? 0).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#a1a1aa' }}>
                                                Rs {(fee.admission_fee ?? 0).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#4ade80', fontWeight: 700 }}>
                                                Rs {total.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <button className="dash-btn-danger" onClick={() => removeCompare(fee.id)}>✕</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p style={{ fontSize: 11, color: '#71717a', marginTop: 12 }}>
                        * Estimates for {semesters} semesters{hasHostel ? ' including hostel' : ''}. Actual fees may vary. Always verify with the university portal.
                    </p>
                </div>
            )}
        </div>
    );
}

function FeeItem({ label, value, highlight }) {
    return (
        <div style={{
            background: highlight ? 'rgba(74,222,128,0.06)' : '#0c0e0b',
            border: `1px solid ${highlight ? 'rgba(74,222,128,0.2)' : '#1f2520'}`,
            borderRadius: 8,
            padding: '8px 10px',
        }}>
            <div style={{ fontSize: 10, color: '#71717a', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: highlight ? 700 : 500, color: highlight ? '#4ade80' : '#e4e4e7' }}>
                {value ? `Rs ${Number(value).toLocaleString()}` : '—'}
            </div>
        </div>
    );
}
