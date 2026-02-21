'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PROFILE_FIELDS = [
    { key: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Muhammad Ahmed Khan', required: true },
    { key: 'father_name', label: "Father's Name", type: 'text', placeholder: 'Muhammad Khan' },
    { key: 'cnic', label: 'CNIC', type: 'text', placeholder: '35201-1234567-1' },
    { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
    {
        key: 'gender', label: 'Gender', type: 'select', options: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
        ]
    },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'student@example.com', required: true },
    { key: 'phone', label: 'Phone', type: 'tel', placeholder: '0300-1234567' },
    { key: 'address', label: 'Address', type: 'text', placeholder: 'House #, Street, Area' },
    { key: 'city', label: 'City', type: 'text', placeholder: 'Lahore' },
    {
        key: 'province', label: 'Province', type: 'select', options: [
            { value: 'Punjab', label: 'Punjab' },
            { value: 'Sindh', label: 'Sindh' },
            { value: 'KPK', label: 'KPK' },
            { value: 'Balochistan', label: 'Balochistan' },
            { value: 'ICT', label: 'ICT' },
            { value: 'AJK', label: 'AJK' },
            { value: 'GB', label: 'Gilgit-Baltistan' },
        ]
    },
];

const ACADEMIC_FIELDS = [
    { key: 'board_name', label: 'Board', type: 'text', placeholder: 'BISE Lahore' },
    { key: 'passing_year', label: 'Passing Year', type: 'number', placeholder: '2024' },
    { key: 'school_name', label: 'School/College', type: 'text', placeholder: 'Govt. College Lahore' },
    { key: 'fsc_marks', label: 'FSc Marks Obtained', type: 'number', placeholder: '980' },
    { key: 'fsc_total', label: 'FSc Total Marks', type: 'number', placeholder: '1100' },
    { key: 'matric_marks', label: 'Matric Marks Obtained', type: 'number', placeholder: '1020' },
    { key: 'matric_total', label: 'Matric Total Marks', type: 'number', placeholder: '1050' },
];

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [authMode, setAuthMode] = useState('signin');
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [profile, setProfile] = useState({});
    const [completeness, setCompleteness] = useState(0);

    // Check auth on mount
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data?.session?.user) {
                setUser(data.session.user);
                loadProfile(data.session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser(session.user);
                loadProfile(session.user.id);
            } else {
                setUser(null);
                setProfile({});
                setLoading(false);
            }
        });

        return () => subscription?.unsubscribe();
    }, []);

    // Calculate completeness
    useEffect(() => {
        const allFields = [...PROFILE_FIELDS, ...ACADEMIC_FIELDS];
        const filled = allFields.filter(f => profile[f.key] && String(profile[f.key]).trim() !== '').length;
        setCompleteness(Math.round((filled / allFields.length) * 100));
    }, [profile]);

    async function loadProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                setProfile(data);
            } else if (error && error.code !== 'PGRST116') {
                console.error('Profile load error:', error);
            }
        } catch (e) {
            console.error('Failed to load profile:', e);
        }
        setLoading(false);
    }

    async function handleAuth(e) {
        e.preventDefault();
        setAuthError('');
        setAuthLoading(true);
        try {
            let result;
            if (authMode === 'signup') {
                result = await supabase.auth.signUp({ email: authEmail, password: authPassword });
            } else {
                result = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
            }
            if (result.error) throw result.error;
            // Auth state change listener will handle the rest
        } catch (err) {
            setAuthError(err.message || 'Authentication failed');
        }
        setAuthLoading(false);
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setSaved(false);
        setSaveError('');

        try {
            // Build clean payload with only valid columns
            const payload = {};
            for (const f of [...PROFILE_FIELDS, ...ACADEMIC_FIELDS]) {
                if (profile[f.key] !== undefined && profile[f.key] !== '') {
                    // Convert numeric fields
                    if (f.type === 'number') {
                        payload[f.key] = parseInt(profile[f.key], 10) || null;
                    } else {
                        payload[f.key] = profile[f.key];
                    }
                }
            }

            // Calculate percentages
            if (payload.fsc_marks && payload.fsc_total) {
                payload.fsc_percentage = ((payload.fsc_marks / payload.fsc_total) * 100).toFixed(2);
            }
            if (payload.matric_marks && payload.matric_total) {
                payload.matric_percentage = ((payload.matric_marks / payload.matric_total) * 100).toFixed(2);
            }

            payload.updated_at = new Date().toISOString();

            // Upsert — id is the auth user's UUID
            const { error } = await supabase
                .from('profiles')
                .upsert(
                    { id: user.id, ...payload },
                    { onConflict: 'id' }
                );

            if (error) {
                throw error;
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Save failed:', err);
            setSaveError(err.message || 'Failed to save profile');
        }
        setSaving(false);
    }

    async function handleSignOut() {
        await supabase.auth.signOut();
        setUser(null);
        setProfile({});
    }

    function updateField(key, value) {
        setProfile(prev => ({ ...prev, [key]: value }));
    }

    // Auth screen
    if (!user && !loading) {
        return (
            <div className="pf-page">
                <style jsx>{pageStyles}</style>
                <nav className="pf-nav">
                    <Link href="/" className="pf-brand">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c6 3 10 3 16 0v-5" />
                        </svg>
                        UniMatch
                    </Link>
                    <div className="pf-nav-links">
                        <Link href="/">Home</Link>
                        <Link href="/extension">Extension</Link>
                    </div>
                </nav>

                <div className="auth-card">
                    <h2>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
                    <p className="auth-sub">
                        {authMode === 'signin'
                            ? 'Sign in to manage your profile and autofill applications.'
                            : 'Create an account to start autofilling university applications.'}
                    </p>
                    <form onSubmit={handleAuth}>
                        <div className="field-group">
                            <label>Email</label>
                            <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                                placeholder="your@email.com" required />
                        </div>
                        <div className="field-group">
                            <label>Password</label>
                            <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                                placeholder="••••••••" required minLength={6} />
                        </div>
                        {authError && <div className="auth-error">{authError}</div>}
                        <button type="submit" className="btn-primary-pf" disabled={authLoading}>
                            {authLoading ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>
                    <button className="auth-toggle" onClick={() => setAuthMode(m => m === 'signin' ? 'signup' : 'signin')}>
                        {authMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="pf-page">
                <style jsx>{pageStyles}</style>
                <div className="loading-center"><div className="spinner-pf"></div></div>
            </div>
        );
    }

    // Profile form
    return (
        <div className="pf-page">
            <style jsx>{pageStyles}</style>
            <nav className="pf-nav">
                <Link href="/" className="pf-brand">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c6 3 10 3 16 0v-5" />
                    </svg>
                    UniMatch
                </Link>
                <div className="pf-nav-links">
                    <Link href="/">Home</Link>
                    <Link href="/extension">Extension</Link>
                    <Link href="/applications">Dashboard</Link>
                    <button onClick={handleSignOut} className="btn-signout">Sign Out</button>
                </div>
            </nav>

            <div className="pf-header">
                <div className="pf-avatar">{profile.full_name?.charAt(0)?.toUpperCase() || '?'}</div>
                <div>
                    <h1>{profile.full_name || 'Your Profile'}</h1>
                    <p className="pf-email">{user.email}</p>
                </div>
                <div className="pf-completeness">
                    <div className="pf-bar-container">
                        <div className="pf-bar" style={{ width: `${completeness}%` }}></div>
                    </div>
                    <span>{completeness}% complete</span>
                </div>
            </div>

            <form onSubmit={handleSave}>
                <div className="section-card">
                    <h2 className="section-title">👤 Personal Information</h2>
                    <div className="field-grid">
                        {PROFILE_FIELDS.map(f => (
                            <div className="field-group" key={f.key}>
                                <label>{f.label}{f.required && <span className="req">*</span>}</label>
                                {f.type === 'select' ? (
                                    <select value={profile[f.key] || ''} onChange={e => updateField(f.key, e.target.value)}>
                                        <option value="">Select...</option>
                                        {f.options.map(o => (
                                            <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
                                                {typeof o === 'string' ? o : o.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input type={f.type} value={profile[f.key] || ''} onChange={e => updateField(f.key, e.target.value)}
                                        placeholder={f.placeholder || ''} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section-card">
                    <h2 className="section-title">📚 Academic Information</h2>
                    <div className="field-grid">
                        {ACADEMIC_FIELDS.map(f => (
                            <div className="field-group" key={f.key}>
                                <label>{f.label}</label>
                                <input type={f.type} value={profile[f.key] || ''} onChange={e => updateField(f.key, e.target.value)}
                                    placeholder={f.placeholder || ''} />
                            </div>
                        ))}
                    </div>
                    {profile.fsc_marks && profile.fsc_total && (
                        <div className="calc-row">
                            FSc Percentage: <strong>{((profile.fsc_marks / profile.fsc_total) * 100).toFixed(1)}%</strong>
                        </div>
                    )}
                    {profile.matric_marks && profile.matric_total && (
                        <div className="calc-row">
                            Matric Percentage: <strong>{((profile.matric_marks / profile.matric_total) * 100).toFixed(1)}%</strong>
                        </div>
                    )}
                </div>

                {saveError && (
                    <div className="save-error">{saveError}</div>
                )}

                <div className="save-bar">
                    <button type="submit" className="btn-primary-pf" disabled={saving}>
                        {saving ? 'Saving...' : saved ? '✓ Profile Saved!' : '💾 Save Profile'}
                    </button>
                    <p className="save-hint">Your profile is used by the extension to autofill university forms.</p>
                </div>
            </form>
        </div>
    );
}

const pageStyles = `
  .pf-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0c0e0b 0%, #1a1d1a 50%, #0c0e0b 100%);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #e4e4e7;
    padding: 0 20px 60px;
    max-width: 800px;
    margin: 0 auto;
  }
  .pf-nav {
    display: flex; align-items: center; justify-content: space-between; padding: 20px 0;
  }
  .pf-brand {
    display: flex; align-items: center; gap: 8px;
    font-size: 20px; font-weight: 700; color: #4ade80; text-decoration: none;
  }
  .pf-nav-links { display: flex; align-items: center; gap: 12px; }
  .pf-nav-links a {
    color: #a1a1aa; font-size: 13px; text-decoration: none;
    padding: 6px 12px; border-radius: 8px; transition: all 0.2s;
  }
  .pf-nav-links a:hover { color: #e4e4e7; background: rgba(255,255,255,0.06); }
  .btn-signout {
    background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2);
    padding: 6px 14px; border-radius: 8px; font-size: 12px; cursor: pointer; font-family: inherit;
  }
  .btn-signout:hover { background: rgba(239,68,68,0.2); }

  .pf-header {
    display: flex; align-items: center; gap: 16px; padding: 24px 0 32px;
    flex-wrap: wrap;
  }
  .pf-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(74,222,128,0.15); color: #4ade80;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 24px; flex-shrink: 0;
  }
  .pf-header h1 { font-size: 24px; margin: 0; }
  .pf-email { font-size: 13px; color: #a1a1aa; margin: 2px 0 0; }
  .pf-completeness {
    margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
  }
  .pf-completeness span { font-size: 11px; color: #a1a1aa; }
  .pf-bar-container {
    width: 120px; height: 6px; background: #27272a; border-radius: 3px; overflow: hidden;
  }
  .pf-bar {
    height: 100%; background: linear-gradient(90deg, #4ade80, #22c55e);
    border-radius: 3px; transition: width 0.3s ease;
  }

  .section-card {
    background: rgba(22,25,22,0.8); border: 1px solid #27272a;
    border-radius: 16px; padding: 24px; margin-bottom: 20px;
  }
  .section-title { font-size: 16px; font-weight: 600; margin: 0 0 20px; }

  .field-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  @media (max-width: 600px) { .field-grid { grid-template-columns: 1fr; } }

  .field-group { display: flex; flex-direction: column; gap: 4px; }
  .field-group label {
    font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .req { color: #ef4444; margin-left: 2px; }
  .field-group input, .field-group select {
    padding: 10px 12px; background: #0c0e0b; border: 1px solid #27272a;
    border-radius: 8px; color: #e4e4e7; font-size: 13px; font-family: inherit;
    outline: none; transition: border-color 0.2s; box-sizing: border-box; width: 100%;
  }
  .field-group input:focus, .field-group select:focus {
    border-color: #4ade80; box-shadow: 0 0 0 2px rgba(74,222,128,0.15);
  }
  .field-group input::placeholder { color: #555; }

  .calc-row {
    margin-top: 12px; padding: 8px 12px; background: rgba(74,222,128,0.06);
    border-radius: 8px; font-size: 12px; color: #a1a1aa;
  }
  .calc-row strong { color: #4ade80; }

  .save-bar {
    text-align: center; padding: 20px 0;
  }
  .save-error {
    background: rgba(239,68,68,0.1); color: #ef4444; padding: 10px 14px;
    border-radius: 8px; font-size: 13px; margin-bottom: 12px; text-align: center;
    border: 1px solid rgba(239,68,68,0.2);
  }
  .btn-primary-pf {
    padding: 12px 40px; background: #4ade80; color: #0c0e0b;
    border: none; border-radius: 10px; font-size: 15px; font-weight: 700;
    cursor: pointer; transition: all 0.2s; font-family: inherit;
  }
  .btn-primary-pf:hover { background: #22c55e; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(74,222,128,0.3); }
  .btn-primary-pf:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .save-hint { font-size: 11px; color: #71717a; margin-top: 8px; }

  .auth-card {
    max-width: 400px; margin: 80px auto; padding: 32px;
    background: rgba(22,25,22,0.9); border: 1px solid #27272a;
    border-radius: 16px; text-align: center;
  }
  .auth-card h2 { font-size: 22px; margin: 0 0 6px; }
  .auth-sub { font-size: 13px; color: #a1a1aa; margin: 0 0 24px; }
  .auth-card form { text-align: left; }
  .auth-card .field-group { margin-bottom: 14px; }
  .auth-error {
    background: rgba(239,68,68,0.1); color: #ef4444; padding: 8px 12px;
    border-radius: 8px; font-size: 12px; margin-bottom: 12px;
  }
  .auth-card .btn-primary-pf { width: 100%; margin-top: 4px; }
  .auth-toggle {
    background: none; border: none; color: #4ade80; font-size: 12px;
    cursor: pointer; margin-top: 16px; font-family: inherit;
  }
  .auth-toggle:hover { text-decoration: underline; }

  .loading-center { display: flex; justify-content: center; padding: 120px; }
  .spinner-pf {
    width: 32px; height: 32px; border: 3px solid #27272a; border-top-color: #4ade80;
    border-radius: 50%; animation: pf-spin 0.8s linear infinite;
  }
  @keyframes pf-spin { to { transform: rotate(360deg); } }
`;
