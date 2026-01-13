'use client';

import { useTheme } from '@/context/ThemeContext';
import styles from './ThemeToggle.module.css';

// Get next theme label for accessibility
function getNextTheme(current) {
    const order = { dark: 'light', light: 'treasure', treasure: 'dark' };
    return order[current] || 'dark';
}

// Get theme display names
const themeLabels = {
    dark: 'Dark',
    light: 'Light',
    treasure: 'Map'
};

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const nextTheme = getNextTheme(theme);

    return (
        <button
            className={styles.toggle}
            onClick={toggleTheme}
            aria-label={`Switch to ${nextTheme} mode`}
            title={`Switch to ${nextTheme} mode`}
        >
            <div className={styles.iconWrapper}>
                {/* Sun Icon - Light Theme */}
                <svg
                    className={`${styles.icon} ${styles.sun} ${theme === 'light' ? styles.active : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>

                {/* Moon Icon - Dark Theme */}
                <svg
                    className={`${styles.icon} ${styles.moon} ${theme === 'dark' ? styles.active : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    {/* Stars */}
                    <circle cx="18" cy="6" r="1" fill="currentColor" className={styles.star} />
                    <circle cx="15" cy="3" r="0.5" fill="currentColor" className={styles.star} />
                </svg>

                {/* Compass/Map Icon - Treasure Theme */}
                <svg
                    className={`${styles.icon} ${styles.compass} ${theme === 'treasure' ? styles.active : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    {/* Compass circle */}
                    <circle cx="12" cy="12" r="10" />
                    {/* Compass needle */}
                    <polygon points="12,2 14,12 12,14 10,12" fill="currentColor" />
                    <polygon points="12,22 14,12 12,10 10,12" stroke="currentColor" strokeWidth="1" fill="none" />
                    {/* Cardinal directions */}
                    <path d="M12 5v2M12 17v2M5 12h2M17 12h2" strokeWidth="1.5" />
                </svg>
            </div>

            <span className={styles.label}>
                {themeLabels[theme]}
            </span>
        </button>
    );
}

