'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import styles from './FloatingPanel.module.css';
import { loadSavedFromStorage } from '@/utils/savedStorage';
import { upcomingDeadlines } from '@/data/universities';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const HIDDEN_PATHS = ['/profile', '/applications', '/extension', '/timeline'];

export default function FloatingPanel() {
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [open, setOpen] = useState(false);
    const [unseenCount, setUnseenCount] = useState(0);
    const [extensionInstalled, setExtensionInstalled] = useState(false);
    const [savedCount, setSavedCount] = useState(0);
    const [nextDeadlineDays, setNextDeadlineDays] = useState(null);
    const isHidden = HIDDEN_PATHS.includes(pathname);

    useEffect(() => {
        if (isHidden) return;
        supabase.auth.getSession().then(({ data }) => {
            if (data?.session?.user) {
                setUser(data.session.user);
                loadProfile(data.session.user.id);
                checkUnseen(data.session.user.id);
            }
        });
    }, [isHidden]);

    useEffect(() => {
        if (isHidden) return;
        try {
            const hasExtension = document.querySelector('#unimatch-extension-active');
            if (hasExtension) setExtensionInstalled(true);
        } catch (e) { }
    }, [isHidden]);

    useEffect(() => {
        if (isHidden) return;
        const saved = loadSavedFromStorage();
        setSavedCount(saved.length);

        const savedIdSet = new Set(saved.map(s => s.id));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let minDays = null;
        for (const d of upcomingDeadlines) {
            if (savedIdSet.size > 0 && !savedIdSet.has(d.id)) continue;
            const diff = Math.ceil((new Date(d.deadline) - today) / 86400000);
            if (diff >= 0 && (minDays === null || diff < minDays)) {
                minDays = diff;
            }
        }
        setNextDeadlineDays(minDays);
    }, [isHidden]);

    async function loadProfile(userId) {
        const { data } = await supabase.from('profiles')
            .select('profile_completion')
            .eq('id', userId).single();
        if (data) setProfile(data);
    }

    async function checkUnseen(userId) {
        const lastSeen = localStorage.getItem('applications_last_seen');
        if (!lastSeen) { setUnseenCount(0); return; }
        const { count } = await supabase.from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', userId)
            .gt('updated_at', lastSeen);
        setUnseenCount(count || 0);
    }

    if (isHidden || !user) return null;

    const completion = profile?.profile_completion || 0;

    if (!open) {
        return (
            <button className={styles.floatingBtn} onClick={() => setOpen(true)}
                aria-label="Quick actions">
                +
            </button>
        );
    }

    return (
        <>
            <div className={styles.panel}>
                <Link href="/applications" className={styles.panelRow}
                    onClick={() => {
                        localStorage.setItem('applications_last_seen', new Date().toISOString());
                        setOpen(false);
                    }}>
                    <span className={styles.panelIcon}>📊</span>
                    <span className={styles.panelLabel}>Applications</span>
                    {unseenCount > 0 && (
                        <span className={`${styles.panelBadge} ${styles.badgeCount}`}>{unseenCount}</span>
                    )}
                </Link>
                <Link href="/profile" className={styles.panelRow} onClick={() => setOpen(false)}>
                    <span className={styles.panelIcon}>👤</span>
                    <span className={styles.panelLabel}>Profile</span>
                    <span className={`${styles.panelBadge} ${styles.badgePercent}`}>{completion}%</span>
                </Link>
                <Link href="/" className={styles.panelRow} onClick={() => setOpen(false)}>
                    <span className={styles.panelIcon}>🔖</span>
                    <span className={styles.panelLabel}>Saved</span>
                    {savedCount > 0 && (
                        <span className={`${styles.panelBadge} ${styles.badgeSaved}`}>{savedCount}</span>
                    )}
                </Link>
                <Link href="/timeline" className={styles.panelRow} onClick={() => setOpen(false)}>
                    <span className={styles.panelIcon}>📅</span>
                    <span className={styles.panelLabel}>Timeline</span>
                    {nextDeadlineDays !== null && nextDeadlineDays <= 14 && (
                        <span className={`${styles.panelBadge} ${nextDeadlineDays <= 3 ? styles.badgeUrgent : styles.badgeSoon}`}>
                            {nextDeadlineDays === 0 ? 'Today!' : `${nextDeadlineDays}d`}
                        </span>
                    )}
                </Link>
                <Link href="/extension" className={styles.panelRow} onClick={() => setOpen(false)}>
                    <span className={styles.panelIcon}>🧩</span>
                    <span className={styles.panelLabel}>Extension</span>
                    <span className={`${styles.panelBadge} ${extensionInstalled ? styles.badgeActive : styles.badgeInactive}`}>
                        {extensionInstalled ? 'active' : 'not installed'}
                    </span>
                </Link>
            </div>
            <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close panel">
                ×
            </button>
        </>
    );
}
