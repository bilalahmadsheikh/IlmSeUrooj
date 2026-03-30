'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './Header.module.css';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase-browser';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { ProfileRing } from './ProfileRing';
import { IconBookmark, IconScholarship } from '@/components/Icons/Icons';

export default function Header({ savedCount = 0, onShowSaved, onShowScholarships }) {
    const safeShowSaved = typeof onShowSaved === 'function' ? onShowSaved : () => {};
    const safeShowScholarships = typeof onShowScholarships === 'function' ? onShowScholarships : () => {};
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const dropdownRef = useRef(null);
    const toolsRef = useRef(null);

    useEffect(() => {
        const supabase = getBrowserClient();
        supabase.auth.getSession().then(({ data }) => {
            if (data?.session?.user) {
                setUser(data.session.user);
                loadProfile(data.session.user.id);
            }
            setAuthChecked(true);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser(session.user);
                loadProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
            }
        });
        return () => subscription?.unsubscribe();
    }, []);

    async function loadProfile(userId) {
        const supabase = getBrowserClient();
        const { data } = await supabase.from('profiles')
            .select('full_name, profile_completion, education_system, ibcc_equivalent_inter, inter_status')
            .eq('id', userId).single();
        if (data) setProfile(data);
    }

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClick(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
            if (toolsRef.current && !toolsRef.current.contains(e.target)) {
                setShowToolsMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    async function handleSignOut() {
        await getBrowserClient().auth.signOut();
        setUser(null);
        setProfile(null);
        setShowDropdown(false);
    }

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    const hasIBCCWarning = profile?.education_system === 'cambridge' && !profile?.ibcc_equivalent_inter;
    const hasProjectedWarning = ['part1_only', 'appearing'].includes(profile?.inter_status);
    const ringWarning = hasIBCCWarning || hasProjectedWarning;

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <svg viewBox="0 0 40 40" fill="none" className={styles.capSvg}>
                            <defs>
                                <linearGradient id="capGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="var(--color-primary)" />
                                    <stop offset="100%" stopColor="var(--color-secondary)" />
                                </linearGradient>
                            </defs>
                            <path d="M20 8L4 16L20 24L36 16L20 8Z" fill="url(#capGradient)" className={styles.capTop} />
                            <path d="M8 18V26C8 26 14 32 20 32C26 32 32 26 32 26V18" stroke="url(#capGradient)" strokeWidth="2" fill="none" className={styles.capBottom} />
                            <path d="M32 16V22M32 22L34 28M32 22L30 28" stroke="var(--color-accent-2)" strokeWidth="2" strokeLinecap="round" className={styles.tassel} />
                        </svg>
                    </div>
                    <div className={styles.logoTextWrapper}>
                        <span className={styles.logoText}>
                            Ilm Se <span className={styles.highlight}>Urooj</span>
                        </span>
                        <span className={styles.urduText}>علم سے عروج</span>
                    </div>
                </Link>

                <nav className={styles.nav}>
                    <ThemeToggle />

                    <Link href="/" className={styles.navLink}><span className={styles.navLinkText}>Explore</span></Link>
                    <Link href="/timeline" className={styles.navLink}><span className={styles.navLinkText}>Timeline</span></Link>

                    {/* Tools dropdown */}
                    <div className={styles.toolsWrap} ref={toolsRef}>
                        <button
                            type="button"
                            className={`${styles.navLink} ${styles.toolsBtn} ${showToolsMenu ? styles.toolsBtnActive : ''}`}
                            onClick={() => setShowToolsMenu(v => !v)}
                            aria-haspopup="true"
                            aria-expanded={showToolsMenu}
                        >
                            <span className={styles.navLinkText}>Tools</span>
                            <svg className={`${styles.toolsChevron} ${showToolsMenu ? styles.toolsChevronOpen : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        {showToolsMenu && (
                            <div className={styles.toolsDropdown} role="menu">
                                <a href="/#compare" className={styles.toolsItem} onClick={() => setShowToolsMenu(false)}>
                                    <span className={styles.toolsItemIcon}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg>
                                    </span>
                                    <span className={styles.toolsItemText}>
                                        <span className={styles.toolsItemName}>Compare Universities</span>
                                        <span className={styles.toolsItemDesc}>Side-by-side comparison</span>
                                    </span>
                                </a>
                                <a href="/#predictor" className={styles.toolsItem} onClick={() => setShowToolsMenu(false)}>
                                    <span className={styles.toolsItemIcon}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                    </span>
                                    <span className={styles.toolsItemText}>
                                        <span className={styles.toolsItemName}>Admission Predictor</span>
                                        <span className={styles.toolsItemDesc}>Estimate your chances</span>
                                    </span>
                                </a>
                                <a href="/#entry-tests" className={styles.toolsItem} onClick={() => setShowToolsMenu(false)}>
                                    <span className={styles.toolsItemIcon}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                                    </span>
                                    <span className={styles.toolsItemText}>
                                        <span className={styles.toolsItemName}>Entry Test Guide</span>
                                        <span className={styles.toolsItemDesc}>Cutoffs & prep info</span>
                                    </span>
                                </a>
                            </div>
                        )}
                    </div>

                    <button type="button" className={styles.scholarshipsBtn} onClick={safeShowScholarships}
                        title="Scholarships and financial aid" aria-label="Open scholarships and financial aid">
                        <IconScholarship className={styles.scholarshipsIcon} aria-hidden />
                        <span className={styles.scholarshipsText}>Scholarships</span>
                    </button>

                    <button className={styles.savedBtn} onClick={safeShowSaved}
                        title={savedCount > 0 ? `View your shortlist (${savedCount} saved)` : 'View saved universities'}
                        aria-label={savedCount > 0 ? `Open saved list, ${savedCount} universities` : 'Open saved list'}>
                        <IconBookmark className={styles.savedIcon} aria-hidden />
                        <span className={styles.savedText}>Saved</span>
                        {savedCount > 0 && (
                            <span className={styles.badge} key={savedCount} data-count={savedCount}>{savedCount}</span>
                        )}
                    </button>

                    {/* Auth-dependent section */}
                    {authChecked && !user && (
                        <>
                            <Link href="/profile" className={styles.ghostBtn}>Sign In</Link>
                            <Link href="/profile" className={styles.primaryBtn}>Create Profile →</Link>
                        </>
                    )}

                    {user && profile && (
                        <div className={styles.authSection} ref={dropdownRef}>
                            <Link href="/profile" className={styles.ringLink} title={
                                ringWarning
                                    ? hasIBCCWarning
                                        ? 'IBCC equivalence missing — needed for applications'
                                        : 'Using projected marks'
                                    : `Profile ${profile.profile_completion || 0}% complete`
                            }>
                                <ProfileRing percent={profile.profile_completion || 0} warning={ringWarning} />
                            </Link>
                            <button className={styles.initialsBtn} onClick={() => setShowDropdown(!showDropdown)}>
                                <span className={styles.initialsCircle}>{initials}</span>
                                <span className={styles.chevron}>▾</span>
                            </button>
                            {showDropdown && (
                                <div className={styles.dropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <strong>{profile.full_name || 'Student'}</strong>
                                        <span>{user.email}</span>
                                    </div>
                                    <div className={styles.dropdownDivider} />
                                    <Link href="/profile" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>
                                        My Profile
                                    </Link>
                                    <Link href="/applications" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>
                                        Applications
                                    </Link>
                                    <Link href="/timeline" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>
                                        Timeline
                                    </Link>
                                    <Link href="/extension" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>
                                        Extension
                                    </Link>
                                    <div className={styles.dropdownDivider} />
                                    <button className={styles.dropdownSignout} onClick={handleSignOut}>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}
