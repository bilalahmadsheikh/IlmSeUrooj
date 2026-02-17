'use client';

import { useEffect } from 'react';
import styles from './Toast.module.css';
import { IconCheck, IconClose } from '@/components/Icons/Icons';

export default function Toast({ message, type = 'success', onDismiss, duration = 3000 }) {
    useEffect(() => {
        const t = setTimeout(() => onDismiss?.(), duration);
        return () => clearTimeout(t);
    }, [duration, onDismiss]);

    return (
        <div className={`${styles.toast} ${styles[type]}`} role="alert">
            <span className={styles.icon}>
                {type === 'removed' ? <IconClose aria-hidden /> : <IconCheck aria-hidden />}
            </span>
            <span className={styles.message}>{message}</span>
            <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
                <IconClose aria-hidden />
            </button>
        </div>
    );
}
