'use client';

import { useState, useEffect, useRef } from 'react';

const DOC_TYPES = [
    { value: 'cnic', label: 'CNIC', icon: '🪪' },
    { value: 'cnic_parent', label: "Parent's CNIC", icon: '🪪' },
    { value: 'matric_certificate', label: 'Matric Certificate', icon: '📜' },
    { value: 'matric_dmc', label: 'Matric DMC', icon: '📋' },
    { value: 'intermediate_certificate', label: 'Intermediate Certificate', icon: '📜' },
    { value: 'intermediate_dmc', label: 'Intermediate DMC', icon: '📋' },
    { value: 'domicile', label: 'Domicile Certificate', icon: '🏠' },
    { value: 'character_certificate', label: 'Character Certificate', icon: '⭐' },
    { value: 'passport_photo', label: 'Passport Photos', icon: '📷' },
    { value: 'migration_certificate', label: 'Migration Certificate', icon: '📄' },
    { value: 'hafiz_certificate', label: 'Hafiz Certificate', icon: '📖' },
    { value: 'disability_certificate', label: 'Disability Certificate', icon: '♿' },
    { value: 'other', label: 'Other', icon: '📎' },
];

const REQUIRED_DOCS = [
    'matric_dmc', 'intermediate_dmc', 'cnic', 'passport_photo', 'domicile', 'character_certificate'
];

export default function DocumentVault({ apiFetch, token }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({ document_type: 'matric_dmc', document_name: '', notes: '' });
    const fileRef = useRef(null);

    const load = async () => {
        const res = await apiFetch('/api/documents');
        if (res?.documents) setDocuments(res.documents);
        setLoading(false);
    };

    useEffect(() => { load(); }, [apiFetch]);

    const uploadDoc = async () => {
        if (!form.document_name.trim()) return;
        setUploading(true);

        let fileUrl = null;
        const file = fileRef.current?.files?.[0];

        if (file && token) {
            // Upload to Supabase Storage
            const { createClient } = await import('@supabase/supabase-js');
            const sb = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );
            const filePath = `${Date.now()}-${file.name}`;
            const { data: upData, error: upErr } = await sb.storage
                .from('user-documents')
                .upload(filePath, file, { upsert: false });

            if (!upErr && upData) {
                const { data: urlData } = sb.storage.from('user-documents').getPublicUrl(upData.path);
                fileUrl = urlData?.publicUrl ?? null;
            }
        }

        const res = await apiFetch('/api/documents', {
            method: 'POST',
            body: JSON.stringify({
                ...form,
                file_url: fileUrl,
                file_size: file?.size ?? null,
                mime_type: file?.type ?? null,
            }),
        });

        if (res?.document) {
            setDocuments(prev => [res.document, ...prev]);
            setForm({ document_type: 'matric_dmc', document_name: '', notes: '' });
            if (fileRef.current) fileRef.current.value = '';
        }
        setUploading(false);
    };

    const deleteDoc = async (id) => {
        await apiFetch(`/api/documents?id=${id}`, { method: 'DELETE' });
        setDocuments(prev => prev.filter(d => d.id !== id));
    };

    const uploadedTypes = new Set(documents.map(d => d.document_type));
    const readinessScore = Math.round(
        (REQUIRED_DOCS.filter(t => uploadedTypes.has(t)).length / REQUIRED_DOCS.length) * 100
    );

    if (loading) return <div className="dash-empty">Loading documents…</div>;

    return (
        <div>
            {/* Readiness checker */}
            <div className="dash-section">
                <h2 className="dash-section-title">✅ Document Readiness</h2>
                <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: '#a1a1aa' }}>Overall Readiness</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: readinessScore === 100 ? '#4ade80' : '#fbbf24' }}>
                            {readinessScore}%
                        </span>
                    </div>
                    <div style={{ height: 10, background: '#27272a', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${readinessScore}%`,
                            background: readinessScore === 100
                                ? 'linear-gradient(to right, #4ade80, #22d3ee)'
                                : 'linear-gradient(to right, #fbbf24, #f97316)',
                            borderRadius: 5,
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {REQUIRED_DOCS.map(type => {
                        const docType = DOC_TYPES.find(d => d.value === type);
                        const has = uploadedTypes.has(type);
                        return (
                            <span
                                key={type}
                                className={`dash-tag ${has ? 'dash-tag-green' : 'dash-tag-red'}`}
                            >
                                {has ? '✓' : '✗'} {docType?.label ?? type}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Upload form */}
            <div className="dash-section">
                <h2 className="dash-section-title">📁 Document Vault</h2>

                <div style={{
                    background: '#1a1c1a',
                    border: '1px solid #27272a',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                }}>
                    <h3 style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 12, fontWeight: 600 }}>
                        Add Document
                    </h3>
                    <div className="dash-grid-2" style={{ marginBottom: 12 }}>
                        <div className="dash-field">
                            <label className="dash-label">Document Type</label>
                            <select
                                className="dash-select"
                                value={form.document_type}
                                onChange={e => setForm(f => ({
                                    ...f,
                                    document_type: e.target.value,
                                    document_name: DOC_TYPES.find(d => d.value === e.target.value)?.label ?? '',
                                }))}
                            >
                                {DOC_TYPES.map(d => (
                                    <option key={d.value} value={d.value}>{d.icon} {d.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="dash-field">
                            <label className="dash-label">Document Name *</label>
                            <input
                                className="dash-input"
                                value={form.document_name}
                                onChange={e => setForm(f => ({ ...f, document_name: e.target.value }))}
                                placeholder="e.g. Matric DMC Attested"
                            />
                        </div>
                        <div className="dash-field">
                            <label className="dash-label">Upload File (optional)</label>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="dash-input"
                                style={{ paddingTop: 6 }}
                            />
                        </div>
                        <div className="dash-field">
                            <label className="dash-label">Notes</label>
                            <input
                                className="dash-input"
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="e.g. 2 attested copies"
                            />
                        </div>
                    </div>
                    <button
                        className="dash-btn"
                        onClick={uploadDoc}
                        disabled={uploading || !form.document_name.trim()}
                    >
                        {uploading ? 'Uploading…' : '+ Add Document'}
                    </button>
                </div>

                {documents.length === 0 ? (
                    <div className="dash-empty">No documents added yet. Start by adding your required documents above.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {DOC_TYPES.map(dtype => {
                            const typeDocs = documents.filter(d => d.document_type === dtype.value);
                            if (typeDocs.length === 0) return null;
                            return (
                                <div key={dtype.value}>
                                    <div style={{ fontSize: 11, color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                                        {dtype.icon} {dtype.label}
                                    </div>
                                    {typeDocs.map(doc => (
                                        <div
                                            key={doc.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: '10px 14px',
                                                background: '#1a1c1a',
                                                border: '1px solid #27272a',
                                                borderRadius: 8,
                                                marginBottom: 6,
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, color: '#e4e4e7', fontWeight: 500 }}>
                                                    {doc.document_name}
                                                </div>
                                                {doc.notes && (
                                                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>
                                                        {doc.notes}
                                                    </div>
                                                )}
                                                <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>
                                                    Added {new Date(doc.uploaded_at).toLocaleDateString()}
                                                    {doc.file_url && ' · File uploaded'}
                                                </div>
                                            </div>
                                            {doc.file_url && (
                                                <a
                                                    href={doc.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="dash-btn-ghost"
                                                    style={{ fontSize: 11 }}
                                                >
                                                    View
                                                </a>
                                            )}
                                            <button className="dash-btn-danger" onClick={() => deleteDoc(doc.id)}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
