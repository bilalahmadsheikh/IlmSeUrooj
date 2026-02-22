'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── Board Dropdown Options ────────────────────────────────────
const BOARDS = [
    'FBISE', 'BISE Lahore', 'BISE Karachi', 'BISE Rawalpindi',
    'BISE Multan', 'BISE Faisalabad', 'BISE Sargodha', 'BISE Gujranwala',
    'BISE Bahawalpur', 'BISE Sahiwal', 'BISE DG Khan', 'BISE Mirpur',
    'BISE Hyderabad', 'BISE Sukkur', 'BPTE', 'AJK Board', 'Other'
];

const PROVINCES = [
    'Punjab', 'Sindh', 'KPK', 'Balochistan', 'ICT', 'AJK', 'Gilgit-Baltistan'
];

const ALEVEL_SUBJECTS = [
    'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Further Mathematics',
    'Computer Science', 'Economics', 'Accounting', 'Business Studies',
    'Psychology', 'English Literature', 'Urdu', 'Pakistan Studies'
];

// ─── Required fields for completion calculation ────────────────
const REQUIRED_FIELDS = [
    'full_name', 'father_name', 'cnic', 'date_of_birth', 'gender',
    'email', 'phone', 'city', 'province', 'domicile_province',
    'education_system', 'portal_email', 'portal_password',
];

function calculateCompletion(profile) {
    const filled = REQUIRED_FIELDS.filter(f =>
        profile[f] !== null && profile[f] !== undefined && profile[f] !== ''
    ).length;
    return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

// ─── Password Generator ───────────────────────────────────────
function generatePortalPassword(fullName, cnic) {
    const first = (fullName || 'Student').split(' ')[0];
    const suffix = (cnic || '').replace(/[^0-9]/g, '').slice(-4) || '0000';
    const symbols = ['#', '@', '!', '$'];
    const sym = symbols[Math.floor(Math.random() * symbols.length)];
    const year = new Date().getFullYear();
    return `${first}${suffix}${sym}${year}`;
}

// ─── Components ───────────────────────────────────────────────

function SectionCard({ title, icon, children, note }) {
    return (
        <div className="section-card">
            <h2 className="section-title">{icon} {title}</h2>
            {note && <div className="section-note">{note}</div>}
            {children}
        </div>
    );
}

function Field({ label, type = 'text', value, onChange, placeholder, required, options, disabled, hint, className }) {
    return (
        <div className={`field-group ${className || ''}`}>
            <label>{label}{required && <span className="req">*</span>}</label>
            {type === 'select' ? (
                <select value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled}>
                    <option value="">Select...</option>
                    {options?.map(o => (
                        <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
                            {typeof o === 'string' ? o : o.label}
                        </option>
                    ))}
                </select>
            ) : type === 'textarea' ? (
                <textarea value={value || ''} onChange={e => onChange(e.target.value)}
                    placeholder={placeholder || ''} disabled={disabled} rows={3} />
            ) : (
                <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
                    placeholder={placeholder || ''} disabled={disabled} />
            )}
            {hint && <span className="field-hint">{hint}</span>}
        </div>
    );
}

function WarningBox({ children, type = 'warning' }) {
    const colors = {
        warning: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', icon: '⚠️' },
        info: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', icon: 'ℹ️' },
        success: { bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)', icon: '✅' },
    };
    const c = colors[type] || colors.warning;
    return (
        <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: '12px 16px', margin: '12px 0', fontSize: 12, color: '#d4d4d8', lineHeight: 1.5 }}>
            {c.icon} {children}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

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
    const [showPassword, setShowPassword] = useState(false);
    const saveTimerRef = useRef(null);

    const completeness = calculateCompletion(profile);

    // ─── Auth ─────────────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data?.session?.user) {
                setUser(data.session.user);
                loadProfile(data.session.user.id);
            } else {
                setLoading(false);
            }
        });
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

    async function loadProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles').select('*').eq('id', userId).single();
            if (data) {
                // Generate portal password on first load if missing
                if (!data.portal_password) {
                    data.portal_password = generatePortalPassword(data.full_name, data.cnic);
                }
                if (!data.portal_email) {
                    data.portal_email = data.email || '';
                }
                setProfile(data);
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
        } catch (err) {
            setAuthError(err.message || 'Authentication failed');
        }
        setAuthLoading(false);
    }

    // ─── Update + Auto-save ──────────────────────────────────
    const updateField = useCallback((key, value) => {
        setProfile(prev => {
            const updated = { ...prev, [key]: value };

            // Auto-calc percentages
            if ((key === 'fsc_marks' || key === 'fsc_total') && updated.fsc_marks && updated.fsc_total) {
                updated.fsc_percentage = ((updated.fsc_marks / updated.fsc_total) * 100).toFixed(2);
            }
            if ((key === 'matric_marks' || key === 'matric_total') && updated.matric_marks && updated.matric_total) {
                updated.matric_percentage = ((updated.matric_marks / updated.matric_total) * 100).toFixed(2);
            }
            if ((key === 'fsc_part1_marks' || key === 'fsc_part1_total') && updated.fsc_part1_marks && updated.fsc_part1_total) {
                updated.fsc_part1_percentage = ((updated.fsc_part1_marks / updated.fsc_part1_total) * 100).toFixed(2);
                const projTotal = updated.fsc_total || 1100;
                updated.fsc_projected_marks = Math.round((updated.fsc_part1_marks / updated.fsc_part1_total) * projTotal);
                updated.fsc_projected_percentage = ((updated.fsc_projected_marks / projTotal) * 100).toFixed(2);
            }

            return updated;
        });
    }, []);

    // Debounced auto-save on blur
    const handleBlurSave = useCallback(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => saveProfile(), 300);
    }, [profile, user]);

    async function saveProfile() {
        if (!user) return;
        setSaving(true);
        setSaveError('');
        try {
            const payload = { ...profile };
            delete payload.id;
            delete payload.created_at;

            // Convert numeric strings
            const numericFields = [
                'fsc_marks', 'fsc_total', 'matric_marks', 'matric_total',
                'fsc_year', 'matric_year', 'passing_year', 'net_year',
                'fsc_part1_marks', 'fsc_part1_total', 'fsc_projected_marks',
                'sat_score', 'sat_subject_score', 'profile_completion',
            ];
            for (const key of numericFields) {
                if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
                    payload[key] = parseInt(payload[key], 10) || null;
                }
            }

            const decimalFields = [
                'fsc_percentage', 'matric_percentage', 'fsc_part1_percentage',
                'fsc_projected_percentage', 'ibcc_equivalent_inter', 'ibcc_equivalent_matric',
                'net_score', 'ecat_score', 'mdcat_score', 'nmdcat_score', 'lcat_score', 'gat_score',
            ];
            for (const key of decimalFields) {
                if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
                    payload[key] = parseFloat(payload[key]) || null;
                }
            }

            payload.profile_completion = calculateCompletion(profile);
            payload.updated_at = new Date().toISOString();

            const { error } = await supabase
                .from('profiles')
                .upsert({ id: user.id, ...payload }, { onConflict: 'id' });

            if (error) throw error;
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Save failed:', err);
            setSaveError(err.message || 'Failed to save');
        }
        setSaving(false);
    }

    async function handleSignOut() {
        await supabase.auth.signOut();
        setUser(null);
        setProfile({});
    }

    // ─── A-Level Subjects Management ─────────────────────────
    const subjects = profile.alevel_subjects || [];
    function addSubject(subjectName) {
        const newSubjects = [...subjects, { subject: subjectName || '', as_grade: '', a2_grade: '', as_marks: '', a2_marks: '', predicted: false }];
        updateField('alevel_subjects', newSubjects);
    }
    function updateSubject(idx, field, value) {
        const updated = [...subjects];
        updated[idx] = { ...updated[idx], [field]: value };
        updateField('alevel_subjects', updated);
    }
    function removeSubject(idx) {
        updateField('alevel_subjects', subjects.filter((_, i) => i !== idx));
    }

    // O-Level subjects
    const oSubjects = profile.olevel_subjects || [];
    function addOSubject(subjectName) {
        const newSubjects = [...oSubjects, { subject: subjectName || '', grade: '', marks: '' }];
        updateField('olevel_subjects', newSubjects);
    }
    function updateOSubject(idx, field, value) {
        const updated = [...oSubjects];
        updated[idx] = { ...updated[idx], [field]: value };
        updateField('olevel_subjects', updated);
    }
    function removeOSubject(idx) {
        updateField('olevel_subjects', oSubjects.filter((_, i) => i !== idx));
    }

    // ═══════════════════════════════════════════════════════════
    // AUTH SCREEN
    // ═══════════════════════════════════════════════════════════
    if (!user && !loading) {
        return (
            <div className="pf-page">
                <style jsx>{pageStyles}</style>
                <Nav />
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

    const isPak = profile.education_system !== 'cambridge';
    const isCambridge = profile.education_system === 'cambridge';
    const interStatus = profile.inter_status || 'complete';
    const isPartial = interStatus === 'part1_only' || interStatus === 'appearing';

    // ═══════════════════════════════════════════════════════════
    // PROFILE FORM
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="pf-page" onBlur={handleBlurSave}>
            <style jsx>{pageStyles}</style>
            <Nav user={user} onSignOut={handleSignOut} />

            {/* Header + Completion  */}
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
                    <span>{completeness}% complete — more complete = better autofill</span>
                </div>
            </div>

            {/* ─── SECTION 1: Education System ──────────────── */}
            <SectionCard title="Education System" icon="🎓">
                <div className="edu-toggle">
                    <button className={`edu-card ${isPak ? 'active' : ''}`}
                        onClick={() => updateField('education_system', 'pakistani')}>
                        <span className="edu-flag">🇵🇰</span>
                        <strong>Pakistani System</strong>
                        <span className="edu-sub">Matric + FSc</span>
                        <span className="edu-desc">Select if you have Pakistani board results</span>
                    </button>
                    <button className={`edu-card ${isCambridge ? 'active' : ''}`}
                        onClick={() => updateField('education_system', 'cambridge')}>
                        <span className="edu-flag">🌍</span>
                        <strong>Cambridge System</strong>
                        <span className="edu-sub">O-Level + A-Level</span>
                        <span className="edu-desc">Select if you have IBCC equivalence or will get it</span>
                    </button>
                </div>
            </SectionCard>

            {/* ─── SECTION 2: Personal Information ───────────── */}
            <SectionCard title="Personal Information" icon="👤">
                <div className="field-grid">
                    <Field label="Full Name" value={profile.full_name} onChange={v => updateField('full_name', v)} placeholder="Muhammad Ahmed Khan" required />
                    <Field label="Father's Name" value={profile.father_name} onChange={v => updateField('father_name', v)} placeholder="Muhammad Khan" required />
                    <Field label="Mother's Name" value={profile.mother_name} onChange={v => updateField('mother_name', v)} placeholder="Fatima Khan" />
                    <Field label="CNIC / B-Form" value={profile.cnic} onChange={v => updateField('cnic', v)} placeholder="35201-1234567-1" required hint="Format: XXXXX-XXXXXXX-X" />
                    <Field label="Date of Birth" type="date" value={profile.date_of_birth} onChange={v => updateField('date_of_birth', v)} required />
                    <Field label="Gender" type="select" value={profile.gender} onChange={v => updateField('gender', v)} required
                        options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
                    <Field label="Blood Group" type="select" value={profile.blood_group} onChange={v => updateField('blood_group', v)}
                        options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
                    <Field label="Religion" value={profile.religion} onChange={v => updateField('religion', v)} placeholder="Islam" />
                    <Field label="Nationality" value={profile.nationality} onChange={v => updateField('nationality', v)} placeholder="Pakistani" />
                </div>
            </SectionCard>

            {/* ─── SECTION 3: Contact Information ─────────────── */}
            <SectionCard title="Contact Information" icon="📱">
                <div className="field-grid">
                    <Field label="Email" type="email" value={profile.email} onChange={v => updateField('email', v)} placeholder="student@example.com" required />
                    <Field label="Phone" type="tel" value={profile.phone} onChange={v => updateField('phone', v)} placeholder="03001234567" required hint="Format: 03XXXXXXXXX" />
                    <Field label="WhatsApp" type="tel" value={profile.whatsapp} onChange={v => updateField('whatsapp', v)} placeholder="03001234567" />
                    <Field label="Address" value={profile.address} onChange={v => updateField('address', v)} placeholder="House #, Street, Area" />
                    <Field label="City" value={profile.city} onChange={v => updateField('city', v)} placeholder="Lahore" required />
                    <Field label="Province" type="select" value={profile.province} onChange={v => updateField('province', v)} required options={PROVINCES} />
                    <Field label="Postal Code" value={profile.postal_code} onChange={v => updateField('postal_code', v)} placeholder="54000" />
                    <Field label="Domicile Province" type="select" value={profile.domicile_province} onChange={v => updateField('domicile_province', v)} required options={PROVINCES} hint="May differ from current residence" />
                    <Field label="Domicile District" value={profile.domicile_district} onChange={v => updateField('domicile_district', v)} placeholder="Lahore" />
                </div>
            </SectionCard>

            {/* ─── SECTION 4A: Pakistani System ────────────────── */}
            {isPak && (
                <>
                    <SectionCard title="FSc / Intermediate Details" icon="📋">
                        <div className="field-grid">
                            <Field label="Intermediate Type" type="select" value={profile.inter_type} onChange={v => updateField('inter_type', v)} required
                                options={[
                                    { value: 'fsc', label: 'FSc Pre-Engineering / Pre-Medical' },
                                    { value: 'ics', label: 'ICS (Computer Science)' },
                                    { value: 'icom', label: 'I.Com (Commerce)' },
                                    { value: 'fa', label: 'FA (Arts)' },
                                ]} />
                            <Field label="FSc Stream" type="select" value={profile.fsc_stream} onChange={v => updateField('fsc_stream', v)}
                                options={[
                                    { value: 'pre_engineering', label: 'Pre-Engineering' },
                                    { value: 'pre_medical', label: 'Pre-Medical' },
                                    { value: 'computer_science', label: 'Computer Science' },
                                    { value: 'commerce', label: 'Commerce' },
                                    { value: 'arts', label: 'Arts' },
                                    { value: 'general', label: 'General Science' },
                                ]} />
                            <Field label="Intermediate Status" type="select" value={interStatus} onChange={v => updateField('inter_status', v)} required
                                options={[
                                    { value: 'not_started', label: '⏸ Not started yet' },
                                    { value: 'part1_only', label: '📋 Part-I Only' },
                                    { value: 'appearing', label: '⏳ Currently Appearing' },
                                    { value: 'result_awaited', label: '⌛ Result Awaited' },
                                    { value: 'complete', label: '✅ Complete' },
                                ]} />
                        </div>

                        {interStatus === 'not_started' && (
                            <WarningBox type="info">
                                Fill in your intermediate marks when you complete FSc Part-I. Some universities accept applications without intermediate marks.
                            </WarningBox>
                        )}

                        {/* Complete — show full marks */}
                        {(interStatus === 'complete' || interStatus === 'result_awaited') && (
                            <div className="field-grid" style={{ marginTop: 16 }}>
                                <Field label="FSc Marks Obtained" type="number" value={profile.fsc_marks} onChange={v => updateField('fsc_marks', v)} placeholder="980" required />
                                <Field label="FSc Total Marks" type="number" value={profile.fsc_total || 1100} onChange={v => updateField('fsc_total', v)} placeholder="1100" required />
                                {profile.fsc_marks && profile.fsc_total && (
                                    <div className="calc-row" style={{ gridColumn: '1 / -1' }}>
                                        FSc Percentage: <strong>{((profile.fsc_marks / profile.fsc_total) * 100).toFixed(1)}%</strong>
                                    </div>
                                )}
                                {interStatus === 'result_awaited' && (
                                    <WarningBox type="warning">Update these fields as soon as your result is announced.</WarningBox>
                                )}
                            </div>
                        )}

                        {/* Part-I or Appearing — show Part-I marks + projected */}
                        {isPartial && (
                            <div className="field-grid" style={{ marginTop: 16 }}>
                                <Field label="Part-I Marks" type="number" value={profile.fsc_part1_marks} onChange={v => updateField('fsc_part1_marks', v)} placeholder="487" required />
                                <Field label="Part-I Total" type="number" value={profile.fsc_part1_total || 550} onChange={v => updateField('fsc_part1_total', v)} placeholder="550" required />
                                {profile.fsc_part1_marks && profile.fsc_part1_total && (
                                    <>
                                        <div className="calc-row" style={{ gridColumn: '1 / -1' }}>
                                            Part-I: <strong>{profile.fsc_part1_marks}/{profile.fsc_part1_total}</strong>
                                            &nbsp;&nbsp;|&nbsp;&nbsp;
                                            Projected Full: <strong>{profile.fsc_projected_marks || Math.round((profile.fsc_part1_marks / profile.fsc_part1_total) * (profile.fsc_total || 1100))}/{profile.fsc_total || 1100}</strong>
                                            &nbsp;({profile.fsc_projected_percentage || ((profile.fsc_part1_marks / profile.fsc_part1_total) * 100).toFixed(1)}%)
                                        </div>
                                        <WarningBox type="info">
                                            Universities will calculate your projected marks. Update to full marks when Part-II result arrives.
                                        </WarningBox>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Common FSc fields */}
                        {interStatus !== 'not_started' && (
                            <div className="field-grid" style={{ marginTop: 16 }}>
                                <Field label="Board" type="select" value={profile.fsc_board} onChange={v => updateField('fsc_board', v)} required options={BOARDS} />
                                <Field label="Passing Year" type="number" value={profile.fsc_year} onChange={v => updateField('fsc_year', v)} placeholder="2024" required />
                                <Field label="Roll Number" value={profile.fsc_roll_no} onChange={v => updateField('fsc_roll_no', v)} placeholder="123456" />
                                <Field label="School / College" value={profile.fsc_school} onChange={v => updateField('fsc_school', v)} placeholder="Govt. College Lahore" required />
                            </div>
                        )}
                    </SectionCard>

                    {/* Matric Details */}
                    <SectionCard title="Matric Details" icon="📝">
                        <div className="field-grid">
                            <Field label="Matric Marks" type="number" value={profile.matric_marks} onChange={v => updateField('matric_marks', v)} placeholder="1020" required />
                            <Field label="Matric Total" type="number" value={profile.matric_total || 1050} onChange={v => updateField('matric_total', v)} placeholder="1050" required />
                            <Field label="Matric Board" type="select" value={profile.matric_board} onChange={v => updateField('matric_board', v)} required options={BOARDS} />
                            <Field label="Matric Year" type="number" value={profile.matric_year} onChange={v => updateField('matric_year', v)} placeholder="2022" required />
                            <Field label="Roll Number" value={profile.matric_roll_no} onChange={v => updateField('matric_roll_no', v)} placeholder="123456" />
                            <Field label="School" value={profile.matric_school} onChange={v => updateField('matric_school', v)} placeholder="City School" required />
                        </div>
                        {profile.matric_marks && profile.matric_total && (
                            <div className="calc-row">
                                Matric Percentage: <strong>{((profile.matric_marks / profile.matric_total) * 100).toFixed(1)}%</strong>
                            </div>
                        )}
                    </SectionCard>
                </>
            )}

            {/* ─── SECTION 4B: Cambridge System ───────────────── */}
            {isCambridge && (
                <>
                    <SectionCard title="A-Level Details" icon="🎓">
                        <div className="field-grid">
                            <Field label="A-Level Status" type="select" value={interStatus} onChange={v => updateField('inter_status', v)} required
                                options={[
                                    { value: 'not_started', label: '⏸ Not started' },
                                    { value: 'part1_only', label: '📋 AS-Level Only' },
                                    { value: 'appearing', label: '⏳ Currently Appearing' },
                                    { value: 'complete', label: '✅ Complete' },
                                ]} />
                            <Field label="Board" type="select" value={profile.alevel_board} onChange={v => updateField('alevel_board', v)} required
                                options={[
                                    { value: 'cambridge', label: 'Cambridge (CIE)' },
                                    { value: 'edexcel', label: 'Edexcel' },
                                    { value: 'ib', label: 'IB' },
                                    { value: 'other', label: 'Other' },
                                ]} />
                        </div>

                        {interStatus !== 'not_started' && (
                            <>
                                <h3 className="sub-section-title">Subjects</h3>
                                <div className="subjects-table">
                                    <div className="subjects-header">
                                        <span>Subject</span>
                                        <span>{isPartial ? 'AS Grade' : 'Grade'}</span>
                                        <span>Marks</span>
                                        {!isPartial && <span>A2 Grade</span>}
                                        <span></span>
                                    </div>
                                    {subjects.map((s, i) => (
                                        <div key={i} className="subjects-row">
                                            <input value={s.subject} onChange={e => updateSubject(i, 'subject', e.target.value)} placeholder="Physics" />
                                            <select value={s.as_grade || ''} onChange={e => updateSubject(i, 'as_grade', e.target.value)}>
                                                <option value="">--</option>
                                                {['A*', 'A', 'B', 'C', 'D', 'E'].map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                            <input type="number" value={s.as_marks || ''} onChange={e => updateSubject(i, 'as_marks', e.target.value)} placeholder="88" />
                                            {!isPartial && (
                                                <select value={s.a2_grade || ''} onChange={e => updateSubject(i, 'a2_grade', e.target.value)}>
                                                    <option value="">--</option>
                                                    {['A*', 'A', 'B', 'C', 'D', 'E'].map(g => <option key={g} value={g}>{g}</option>)}
                                                </select>
                                            )}
                                            <button className="btn-remove" onClick={() => removeSubject(i)}>✕</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="subject-add-row">
                                    <select id="add-subject-select" defaultValue="">
                                        <option value="">Quick add subject...</option>
                                        {ALEVEL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <button className="btn-add" onClick={() => {
                                        const sel = document.getElementById('add-subject-select');
                                        addSubject(sel?.value || '');
                                        if (sel) sel.value = '';
                                    }}>+ Add Subject</button>
                                </div>
                            </>
                        )}
                    </SectionCard>

                    {/* IBCC Equivalence — Critical */}
                    <SectionCard title="IBCC Equivalence Certificate" icon="⚠️"
                        note="Pakistani universities require an IBCC equivalence certificate to convert your A-Level grades to a Pakistani percentage.">
                        <div className="field-grid">
                            <Field label="IBCC Equivalent % (Inter)" type="number" value={profile.ibcc_equivalent_inter} onChange={v => updateField('ibcc_equivalent_inter', v)} placeholder="85.5" hint="The percentage IBCC issues as equivalent to FSc" />
                            <Field label="IBCC Equivalent % (Matric)" type="number" value={profile.ibcc_equivalent_matric} onChange={v => updateField('ibcc_equivalent_matric', v)} placeholder="92.0" hint="The percentage IBCC issues as equivalent to Matric" />
                        </div>
                        {!profile.ibcc_equivalent_inter && (
                            <WarningBox>You need an IBCC equivalence certificate before applying to Pakistani universities. Apply at: <a href="https://ibcc.edu.pk" target="_blank" rel="noreferrer" style={{ color: '#4ade80' }}>ibcc.edu.pk</a></WarningBox>
                        )}
                    </SectionCard>

                    {/* O-Level Details */}
                    <SectionCard title="O-Level Details" icon="📝">
                        <div className="field-grid">
                            <Field label="Board" type="select" value={profile.olevel_board} onChange={v => updateField('olevel_board', v)}
                                options={[
                                    { value: 'cambridge', label: 'Cambridge (CIE)' },
                                    { value: 'edexcel', label: 'Edexcel' },
                                    { value: 'other', label: 'Other' },
                                ]} />
                        </div>
                        <h3 className="sub-section-title">Subjects</h3>
                        <div className="subjects-table">
                            <div className="subjects-header three-col">
                                <span>Subject</span><span>Grade</span><span></span>
                            </div>
                            {oSubjects.map((s, i) => (
                                <div key={i} className="subjects-row three-col">
                                    <input value={s.subject} onChange={e => updateOSubject(i, 'subject', e.target.value)} placeholder="Mathematics" />
                                    <select value={s.grade || ''} onChange={e => updateOSubject(i, 'grade', e.target.value)}>
                                        <option value="">--</option>
                                        {['A*', 'A', 'B', 'C', 'D', 'E'].map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    <button className="btn-remove" onClick={() => removeOSubject(i)}>✕</button>
                                </div>
                            ))}
                        </div>
                        <button className="btn-add" onClick={() => addOSubject('')} style={{ marginTop: 8 }}>+ Add Subject</button>
                    </SectionCard>
                </>
            )}

            {/* ─── SECTION 5: Entry Tests ──────────────────────── */}
            <SectionCard title="Entry Test Scores" icon="📊" note="Fill whichever tests you have taken. Leave others blank.">
                <div className="field-grid">
                    <Field label="NUST NET Score" type="number" value={profile.net_score} onChange={v => updateField('net_score', v)} placeholder="155" hint="/200" />
                    <Field label="NET Year" type="number" value={profile.net_year} onChange={v => updateField('net_year', v)} placeholder="2024" />
                    <Field label="SAT (I) Score" type="number" value={profile.sat_score} onChange={v => updateField('sat_score', v)} placeholder="1350" hint="/1600" />
                    <Field label="SAT Subject Score" type="number" value={profile.sat_subject_score} onChange={v => updateField('sat_subject_score', v)} placeholder="750" hint="/800" />
                    <Field label="ECAT Score %" type="number" value={profile.ecat_score} onChange={v => updateField('ecat_score', v)} placeholder="85" />
                    <Field label="MDCAT/NMDCAT Score %" type="number" value={profile.mdcat_score} onChange={v => updateField('mdcat_score', v)} placeholder="78" />
                    <Field label="LUMS LCAT Score" type="number" value={profile.lcat_score} onChange={v => updateField('lcat_score', v)} placeholder="72" hint="/100" />
                    <Field label="GAT General Score" type="number" value={profile.gat_score} onChange={v => updateField('gat_score', v)} placeholder="65" hint="/100" />
                </div>
            </SectionCard>

            {/* ─── SECTION 6: Family Information ───────────────── */}
            <SectionCard title="Family Information" icon="👪">
                <div className="field-grid">
                    <Field label="Father's CNIC" value={profile.father_cnic} onChange={v => updateField('father_cnic', v)} placeholder="35201-1234567-1" hint="Format: XXXXX-XXXXXXX-X" />
                    <Field label="Father's Occupation" value={profile.father_occupation} onChange={v => updateField('father_occupation', v)} placeholder="Government Officer" />
                    <Field label="Guardian Phone" type="tel" value={profile.guardian_phone} onChange={v => updateField('guardian_phone', v)} placeholder="03001234567" />
                </div>
            </SectionCard>

            {/* ─── SECTION 7: Portal Credentials ──────────────── */}
            <SectionCard title="University Portal Credentials" icon="🔐"
                note="These will be autofilled when creating accounts on university portals. Keep them consistent across all portals.">
                <div className="field-grid">
                    <Field label="Portal Email" type="email" value={profile.portal_email} onChange={v => updateField('portal_email', v)}
                        placeholder={profile.email || 'your@email.com'} hint="Defaults to your main email — change if you want a dedicated app email" />
                    <div className="field-group">
                        <label>Portal Password</label>
                        <div className="password-row">
                            <input type={showPassword ? 'text' : 'password'} value={profile.portal_password || ''}
                                onChange={e => updateField('portal_password', e.target.value)} />
                            <button type="button" className="btn-sm" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                            <button type="button" className="btn-sm" onClick={() => navigator.clipboard?.writeText(profile.portal_password || '')}>
                                Copy
                            </button>
                            <button type="button" className="btn-sm" onClick={() => updateField('portal_password', generatePortalPassword(profile.full_name, profile.cnic))}>
                                🔄
                            </button>
                        </div>
                        <span className="field-hint">⚠️ Save this password somewhere safe. You'll need it to log back into portals.</span>
                    </div>
                </div>
            </SectionCard>

            {/* ─── SECTION 8: Preferences ──────────────────────── */}
            <SectionCard title="Preferences" icon="⭐">
                <div className="field-grid">
                    <Field label="Preferred Field" type="select" value={profile.preferred_field} onChange={v => updateField('preferred_field', v)}
                        options={['Computer Science', 'Engineering', 'Business', 'Medical', 'Law', 'Arts', 'Other']} />
                    <Field label="Preferred Degree" type="select" value={profile.preferred_degree} onChange={v => updateField('preferred_degree', v)}
                        options={['BS', 'BE', 'BBA', 'MBBS', 'BArch', 'BA', 'Other']} />
                </div>
            </SectionCard>

            {/* ─── Save Bar ────────────────────────────────────── */}
            {saveError && <div className="save-error">{saveError}</div>}
            <div className="save-bar">
                <button type="button" className="btn-primary-pf" onClick={saveProfile} disabled={saving}>
                    {saving ? 'Saving...' : saved ? '✓ Profile Saved!' : '💾 Save Profile'}
                </button>
                <p className="save-hint">Auto-saves on field blur. Your profile powers the extension autofill.</p>
            </div>
        </div>
    );
}

// ─── Nav Component ────────────────────────────────────────────
function Nav({ user, onSignOut }) {
    return (
        <nav className="pf-nav">
            <Link href="/" className="pf-brand">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c6 3 10 3 16 0v-5" />
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Ilm Se Urooj</span>
                    <span style={{ fontFamily: "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', Arial, sans-serif", fontSize: 13, color: '#a1a1aa', lineHeight: 1, marginTop: -2 }}>علم سے عروج</span>
                </div>
            </Link>
            <div className="pf-nav-links">
                <Link href="/">Home</Link>
                <Link href="/extension">Extension</Link>
                {user && <Link href="/applications">Dashboard</Link>}
                {user && <button onClick={onSignOut} className="btn-signout">Sign Out</button>}
            </div>
        </nav>
    );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const pageStyles = `
  .pf-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0c0e0b 0%, #1a1d1a 50%, #0c0e0b 100%);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #e4e4e7; padding: 0 20px 60px; max-width: 800px; margin: 0 auto;
  }
  .pf-nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 0; }
  .pf-brand { display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 700; color: #4ade80; text-decoration: none; }
  .pf-nav-links { display: flex; align-items: center; gap: 12px; }
  .pf-nav-links a { color: #a1a1aa; font-size: 13px; text-decoration: none; padding: 6px 12px; border-radius: 8px; transition: all 0.2s; }
  .pf-nav-links a:hover { color: #e4e4e7; background: rgba(255,255,255,0.06); }
  .btn-signout { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); padding: 6px 14px; border-radius: 8px; font-size: 12px; cursor: pointer; font-family: inherit; }
  .btn-signout:hover { background: rgba(239,68,68,0.2); }

  .pf-header { display: flex; align-items: center; gap: 16px; padding: 24px 0 32px; flex-wrap: wrap; }
  .pf-avatar { width: 56px; height: 56px; border-radius: 50%; background: rgba(74,222,128,0.15); color: #4ade80; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 24px; flex-shrink: 0; }
  .pf-header h1 { font-size: 24px; margin: 0; }
  .pf-email { font-size: 13px; color: #a1a1aa; margin: 2px 0 0; }
  .pf-completeness { margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  .pf-completeness span { font-size: 11px; color: #a1a1aa; }
  .pf-bar-container { width: 160px; height: 8px; background: #27272a; border-radius: 4px; overflow: hidden; }
  .pf-bar { height: 100%; background: linear-gradient(90deg, #4ade80, #22c55e); border-radius: 4px; transition: width 0.3s ease; }

  .section-card { background: rgba(22,25,22,0.8); border: 1px solid #27272a; border-radius: 16px; padding: 24px; margin-bottom: 20px; }
  .section-title { font-size: 16px; font-weight: 600; margin: 0 0 16px; }
  .section-note { font-size: 12px; color: #a1a1aa; margin: -8px 0 16px; line-height: 1.5; }
  .sub-section-title { font-size: 13px; font-weight: 600; color: #a1a1aa; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 0.5px; }

  .field-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  @media (max-width: 600px) { .field-grid { grid-template-columns: 1fr; } }
  .field-group { display: flex; flex-direction: column; gap: 4px; }
  .field-group label { font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; }
  .req { color: #ef4444; margin-left: 2px; }
  .field-group input, .field-group select, .field-group textarea {
    padding: 10px 12px; background: #0c0e0b; border: 1px solid #27272a;
    border-radius: 8px; color: #e4e4e7; font-size: 13px; font-family: inherit;
    outline: none; transition: border-color 0.2s; box-sizing: border-box; width: 100%;
  }
  .field-group input:focus, .field-group select:focus, .field-group textarea:focus { border-color: #4ade80; box-shadow: 0 0 0 2px rgba(74,222,128,0.15); }
  .field-group input::placeholder, .field-group textarea::placeholder { color: #555; }
  .field-hint { font-size: 10px; color: #71717a; margin-top: 2px; }

  .calc-row { margin-top: 12px; padding: 10px 14px; background: rgba(74,222,128,0.06); border-radius: 8px; font-size: 12px; color: #a1a1aa; }
  .calc-row strong { color: #4ade80; }

  /* Education Toggle */
  .edu-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 500px) { .edu-toggle { grid-template-columns: 1fr; } }
  .edu-card {
    background: #0c0e0b; border: 2px solid #27272a; border-radius: 12px;
    padding: 20px; text-align: center; cursor: pointer;
    display: flex; flex-direction: column; gap: 4px; align-items: center;
    transition: all 0.2s; font-family: inherit; color: #a1a1aa;
  }
  .edu-card:hover { border-color: #3f3f46; }
  .edu-card.active { border-color: #4ade80; background: rgba(74,222,128,0.04); color: #e4e4e7; }
  .edu-card .edu-flag { font-size: 28px; margin-bottom: 4px; }
  .edu-card strong { font-size: 15px; color: inherit; }
  .edu-card .edu-sub { font-size: 12px; color: #71717a; }
  .edu-card .edu-desc { font-size: 10px; color: #52525b; margin-top: 4px; }

  /* Subjects Table */
  .subjects-table { margin-top: 8px; }
  .subjects-header, .subjects-row {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 40px; gap: 8px; align-items: center;
    padding: 6px 0;
  }
  .subjects-header.three-col, .subjects-row.three-col {
    grid-template-columns: 2fr 1fr 40px;
  }
  .subjects-header { font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #27272a; }
  .subjects-row input, .subjects-row select {
    padding: 8px 10px; background: #0c0e0b; border: 1px solid #27272a;
    border-radius: 6px; color: #e4e4e7; font-size: 12px; font-family: inherit;
    outline: none; width: 100%; box-sizing: border-box;
  }
  .subjects-row input:focus, .subjects-row select:focus { border-color: #4ade80; }
  .btn-remove { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.15); border-radius: 6px; padding: 6px; cursor: pointer; font-size: 12px; font-family: inherit; }
  .btn-remove:hover { background: rgba(239,68,68,0.2); }
  .btn-add { background: rgba(74,222,128,0.1); color: #4ade80; border: 1px solid rgba(74,222,128,0.2); border-radius: 8px; padding: 8px 16px; cursor: pointer; font-size: 12px; font-family: inherit; }
  .btn-add:hover { background: rgba(74,222,128,0.2); }
  .subject-add-row { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
  .subject-add-row select { padding: 8px 10px; background: #0c0e0b; border: 1px solid #27272a; border-radius: 6px; color: #a1a1aa; font-size: 12px; font-family: inherit; flex: 1; }

  /* Password Row */
  .password-row { display: flex; gap: 6px; align-items: center; }
  .password-row input { flex: 1; }
  .btn-sm { background: rgba(255,255,255,0.06); color: #a1a1aa; border: 1px solid #27272a; border-radius: 6px; padding: 8px 10px; cursor: pointer; font-size: 11px; font-family: inherit; white-space: nowrap; }
  .btn-sm:hover { background: rgba(255,255,255,0.1); color: #e4e4e7; }

  /* Save */
  .save-bar { text-align: center; padding: 20px 0; }
  .save-error { background: rgba(239,68,68,0.1); color: #ef4444; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; text-align: center; border: 1px solid rgba(239,68,68,0.2); }
  .btn-primary-pf { padding: 12px 40px; background: #4ade80; color: #0c0e0b; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit; }
  .btn-primary-pf:hover { background: #22c55e; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(74,222,128,0.3); }
  .btn-primary-pf:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .save-hint { font-size: 11px; color: #71717a; margin-top: 8px; }

  /* Auth */
  .auth-card { max-width: 400px; margin: 80px auto; padding: 32px; background: rgba(22,25,22,0.9); border: 1px solid #27272a; border-radius: 16px; text-align: center; }
  .auth-card h2 { font-size: 22px; margin: 0 0 6px; }
  .auth-sub { font-size: 13px; color: #a1a1aa; margin: 0 0 24px; }
  .auth-card form { text-align: left; }
  .auth-card .field-group { margin-bottom: 14px; }
  .auth-error { background: rgba(239,68,68,0.1); color: #ef4444; padding: 8px 12px; border-radius: 8px; font-size: 12px; margin-bottom: 12px; }
  .auth-card .btn-primary-pf { width: 100%; margin-top: 4px; }
  .auth-toggle { background: none; border: none; color: #4ade80; font-size: 12px; cursor: pointer; margin-top: 16px; font-family: inherit; }
  .auth-toggle:hover { text-decoration: underline; }

  .loading-center { display: flex; justify-content: center; padding: 120px; }
  .spinner-pf { width: 32px; height: 32px; border: 3px solid #27272a; border-top-color: #4ade80; border-radius: 50%; animation: pf-spin 0.8s linear infinite; }
  @keyframes pf-spin { to { transform: rotate(360deg); } }
`;
