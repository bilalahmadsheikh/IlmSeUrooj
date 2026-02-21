'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ExtensionPage() {
    const [activeTab, setActiveTab] = useState('install');

    return (
        <div className="ext-page">
            <style jsx>{`
        .ext-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0c0e0b 0%, #1a1d1a 50%, #0c0e0b 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #e4e4e7;
          padding: 0 20px 60px;
        }
        .ext-nav {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 0;
        }
        .ext-brand {
          display: flex; align-items: center; gap: 8px;
          font-size: 20px; font-weight: 700; color: #4ade80;
          text-decoration: none;
        }
        .ext-nav-links { display: flex; gap: 16px; }
        .ext-nav-links a {
          color: #a1a1aa; font-size: 13px; text-decoration: none;
          padding: 6px 12px; border-radius: 8px; transition: all 0.2s;
        }
        .ext-nav-links a:hover { color: #e4e4e7; background: rgba(255,255,255,0.06); }

        .hero {
          max-width: 960px; margin: 40px auto 60px; text-align: center;
        }
        .hero h1 {
          font-size: 48px; font-weight: 800; margin: 0 0 16px;
          background: linear-gradient(135deg, #4ade80, #22c55e, #15803d);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          line-height: 1.15;
        }
        .hero p { font-size: 18px; color: #a1a1aa; max-width: 600px; margin: 0 auto 32px; line-height: 1.6; }
        .hero-cta {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; background: #4ade80; color: #0c0e0b;
          border: none; border-radius: 12px; font-size: 16px; font-weight: 700;
          cursor: pointer; transition: all 0.2s; text-decoration: none;
        }
        .hero-cta:hover { background: #22c55e; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(74,222,128,0.3); }

        .features {
          max-width: 960px; margin: 0 auto 60px;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
        }
        @media (max-width: 768px) { .features { grid-template-columns: 1fr; } }
        .feature-card {
          background: rgba(22,25,22,0.8); border: 1px solid #27272a;
          border-radius: 16px; padding: 28px; transition: all 0.2s;
        }
        .feature-card:hover { border-color: #4ade80; transform: translateY(-2px); }
        .feature-icon { font-size: 32px; margin-bottom: 12px; }
        .feature-card h3 { font-size: 16px; font-weight: 600; margin: 0 0 8px; }
        .feature-card p { font-size: 13px; color: #a1a1aa; margin: 0; line-height: 1.5; }

        .install-section {
          max-width: 720px; margin: 0 auto 40px;
          background: rgba(22,25,22,0.8); border: 1px solid #27272a;
          border-radius: 16px; overflow: hidden;
        }
        .tabs {
          display: flex; border-bottom: 1px solid #27272a;
        }
        .tab {
          flex: 1; padding: 14px; text-align: center; font-size: 13px;
          font-weight: 600; color: #a1a1aa; cursor: pointer; border: none;
          background: none; transition: all 0.2s; font-family: inherit;
        }
        .tab.active { color: #4ade80; background: rgba(74,222,128,0.06); border-bottom: 2px solid #4ade80; }
        .tab:hover:not(.active) { color: #e4e4e7; }
        .tab-content { padding: 28px; }
        .step {
          display: flex; gap: 16px; margin-bottom: 20px; align-items: flex-start;
        }
        .step-num {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(74,222,128,0.15); color: #4ade80;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 14px; flex-shrink: 0;
        }
        .step-text h4 { font-size: 14px; margin: 0 0 4px; }
        .step-text p { font-size: 12px; color: #a1a1aa; margin: 0; line-height: 1.5; }
        .code-block {
          background: #0c0e0b; border: 1px solid #27272a; border-radius: 8px;
          padding: 12px 16px; margin: 8px 0; font-family: 'Fira Code', monospace;
          font-size: 12px; color: #4ade80; overflow-x: auto;
        }
        .profile-cta {
          max-width: 720px; margin: 0 auto; text-align: center;
          padding: 40px; background: linear-gradient(135deg, rgba(74,222,128,0.08), rgba(34,197,94,0.04));
          border: 1px solid rgba(74,222,128,0.2); border-radius: 16px;
        }
        .profile-cta h3 { font-size: 20px; margin: 0 0 8px; }
        .profile-cta p { font-size: 13px; color: #a1a1aa; margin: 0 0 20px; }
        .btn-profile {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 12px 28px; background: #4ade80; color: #0c0e0b;
          border: none; border-radius: 10px; font-size: 14px; font-weight: 700;
          cursor: pointer; text-decoration: none; transition: all 0.2s;
        }
        .btn-profile:hover { background: #22c55e; transform: translateY(-1px); }
      `}</style>

            <nav className="ext-nav">
                <Link href="/" className="ext-brand">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c6 3 10 3 16 0v-5" />
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>Ilm Se Urooj</span>
                        <span style={{ fontFamily: "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', Arial, sans-serif", fontSize: 13, color: '#a1a1aa', lineHeight: 1, marginTop: -2 }}>علم سے عروج</span>
                    </div>
                </Link>
                <div className="ext-nav-links">
                    <Link href="/">Home</Link>
                    <Link href="/profile">Profile</Link>
                    <Link href="/applications">Dashboard</Link>
                </div>
            </nav>

            <div className="hero">
                <h1>Autofill University<br />Applications with AI</h1>
                <p>
                    One profile. 28 universities. Fill any Pakistani university application form
                    in seconds — powered by local AI that runs on your machine.
                </p>
                <a href="#install" className="hero-cta">
                    ⚡ Get the Extension
                </a>
            </div>

            <div className="features">
                <div className="feature-card">
                    <div className="feature-icon">🧠</div>
                    <h3>AI Field Mapping</h3>
                    <p>AI analyzes each university portal and maps fields to your profile. Works with React, Vue, and traditional forms.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">✍️</div>
                    <h3>SOP Essay Drafting</h3>
                    <p>AI drafts personalized essays and statements. You review and edit before inserting — your voice, AI-assisted.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">🔐</div>
                    <h3>Password Vault</h3>
                    <p>Auto-generates secure passwords for university portals. One-click copy and fill. Never forget a portal login.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">📋</div>
                    <h3>Pre-submit Check</h3>
                    <p>Validates CNIC format, marks, required fields before you submit. Catches errors before universities do.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">💾</div>
                    <h3>Answer Memory</h3>
                    <p>Saves your manually entered answers and reuses them across universities. Fill once, apply everywhere.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">📊</div>
                    <h3>Application Dashboard</h3>
                    <p>Track all applications in one place. Status badges, confirmation numbers, and direct portal links.</p>
                </div>
            </div>

            <div className="install-section" id="install">
                <div className="tabs">
                    <button className={`tab ${activeTab === 'install' ? 'active' : ''}`} onClick={() => setActiveTab('install')}>
                        Chrome Extension
                    </button>
                    <button className={`tab ${activeTab === 'backend' ? 'active' : ''}`} onClick={() => setActiveTab('backend')}>
                        Backend Setup
                    </button>
                    <button className={`tab ${activeTab === 'ollama' ? 'active' : ''}`} onClick={() => setActiveTab('ollama')}>
                        AI (Ollama)
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'install' && (
                        <>
                            <div className="step">
                                <div className="step-num">1</div>
                                <div className="step-text">
                                    <h4>Open Chrome Extensions</h4>
                                    <p>Navigate to <code>chrome://extensions</code> in your browser.</p>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-num">2</div>
                                <div className="step-text">
                                    <h4>Enable Developer Mode</h4>
                                    <p>Toggle the "Developer mode" switch in the top-right corner.</p>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-num">3</div>
                                <div className="step-text">
                                    <h4>Load the Extension</h4>
                                    <p>Click "Load unpacked" and select the <code>extension/</code> folder from this project.</p>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-num">4</div>
                                <div className="step-text">
                                    <h4>Visit a University Portal</h4>
                                    <p>Go to any supported university's admissions page. The Ilm Se Urooj sidebar will appear automatically!</p>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'backend' && (
                        <>
                            <div className="step">
                                <div className="step-num">1</div>
                                <div className="step-text">
                                    <h4>Install Dependencies</h4>
                                    <div className="code-block">npm install</div>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-num">2</div>
                                <div className="step-text">
                                    <h4>Configure Environment</h4>
                                    <p>The <code>.env.local</code> file should have your Supabase credentials.</p>
                                    <div className="code-block">
                                        NEXT_PUBLIC_SUPABASE_URL=your-url<br />
                                        NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
                                    </div>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-num">3</div>
                                <div className="step-text">
                                    <h4>Start the Dev Server</h4>
                                    <div className="code-block">npm run dev</div>
                                    <p>The backend will run at <code>http://localhost:3000</code>.</p>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'ollama' && (
                        <>
                            <div className="step">
                                <div className="step-num">1</div>
                                <div className="step-text">
                                    <h4>Install Ollama</h4>
                                    <p>Download from <a href="https://ollama.com" target="_blank" style={{ color: '#4ade80' }}>ollama.com</a> and install.</p>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-num">2</div>
                                <div className="step-text">
                                    <h4>Pull the Llama 3 Model</h4>
                                    <div className="code-block">ollama pull llama3</div>
                                    <p>This downloads the 4.7 GB model. It runs entirely on your machine — no API keys needed!</p>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-num">3</div>
                                <div className="step-text">
                                    <h4>Start Ollama</h4>
                                    <div className="code-block">ollama serve</div>
                                    <p>Ollama runs at <code>http://localhost:11434</code>. The extension connects automatically.</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="profile-cta">
                <h3>Ready to start?</h3>
                <p>Create your profile first, then install the extension to autofill applications.</p>
                <Link href="/profile" className="btn-profile">
                    👤 Create Your Profile →
                </Link>
            </div>
        </div>
    );
}
