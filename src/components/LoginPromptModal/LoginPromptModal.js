'use client';

import Link from 'next/link';
import styles from './LoginPromptModal.module.css';

/**
 * Lightweight modal shown when a guest tries to save a university.
 * Offers: Sign In, Create Account, or Continue as Guest.
 */
export default function LoginPromptModal({ universityName, onContinueAsGuest, onDismiss }) {
    return (
        <div className={styles.overlay} onClick={onDismiss}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onDismiss} aria-label="Close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <div className={styles.icon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                </div>

                <h3 className={styles.title}>Save to Your Shortlist</h3>
                <p className={styles.desc}>
                    {universityName
                        ? <>Sign in to save <strong>{universityName}</strong> and sync across all your devices.</>
                        : <>Sign in to save universities and sync your shortlist across all your devices.</>
                    }
                </p>

                <div className={styles.actions}>
                    <Link href="/profile" className={styles.primaryBtn}>
                        Sign In / Create Account
                    </Link>
                    <button type="button" className={styles.ghostBtn} onClick={onContinueAsGuest}>
                        Continue as Guest
                    </button>
                </div>

                <p className={styles.footnote}>
                    Guest saves are stored locally and won't sync across devices.
                </p>
            </div>
        </div>
    );
}
