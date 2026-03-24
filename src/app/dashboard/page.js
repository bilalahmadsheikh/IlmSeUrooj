'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './dashboard.module.css';
import TimelinePlanner from '@/components/Dashboard/TimelinePlanner';
import FeeEstimator from '@/components/Dashboard/FeeEstimator';
import DocumentVault from '@/components/Dashboard/DocumentVault';
import PaymentTracker from '@/components/Dashboard/PaymentTracker';
import DecisionHelper from '@/components/Dashboard/DecisionHelper';
import ReferralSystem from '@/components/Dashboard/ReferralSystem';
import NotificationSettings from '@/components/Dashboard/NotificationSettings';
import AnalyticsDashboard from '@/components/Dashboard/AnalyticsDashboard';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TABS = [
    { id: 'analytics', label: 'Overview', icon: '' },
    { id: 'timeline', label: 'Timeline', icon: '' },
    { id: 'fees', label: 'Fee Estimator', icon: '' },
    { id: 'documents', label: 'Documents', icon: '' },
    { id: 'payments', label: 'Payments', icon: '' },
    { id: 'decisions', label: 'Decisions', icon: '' },
    { id: 'referrals', label: 'Referrals', icon: '' },
    { id: 'notifications', label: 'Alerts', icon: '' },
];

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('analytics');
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data?.session) {
                setToken(data.session.access_token);
                setUser(data.session.user);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setToken(session?.access_token ?? null);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const apiFetch = useCallback(async (path, options = {}) => {
        if (!token) return null;
        const res = await fetch(path, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(options.headers ?? {}),
            },
        });
        return res.json();
    }, [token]);

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <p>Loading dashboard…</p>
            </div>
        );
    }

    if (!token) {
        return (
            <div className={styles.authRequired}>
                <h2>Sign in required</h2>
                <p>Please <a href="/profile">sign in</a> to access your dashboard.</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <div className={styles.logo}>
                        <a href="/" className={styles.backLink}>← Home</a>
                        <h1 className={styles.title}>
                            My Admission Dashboard
                        </h1>
                    </div>
                    <div className={styles.userInfo}>
                        <span className={styles.userEmail}>{user?.email}</span>
                    </div>
                </div>
            </header>

            <nav className={styles.tabs}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className={styles.tabLabel}>{tab.label}</span>
                    </button>
                ))}
            </nav>

            <main className={styles.main}>
                {activeTab === 'analytics' && <AnalyticsDashboard apiFetch={apiFetch} />}
                {activeTab === 'timeline' && <TimelinePlanner apiFetch={apiFetch} />}
                {activeTab === 'fees' && <FeeEstimator apiFetch={apiFetch} />}
                {activeTab === 'documents' && <DocumentVault apiFetch={apiFetch} token={token} />}
                {activeTab === 'payments' && <PaymentTracker apiFetch={apiFetch} />}
                {activeTab === 'decisions' && <DecisionHelper apiFetch={apiFetch} />}
                {activeTab === 'referrals' && <ReferralSystem apiFetch={apiFetch} userId={user?.id} />}
                {activeTab === 'notifications' && <NotificationSettings apiFetch={apiFetch} />}
            </main>
        </div>
    );
}
