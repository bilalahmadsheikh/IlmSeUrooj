'use client';

import styles from './Header.module.css';
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
