'use client';

import styles from './Header.module.css';
import Link from 'next/link';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { IconBookmark, IconScholarship } from '@/components/Icons/Icons';

export default function Header({ savedCount, onShowSaved, onShowScholarships }) {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>
                        {/* Animated graduation cap SVG */}
                        <svg viewBox="0 0 40 40" fill="none" className={styles.capSvg}>
                            <defs>
                                <linearGradient id="capGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="var(--color-primary)" />
                                    <stop offset="100%" stopColor="var(--color-secondary)" />
                                </linearGradient>
                            </defs>
                            {/* Cap base */}
                            <path
                                d="M20 8L4 16L20 24L36 16L20 8Z"
                                fill="url(#capGradient)"
                                className={styles.capTop}
                            />
                            {/* Cap bottom */}
                            <path
                                d="M8 18V26C8 26 14 32 20 32C26 32 32 26 32 26V18"
                                stroke="url(#capGradient)"
                                strokeWidth="2"
                                fill="none"
                                className={styles.capBottom}
                            />
                            {/* Tassel */}
                            <path
                                d="M32 16V22M32 22L34 28M32 22L30 28"
                                stroke="var(--color-accent-2)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                className={styles.tassel}
                            />
                        </svg>
                    </div>
                    <span className={styles.logoText}>
                        Uni<span className={styles.highlight}>Match</span>
                    </span>
                </div>

                <nav className={styles.nav}>
                    <ThemeToggle />

                    <Link href="/profile" className={styles.navLink} title="Manage your student profile">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span className={styles.navLinkText}>Profile</span>
                    </Link>

                    <Link href="/applications" className={styles.navLink} title="View application dashboard">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                        </svg>
                        <span className={styles.navLinkText}>Applications</span>
                    </Link>

                    <Link href="/extension" className={styles.navLink} title="Get the UniMatch extension">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                        </svg>
                        <span className={styles.navLinkText}>Extension</span>
                    </Link>

                    <button
                        type="button"
                        className={styles.scholarshipsBtn}
                        onClick={onShowScholarships}
                        title="Scholarships and financial aid"
                        aria-label="Open scholarships and financial aid"
                    >
                        <IconScholarship className={styles.scholarshipsIcon} aria-hidden />
                        <span className={styles.scholarshipsText}>Scholarships</span>
                    </button>

                    <button
                        className={styles.savedBtn}
                        onClick={onShowSaved}
                        title={savedCount > 0 ? `View your shortlist (${savedCount} saved)` : 'View saved universities'}
                        aria-label={savedCount > 0 ? `Open saved list, ${savedCount} universities` : 'Open saved list'}
                    >
                        <IconBookmark className={styles.savedIcon} aria-hidden />
                        <span className={styles.savedText}>Saved</span>
                        {savedCount > 0 && (
                            <span className={styles.badge} key={savedCount} data-count={savedCount}>
                                {savedCount}
                            </span>
                        )}
                    </button>
                </nav>
            </div>
        </header>
    );
}

