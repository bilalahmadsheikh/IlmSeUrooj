'use client';

import styles from './Header.module.css';

export default function Header({ savedCount, onShowSaved }) {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>🎓</span>
                    <span className={styles.logoText}>
                        Uni<span className={styles.highlight}>Match</span>
                    </span>
                </div>

                <nav className={styles.nav}>
                    <button className={styles.savedBtn} onClick={onShowSaved}>
                        <span className={styles.savedIcon}>💚</span>
                        <span className={styles.savedText}>Saved</span>
                        {savedCount > 0 && (
                            <span className={styles.badge}>{savedCount}</span>
                        )}
                    </button>
                </nav>
            </div>
        </header>
    );
}
