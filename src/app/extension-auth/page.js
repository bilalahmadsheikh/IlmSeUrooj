'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function ExtensionAuthPage() {
    const [status, setStatus] = useState('checking'); // checking | idle | loading | success | error | token_sent
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [tokenSent, setTokenSent] = useState(false);
    const [copied, setCopied] = useState(false);
    const tokenRef = useRef(null);

    // On mount: check if user is already logged in → auto-send token to extension
    useEffect(() => {
        async function checkExistingSession() {
            try {
                const { data } = await supabase.auth.getSession();
                if (data?.session?.access_token) {
                    tokenRef.current = data.session.access_token;
                    const sent = await sendTokenToExtension(data.session.access_token);
                    if (sent) {
                        setStatus('token_sent');
                        setTimeout(() => window.close(), 2000);
                    } else {
                        setStatus('success'); // fallback to manual copy
                    }
                } else {
                    setStatus('idle');
                }
            } catch {
                setStatus('idle');
            }
        }
        checkExistingSession();
    }, []);

    async function sendTokenToExtension(token) {
        const params = new URLSearchParams(window.location.search);
        const extensionId = params.get('ext');
        if (!extensionId || typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
            return false;
        }
        try {
            await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(extensionId, {
                    type: 'AUTH_TOKEN',
                    token,
                    siteUrl: window.location.origin,
                }, (response) => {
                    if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
                    resolve(response);
                });
            });
            return true;
        } catch {
            return false;
        }
    }

    async function handleSignIn(e) {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');

        try {
            // Use fetch directly to Supabase Auth API
            const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error_description || data.msg || 'Sign in failed');
            }

            const token = data.access_token;
            tokenRef.current = token;

            const sent = await sendTokenToExtension(token);
            if (sent) {
                setStatus('token_sent');
                setTimeout(() => window.close(), 2000);
            } else {
                setStatus('success');
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message);
        }
    }

    async function handleCopyToken() {
        if (!tokenRef.current) return;
        try {
            await navigator.clipboard.writeText(tokenRef.current);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback: select text
            const input = document.createElement('textarea');
            input.value = tokenRef.current;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.logo}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c6 3 10 3 16 0v-5" />
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h1 style={styles.title}>Ilm Se Urooj</h1>
                        <span style={styles.urduText}>علم سے عروج</span>
                    </div>
                </div>

                <p style={styles.subtitle}>Sign in to connect your profile to the extension.</p>

                {status === 'checking' ? (
                    <div style={styles.successBox}>
                        <h2 style={{ color: '#4ade80', marginTop: 8, marginBottom: 4 }}>Checking session…</h2>
                        <p style={styles.subtitle}>Checking if you're already signed in…</p>
                    </div>
                ) : status === 'token_sent' ? (
                    <div style={styles.successBox}>
                        <h2 style={{ color: '#4ade80', marginTop: 8, marginBottom: 4 }}>Connected!</h2>
                        <p style={styles.subtitle}>Your profile has been sent to the extension. This tab will close automatically.</p>
                    </div>
                ) : status === 'success' ? (
                    <div style={styles.successBox}>
                        <h2 style={{ color: '#4ade80', marginTop: 8, marginBottom: 4 }}>Signed In!</h2>
                        <p style={{ ...styles.subtitle, marginBottom: 16 }}>
                            The extension couldn't receive the token automatically.
                            Copy this token and paste it in the extension popup.
                        </p>
                        <div style={styles.tokenBox}>
                            <code style={styles.tokenText}>
                                {tokenRef.current?.slice(0, 20)}...{tokenRef.current?.slice(-10)}
                            </code>
                            <button onClick={handleCopyToken} style={styles.copyBtn}>
                                {copied ? '✓ Copied!' : 'Copy Token'}
                            </button>
                        </div>
                        <p style={{ fontSize: 11, color: '#71717a', marginTop: 12 }}>
                            Tip: Try reloading the extension, then sign in again for auto-connect.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSignIn} style={styles.form}>
                        <div style={styles.field}>
                            <label style={styles.label}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={styles.input}
                                placeholder="student@example.com"
                            />
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={styles.input}
                                placeholder="••••••••"
                            />
                        </div>

                        {errorMsg && (
                            <div style={styles.errorBox}>{errorMsg}</div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            style={{
                                ...styles.button,
                                opacity: status === 'loading' ? 0.7 : 1,
                            }}
                        >
                            {status === 'loading' ? 'Signing in...' : 'Sign In & Connect'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: '#0c0e0b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        background: '#161916',
        borderRadius: 16,
        padding: 32,
        border: '1px solid #27272a',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: 700,
        color: '#4ade80',
        margin: 0,
    },
    subtitle: {
        fontSize: 13,
        color: '#a1a1aa',
        marginBottom: 20,
        lineHeight: 1.5,
    },
    urduText: {
        fontFamily: "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', Arial, sans-serif",
        fontSize: 16,
        color: '#a1a1aa',
        lineHeight: 1,
        textAlign: 'right',
        marginTop: -4,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: 500,
        color: '#a1a1aa',
    },
    input: {
        padding: '10px 12px',
        background: '#0c0e0b',
        border: '1px solid #27272a',
        borderRadius: 8,
        color: '#e4e4e7',
        fontSize: 13,
        fontFamily: 'inherit',
        outline: 'none',
    },
    button: {
        padding: '12px 16px',
        background: '#4ade80',
        color: '#0c0e0b',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: 'pointer',
        marginTop: 4,
    },
    errorBox: {
        background: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        padding: '10px 12px',
        borderRadius: 8,
        fontSize: 12,
        border: '1px solid rgba(239, 68, 68, 0.2)',
    },
    successBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '24px 0',
    },
    tokenBox: {
        background: '#0c0e0b',
        border: '1px solid #27272a',
        borderRadius: 8,
        padding: 12,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
    },
    tokenText: {
        fontSize: 11,
        color: '#a1a1aa',
        wordBreak: 'break-all',
    },
    copyBtn: {
        padding: '8px 20px',
        background: '#4ade80',
        color: '#0c0e0b',
        border: 'none',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
};
