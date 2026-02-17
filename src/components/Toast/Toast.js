'use client';

import { useEffect } from 'react';
import styles from './Toast.module.css';

export default function Toast({ message, type = 'success', onDismiss, duration = 3000 }) {
    useEffect(() => {
        const t = setTimeout(() => onDismiss?.(), duration);
        return () => clearTimeout(t);
    }, [duration, onDismiss]);

    const icons = {
        success: '✓',
        removed: '✕',
        info: 'ℹ',
    };
    const icon = icons[type] ?? icons.success;

    return (
        <div className={`${styles.toast} ${styles[type]}`} role="alert">
            <span className={styles.icon}>{icon}</span>
            <span className={styles.message}>{message}</span>
            <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">×</button>
        </div>
    );
}
