'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { universities } from '@/data/universities';

// Pull verified status from university data
function getVerifiedStatus(uni) {
    // Default: portal mapped
    return uni.verified ? { label: '✓ Autofill Verified', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' }
        : { label: 'Portal Mapped', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' };
}

export default function ExtensionPage() {
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        try {
            const marker = document.querySelector('#unimatch-extension-active');
            if (marker) setInstalled(true);
        } catch (e) { }
    }, []);

    return (
        <div className="ext-page">
            <style jsx>{extStyles}</style>

            {/* Nav */}
            <nav className="ext-nav">
                <Link href="/" className="ext-brand">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c6 3 10 3 16 0v-5" />
                    </svg>
                    <span>Ilm Se Urooj</span>
                </Link>
                <div className="ext-nav-links">
                    <Link href="/">Explore</Link>
                    <Link href="/profile">Profile</Link>
                    <Link href="/applications">Dashboard</Link>
                </div>
            </nav>

            {/* Section 1 — Hero */}
            <section className="ext-hero">
                <h1>Fill any university form<br /><span className="green">in 3 seconds.</span></h1>
                <p className="hero-sub">
                    Ilm Se Urooj autofills your name, CNIC, marks, and contact info
                    on <strong>17 verified</strong> Pakistani university portals.<br />
                    You review. You submit. We just save you the typing.
                </p>
                <div className="hero-actions">
                    {installed ? (
                        <div className="installed-badge">
                            <span style={{ color: '#4ade80' }}>✓ Extension Installed</span>
                            <Link href="/applications" className="btn-secondary-ext">Open Dashboard →</Link>
                        </div>
                    ) : (
                        <>
                            <a href="https://chromewebstore.google.com/detail/ilm-se-urooj" target="_blank" rel="noreferrer" className="btn-primary-ext">
                                Add to Chrome — Free
                            </a>
                            <a href="#how-it-works" className="btn-ghost-ext">See how it works ↓</a>
                        </>
                    )}
                </div>
            </section>

            {/* Section 2 — How it works */}
            <section className="ext-section" id="how-it-works">
                <h2>How it works</h2>
                <div className="steps-grid">
                    <div className="step">
                        <span className="step-num">①</span>
                        <h3>Create your profile once</h3>
                        <p>Enter your marks, CNIC, contact info — including O/A-Level or Matric/FSc details.</p>
                    </div>
                    <div className="step">
                        <span className="step-num">②</span>
                        <h3>Install the extension</h3>
                        <p>One click from Chrome Web Store. Free forever.</p>
                    </div>
                    <div className="step">
                        <span className="step-num">③</span>
                        <h3>Open any portal + click Autofill</h3>
                        <p>Extension fills all known fields instantly. You fill the rest. You click Submit.</p>
                    </div>
                </div>
            </section>

            {/* Section 3 — Supported Universities */}
            <section className="ext-section">
                <h2>Supported Universities</h2>
                <div className="uni-grid">
                    {universities.slice(0, 24).map(uni => {
                        const status = getVerifiedStatus(uni);
                        return (
                            <div key={uni.id} className="uni-card-ext">
                                <strong>{uni.shortName || uni.name}</strong>
                                <span className="uni-campus">{uni.city}</span>
                                <span className="uni-status" style={{ color: status.color, background: status.bg }}>
                                    {status.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Section 4 — What gets filled */}
            <section className="ext-section">
                <h2>What we fill vs. what you fill</h2>
                <div className="fill-grid">
                    <div className="fill-col fill-green">
                        <h3 style={{ color: '#4ade80' }}>✓ Auto-Filled</h3>
                        <ul>
                            <li>Full name, Father's name</li>
                            <li>CNIC number</li>
                            <li>Date of birth, Gender</li>
                            <li>Email, Phone number</li>
                            <li>City, Province, Address</li>
                            <li>FSc/A-Level marks (or IBCC equivalent)</li>
                            <li>Matric/O-Level marks</li>
                            <li>Board name, Passing year</li>
                            <li>College/school name</li>
                            <li>Account password (consistent across portals)</li>
                        </ul>
                    </div>
                    <div className="fill-col fill-amber">
                        <h3 style={{ color: '#fbbf24' }}>✎ You Fill</h3>
                        <ul>
                            <li>Guardian's name (if different)</li>
                            <li>"How did you hear about us?"</li>
                            <li>Personal statement / SOP</li>
                            <li>Program selection</li>
                            <li>Application fee payment</li>
                            <li>File uploads (CNIC scan, photo)</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Section 5 — Install CTA */}
            <section className="ext-section ext-cta">
                {installed ? (
                    <div className="installed-badge">
                        <span style={{ color: '#4ade80', fontSize: 18 }}>✓ Ilm Se Urooj Extension is installed</span>
                        <Link href="/applications" className="btn-primary-ext" style={{ marginTop: 12 }}>Open Dashboard →</Link>
                    </div>
                ) : (
                    <>
                        <a href="https://chromewebstore.google.com/detail/ilm-se-urooj" target="_blank" rel="noreferrer" className="btn-primary-ext btn-lg">
                            Add to Chrome — Free
                        </a>
                        <p className="cta-note">$5 one-time Chrome Web Store fee paid by us. Free forever for students.</p>
                    </>
                )}
            </section>
        </div>
    );
}

const extStyles = `
  .ext-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0c0e0b 0%, #1a1d1a 50%, #0c0e0b 100%);
    font-family: 'Inter', -apple-system, sans-serif;
    color: #e4e4e7;
  }
  .ext-nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 32px; max-width: 1100px; margin: 0 auto; }
  .ext-brand { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 700; color: #4ade80; text-decoration: none; }
  .ext-nav-links { display: flex; gap: 16px; }
  .ext-nav-links a { color: #a1a1aa; font-size: 13px; text-decoration: none; padding: 6px 12px; border-radius: 8px; transition: all 0.2s; }
  .ext-nav-links a:hover { color: #e4e4e7; background: rgba(255,255,255,0.06); }

  .ext-hero { max-width: 700px; margin: 0 auto; text-align: center; padding: 80px 24px 48px; }
  .ext-hero h1 { font-size: 42px; font-weight: 800; line-height: 1.15; margin: 0 0 20px; }
  .green { color: #4ade80; }
  .hero-sub { font-size: 16px; color: #a1a1aa; line-height: 1.7; max-width: 540px; margin: 0 auto 28px; }
  .hero-sub strong { color: #4ade80; }
  .hero-actions { display: flex; gap: 12px; justify-content: center; align-items: center; flex-wrap: wrap; }

  .btn-primary-ext { display: inline-flex; padding: 14px 32px; background: #4ade80; color: #0c0e0b; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; text-decoration: none; transition: all 0.2s; cursor: pointer; }
  .btn-primary-ext:hover { background: #22c55e; transform: translateY(-2px); box-shadow: 0 6px 24px rgba(74,222,128,0.35); }
  .btn-primary-ext.btn-lg { padding: 18px 48px; font-size: 18px; }
  .btn-ghost-ext { color: #a1a1aa; font-size: 14px; text-decoration: none; padding: 8px 16px; }
  .btn-ghost-ext:hover { color: #e4e4e7; }
  .btn-secondary-ext { color: #4ade80; font-size: 13px; text-decoration: none; margin-left: 12px; }
  .btn-secondary-ext:hover { text-decoration: underline; }
  .installed-badge { display: flex; flex-direction: column; align-items: center; gap: 4px; }

  .ext-section { max-width: 900px; margin: 0 auto; padding: 48px 24px; }
  .ext-section h2 { font-size: 24px; font-weight: 700; margin: 0 0 28px; text-align: center; }
  .ext-cta { text-align: center; padding: 60px 24px 80px; }
  .cta-note { font-size: 12px; color: #71717a; margin-top: 12px; }

  .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .step { background: rgba(22,25,22,0.8); border: 1px solid #27272a; border-radius: 16px; padding: 28px; text-align: center; }
  .step-num { font-size: 28px; display: block; margin-bottom: 12px; }
  .step h3 { font-size: 15px; font-weight: 700; margin: 0 0 8px; color: #e4e4e7; }
  .step p { font-size: 13px; color: #a1a1aa; margin: 0; line-height: 1.5; }

  .uni-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .uni-card-ext { background: rgba(22,25,22,0.7); border: 1px solid #27272a; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 4px; }
  .uni-card-ext strong { font-size: 13px; color: #e4e4e7; }
  .uni-campus { font-size: 11px; color: #71717a; }
  .uni-status { font-size: 10px; padding: 2px 8px; border-radius: 8px; align-self: flex-start; margin-top: 6px; font-weight: 600; }

  .fill-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .fill-col { background: rgba(22,25,22,0.8); border: 1px solid #27272a; border-radius: 16px; padding: 28px; }
  .fill-col h3 { font-size: 16px; font-weight: 700; margin: 0 0 16px; }
  .fill-col ul { list-style: none; padding: 0; margin: 0; }
  .fill-col li { font-size: 13px; color: #a1a1aa; padding: 6px 0; border-bottom: 1px solid rgba(39,39,42,0.5); }
  .fill-col li:last-child { border-bottom: none; }
  .fill-green { border-color: rgba(74,222,128,0.15); }
  .fill-amber { border-color: rgba(251,191,36,0.15); }

  @media (max-width: 768px) {
    .ext-hero h1 { font-size: 28px; }
    .steps-grid { grid-template-columns: 1fr; }
    .uni-grid { grid-template-columns: 1fr 1fr; }
    .fill-grid { grid-template-columns: 1fr; }
  }
`;
