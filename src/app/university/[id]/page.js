'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { universities, lastScraperRun } from '@/data/universities';
import { departmentDetails } from '@/data/departmentData';
import { getAlumniLinks } from '@/data/alumniLinks';
import { getAlumniPulse, COUNTRY_COORDS } from '@/data/alumniPulseData';
import Header from '@/components/Header/Header';
import AnimatedBackground from '@/components/Background/AnimatedBackground';
import LoginPromptModal from '@/components/LoginPromptModal/LoginPromptModal';
import { IconArrowLeft, IconExternalLink, IconCalendar, IconBookmark, IconCheck, IconShield, IconLinkedIn } from '@/components/Icons/Icons';
import { loadSavedFromStorage, saveToStorage } from '@/utils/savedStorage';
import { useProfile } from '@/hooks/useProfile';
import { getUniversitySlug, getPortalDomain } from '@/utils/universityHelpers';
import styles from './page.module.css';

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-PK', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
}

function getDaysUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

function getHostname(url) {
  if (!url) return '';
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getSimilarUniversities(current, limit = 4) {
  if (!current) return [];
  const sameCity = universities.filter((u) => u.id !== current.id && u.city === current.city);
  const topField = Object.keys(current.fieldRankings || {})[0];
  const sameField = topField
    ? universities.filter(
        (u) => u.id !== current.id && !sameCity.some((c) => c.id === u.id) && (u.fieldRankings || {})[topField]
      )
    : [];
  const combined = [...sameCity, ...sameField];
  const seen = new Set();
  return combined.filter((u) => !seen.has(u.id) && seen.add(u.id)).slice(0, limit);
}

export default function UniversityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? parseInt(params.id, 10) : null;
  const { profile } = useProfile();
  const isLoggedIn = !!profile;

  const goHome = useCallback(() => router.push('/'), [router]);

  const [uni, setUni] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [alumniFieldFilter, setAlumniFieldFilter] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }
    const found = universities.find((u) => u.id === id);
    if (found) {
      setUni(found);
      const stored = loadSavedFromStorage();
      setSavedCount(stored.length);
      setSaved(stored.some((i) => i.id === found.id));
      const progs = found.programs || {};
      const fieldsWithPrograms = (found.fields || []).filter((f) => progs[f]?.length > 0);
      setSelectedField(fieldsWithPrograms[0] || null);
    } else {
      setNotFound(true);
    }
  }, [id]);

  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const performSave = useCallback(async () => {
    if (!uni || saved) return;
    const stored = loadSavedFromStorage();
    const hydrated = stored
      .map(({ id, savedAt, tag, note }) => {
        const u = universities.find((x) => x.id === parseInt(id, 10) || x.id === id);
        return u ? { university: u, savedAt, tag, note } : null;
      })
      .filter(Boolean);
    saveToStorage([...hydrated, { university: uni, savedAt: Date.now(), tag: null, note: '' }]);
    setSaved(true);
    setSavedCount(prev => prev + 1);
    setToast(`${uni.shortName} saved!`);
    setTimeout(() => setToast(null), 2500);

    if (isLoggedIn) {
      const slug = getUniversitySlug(uni);
      const domain = getPortalDomain(uni);
      if (slug && domain) {
        try {
          await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              university_slug: slug,
              university_name: uni.shortName ?? uni.name,
              portal_domain: domain,
              status: 'saved',
            }),
          });
        } catch { /* network error, localStorage is fallback */ }
      }
    }
  }, [uni, saved, isLoggedIn]);

  const handleSave = useCallback(() => {
    if (!uni || saved) return;
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    performSave();
  }, [uni, saved, isLoggedIn, performSave]);

  const handleSaveAsGuest = useCallback(() => {
    setShowLoginPrompt(false);
    performSave();
  }, [performSave]);

  const handleCopyLink = useCallback(async () => {
    const url = uni?.admissions?.applyUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  }, [uni]);

  const handleShare = useCallback(async () => {
    if (!uni) return;
    const title = `${uni.shortName} - Ilm Se Urooj`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setToast('Link copied!');
        setTimeout(() => setToast(null), 2000);
      }
    } catch (_) {}
  }, [uni]);

  if (notFound || (!uni && id)) {
    return (
      <main className={styles.main}>
        <AnimatedBackground />
        <Header savedCount={savedCount} onShowSaved={goHome} onShowScholarships={goHome} />
        <div className={styles.notFound}>
          <h1>University Not Found</h1>
          <p>The university you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/" className={styles.backLink}>
            <IconArrowLeft aria-hidden /> Back to Explore
          </Link>
        </div>
      </main>
    );
  }

  if (!uni) {
    return (
      <main className={styles.main}>
        <AnimatedBackground />
        <Header savedCount={savedCount} onShowSaved={goHome} onShowScholarships={goHome} />
        <div className={styles.loading}>Loading...</div>
      </main>
    );
  }

  const admissions = uni.admissions || {};
  const deadlineFormatted = formatDate(admissions.deadline);
  const testDateFormatted = formatDate(admissions.testDate);
  const daysLeft = getDaysUntil(admissions.deadline);
  const fieldRankings = uni.fieldRankings || {};
  const programs = uni.programs || {};
  const fields = uni.fields || [];
  const highlights = uni.highlights || [];
  const similar = getSimilarUniversities(uni);
  const totalPrograms = Object.values(programs).flat().length;
  const yearsActive = uni.established ? new Date().getFullYear() - uni.established : null;
  const topFieldRank = Object.values(fieldRankings)[0];

  return (
    <main className={styles.main}>
      <AnimatedBackground />
      <Header savedCount={savedCount} onShowSaved={goHome} onShowScholarships={goHome} />

      {/* Quick nav */}
      <nav className={styles.quickNav} aria-label="Page sections">
        <a href="#overview">Overview</a>
        <a href="#rankings">Rankings</a>
        <a href="#admissions">Admissions</a>
        <a href="#about">About</a>
        <a href="#programs">Programs</a>
        <a href="#alumni">Alumni</a>
        <a href="#similar">Similar</a>
      </nav>

      <div className={styles.pageWrap}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/" className={styles.breadcrumbLink}>Explore</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{uni.shortName}</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroTop}>
            <Link href="/" className={styles.backBtn} aria-label="Back to explore">
              <IconArrowLeft aria-hidden /> Back
            </Link>
            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.shareBtn}
                onClick={handleShare}
                aria-label="Share this page"
              >
                Share
              </button>
              <button
                type="button"
                className={`${styles.saveBtn} ${saved ? styles.savedBtn : ''}`}
                onClick={handleSave}
                disabled={saved}
                aria-pressed={saved}
              >
                {saved ? <><IconCheck aria-hidden /> Saved</> : <><IconBookmark aria-hidden /> Save</>}
              </button>
            </div>
          </div>

          <div className={styles.heroInner}>
            <div className={styles.logoSection}>
              {uni.logo && !logoError ? (
                <div className={styles.logoImgWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uni.logo} alt={`${uni.shortName} logo`} className={styles.logoImg} onError={() => setLogoError(true)} />
                </div>
              ) : (
                <div className={styles.logoBox}>
                  <span className={styles.logoLetter}>{uni.shortName.charAt(0)}</span>
                </div>
              )}
              {fields.length > 0 && (
                <div className={styles.fieldsPills}>
                  {fields.slice(0, 5).map((f) => (
                    <span key={f} className={styles.fieldPill}>{f}</span>
                  ))}
                </div>
              )}
            </div>

            <h1 className={styles.heroTitle}>{uni.shortName}</h1>
            <p className={styles.heroFullName}>{uni.name}</p>

            {/* At a glance stats */}
            <div className={styles.statsRow}>
              {uni.ranking && (
                <div className={styles.statCard}>
                  <span className={styles.statValue}>#{uni.ranking}</span>
                  <span className={styles.statLabel}>Pakistan</span>
                </div>
              )}
              {yearsActive != null && (
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{yearsActive}+</span>
                  <span className={styles.statLabel}>Years</span>
                </div>
              )}
              {totalPrograms > 0 && (
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{totalPrograms}</span>
                  <span className={styles.statLabel}>Programs</span>
                </div>
              )}
              {topFieldRank && Object.keys(fieldRankings)[0] && (
                <div className={styles.statCard}>
                  <span className={styles.statValue}>#{topFieldRank}</span>
                  <span className={styles.statLabel}>{Object.keys(fieldRankings)[0]}</span>
                </div>
              )}
            </div>

            <div className={styles.heroMeta}>
              <span className={styles.heroRank}>#{uni.ranking} in Pakistan</span>
              <span className={styles.heroDot}>•</span>
              <span>{uni.city}</span>
              <span className={styles.heroDot}>•</span>
              <span>{uni.type}</span>
            </div>

            {/* Verified badge */}
            {lastScraperRun && (
              <div className={styles.verifiedBadge}>
                <IconShield className={styles.verifiedIcon} aria-hidden />
                <span>Data verified {lastScraperRun}</span>
              </div>
            )}

            {/* Deadline - clean inline badge */}
            {admissions.deadline && daysLeft != null && (
              <div className={styles.deadlineBadge}>
                <IconCalendar className={styles.deadlineIcon} aria-hidden />
                <span>
                  {daysLeft > 0 ? (
                    <>Apply by {deadlineFormatted?.split(',')[0]} — <strong>{daysLeft} days left</strong></>
                  ) : daysLeft === 0 ? (
                    <strong>Apply today — deadline!</strong>
                  ) : (
                    <>Deadline passed — check portal for extensions</>
                  )}
                </span>
              </div>
            )}

            <div className={styles.heroCtas}>
              {admissions.applyUrl && (
                <>
                  <a
                    href={admissions.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.applyCta}
                    aria-label={`Apply to ${uni.shortName}`}
                  >
                    <IconExternalLink aria-hidden /> Apply Now
                  </a>
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={handleCopyLink}
                    aria-label="Copy application link"
                  >
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                </>
              )}
              {uni.website && (
                <a
                  href={uni.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.websiteCta}
                  aria-label={`Visit ${uni.shortName} website`}
                >
                  Official Website <IconExternalLink aria-hidden />
                </a>
              )}
            </div>
          </div>
        </header>

        <section className={styles.content}>
          {/* Overview & Key Info */}
          <div id="overview" className={styles.keyTakeaways}>
            <h3 className={styles.keyTakeawaysTitle}>At a glance</h3>
            <ul className={styles.keyTakeawaysList}>
              {uni.ranking && <li>Overall <strong>#{uni.ranking}</strong> among Pakistani universities</li>}
              {uni.city && <li>Located in <strong>{uni.city}</strong></li>}
              {fields.length > 0 && <li>Programs in <strong>{fields.length} fields</strong></li>}
              {admissions.deadline && <li>Apply by <strong>{deadlineFormatted}</strong></li>}
              {admissions.testName && <li>Entry test: <strong>{admissions.testName}</strong></li>}
              {Object.keys(fieldRankings).length > 0 && (
                <li>Strongest in <strong>{Object.keys(fieldRankings)[0]}</strong> (rank #{fieldRankings[Object.keys(fieldRankings)[0]]})</li>
              )}
            </ul>
          </div>

          {/* Field Rankings - Clear & Visual */}
          {Object.keys(fieldRankings).length > 0 && (
            <section id="rankings" className={styles.card} aria-labelledby="rankings-heading">
              <h2 id="rankings-heading" className={styles.cardTitle}>Field rankings</h2>
              <p className={styles.rankingsIntro}>
                How {uni.shortName} ranks across key fields among Pakistani universities. Lower number = better rank.
              </p>
              <div className={styles.rankingsTable}>
                <div className={styles.rankingsHeader}>
                  <span>Field</span>
                  <span>Rank in Pakistan</span>
                </div>
                {Object.entries(fieldRankings)
                  .sort(([, a], [, b]) => a - b)
                  .map(([field, rank]) => (
                    <div key={field} className={`${styles.rankingsRow} ${rank <= 3 ? styles.rankingsRowTop : ''}`}>
                      <span className={styles.rankingsField}>{field}</span>
                      <span className={styles.rankingsValue}>
                        <span className={styles.rankingsNum}>#{rank}</span>
                        {rank === 1 && <span className={styles.rankingsBadge}>Top</span>}
                        {rank === 2 && <span className={styles.rankingsBadge}>2nd</span>}
                        {rank === 3 && <span className={styles.rankingsBadge}>3rd</span>}
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Admissions & Deadlines */}
          {(admissions.deadline || admissions.testName || admissions.applyUrl) && (
            <section id="admissions" className={styles.card} aria-labelledby="admissions-heading">
              <div className={styles.cardHeaderRow}>
                <h2 id="admissions-heading" className={styles.cardTitle}>
                  <IconCalendar className={styles.cardIcon} aria-hidden />
                  Admissions
                </h2>
                {lastScraperRun && (
                  <span className={styles.cardVerified}>
                    <IconShield aria-hidden /> Verified
                  </span>
                )}
              </div>
              {admissions.deadline && admissions.testName && (
                <div className={styles.timeline}>
                  <div className={styles.timelineStep}>
                    <span className={styles.timelineNum}>1</span>
                    <span>Apply online before {deadlineFormatted?.split(',')[0]}</span>
                  </div>
                  <div className={styles.timelineStep}>
                    <span className={styles.timelineNum}>2</span>
                    <span>Take {admissions.testName} ({testDateFormatted?.split(',')[0]})</span>
                  </div>
                  <div className={styles.timelineStep}>
                    <span className={styles.timelineNum}>3</span>
                    <span>Check merit &amp; portal for results</span>
                  </div>
                </div>
              )}
              <div className={styles.admissionsGrid}>
                {admissions.deadline && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Application Deadline</span>
                    <span className={styles.infoValue}>{deadlineFormatted || admissions.deadline}</span>
                  </div>
                )}
                {admissions.testName && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Entry Test</span>
                    <span className={styles.infoValue}>{admissions.testName}</span>
                  </div>
                )}
                {admissions.testDate && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Test Date</span>
                    <span className={styles.infoValue}>{testDateFormatted || admissions.testDate}</span>
                  </div>
                )}
              </div>
              {admissions.applyUrl && (
                <a
                  href={admissions.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.applyLink}
                >
                  Open Application Portal <IconExternalLink aria-hidden />
                </a>
              )}
            </section>
          )}

          {/* Official Links - Verified */}
          {(admissions.applyUrl || uni.website) && (
            <section className={styles.card} aria-labelledby="official-heading">
              <h2 id="official-heading" className={styles.cardTitle}>
                <IconShield className={styles.cardIcon} aria-hidden />
                Official Links
              </h2>
              <p className={styles.officialNote}>Direct links to official university sources</p>
              <div className={styles.officialLinks}>
                {admissions.applyUrl && (
                  <a
                    href={admissions.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.officialCard}
                  >
                    <span className={styles.officialLabel}>Application Portal</span>
                    <span className={styles.officialUrl}>{getHostname(admissions.applyUrl)}</span>
                    <IconExternalLink className={styles.officialIcon} aria-hidden />
                  </a>
                )}
                {uni.website && (
                  <a
                    href={uni.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.officialCard}
                  >
                    <span className={styles.officialLabel}>University Website</span>
                    <span className={styles.officialUrl}>{getHostname(uni.website)}</span>
                    <IconExternalLink className={styles.officialIcon} aria-hidden />
                  </a>
                )}
              </div>
            </section>
          )}

          {/* About */}
          <section id="about" className={styles.card} aria-labelledby="about-heading">
            <h2 id="about-heading" className={styles.cardTitle}>About {uni.shortName}</h2>
            {uni.description && <p className={styles.description}>{uni.description}</p>}
            <div className={styles.factsGrid}>
              {uni.established && (
                <div className={styles.fact}>
                  <span className={styles.factLabel}>Established</span>
                  <span className={styles.factValue}>{uni.established}</span>
                </div>
              )}
              {uni.type && (
                <div className={styles.fact}>
                  <span className={styles.factLabel}>Type</span>
                  <span className={styles.factValue}>{uni.type}</span>
                </div>
              )}
              {uni.city && (
                <div className={styles.fact}>
                  <span className={styles.factLabel}>City</span>
                  <span className={styles.factValue}>{uni.city}</span>
                </div>
              )}
              {uni.campusType && (
                <div className={styles.fact}>
                  <span className={styles.factLabel}>Focus</span>
                  <span className={styles.factValue}>{uni.campusType}</span>
                </div>
              )}
              {uni.hostelAvailability && (
                <div className={styles.fact}>
                  <span className={styles.factLabel}>Campus & hostels</span>
                  <span className={styles.factValue}>{uni.hostelAvailability}</span>
                </div>
              )}
            </div>
            {uni.facilities?.length > 0 && (
              <div className={styles.facilitiesSection}>
                <h3 className={styles.sectionHeading}>Campus Facilities</h3>
                <div className={styles.facilitiesList}>
                  {uni.facilities.map((f, i) => (
                    <span key={i} className={styles.facilityTag}>{f}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Fees */}
          {uni.avgFee && (
            <section id="fees" className={styles.card} aria-labelledby="fees-heading">
              <h2 id="fees-heading" className={styles.cardTitle}>Fee structure</h2>
              <p className={styles.feeText}>{uni.avgFee}</p>
              <p className={styles.feeNote}>Confirm exact amounts on the official portal.</p>
            </section>
          )}

          {/* Programs by Field - with field selector */}
          {fields.length > 0 && (
            <section id="programs" className={styles.card} aria-labelledby="programs-heading">
              <h2 id="programs-heading" className={styles.cardTitle}>Programs offered</h2>
              <p className={styles.programsNote}>
                {uni.shortName} offers many more programs — visit the official portal for the complete list.
              </p>
              {/* Field selector - when multiple fields */}
              {fields.filter((f) => programs[f]?.length > 0).length > 1 && (
                <div className={styles.fieldSelector} role="tablist" aria-label="Select field to view programs">
                  {fields
                    .filter((f) => programs[f]?.length > 0)
                    .map((f) => (
                      <button
                        key={f}
                        type="button"
                        role="tab"
                        aria-selected={selectedField === f}
                        className={`${styles.fieldTab} ${selectedField === f ? styles.fieldTabActive : ''}`}
                        onClick={() => setSelectedField(f)}
                      >
                        {f}
                      </button>
                    ))}
                </div>
              )}
              {/* Programs for selected field */}
              {selectedField && programs[selectedField]?.length > 0 && (
                <div className={styles.programBlock}>
                  <h3 className={styles.programField}>
                    {selectedField}
                    {fieldRankings[selectedField] && (
                      <span className={styles.programFieldRank}>Rank #{fieldRankings[selectedField]} in Pakistan</span>
                    )}
                  </h3>
                  <ul className={styles.programList}>
                    {programs[selectedField].map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                  {/* Department details from verified data when available */}
                  {(() => {
                    const dept = departmentDetails[uni.id]?.[selectedField];
                    if (!dept) return null;
                    return (
                      <div className={styles.deptDetails}>
                        <h4 className={styles.deptDetailsTitle}>Field performance (HEC &amp; industry data)</h4>
                        <div className={styles.deptDetailsGrid}>
                          {dept.placementRate && (
                            <div className={styles.deptDetail}>
                              <span className={styles.deptDetailLabel}>Placement rate</span>
                              <span className={styles.deptDetailValue}>{dept.placementRate}</span>
                            </div>
                          )}
                          {dept.avgStartingSalary && (
                            <div className={styles.deptDetail}>
                              <span className={styles.deptDetailLabel}>Avg starting salary</span>
                              <span className={styles.deptDetailValue}>{dept.avgStartingSalary}</span>
                            </div>
                          )}
                          {dept.phdFaculty && (
                            <div className={styles.deptDetail}>
                              <span className={styles.deptDetailLabel}>PhD faculty</span>
                              <span className={styles.deptDetailValue}>{dept.phdFaculty}</span>
                            </div>
                          )}
                          {dept.facultyStrength && (
                            <div className={styles.deptDetail}>
                              <span className={styles.deptDetailLabel}>Faculty quality</span>
                              <span className={styles.deptDetailValue}>{dept.facultyStrength}</span>
                            </div>
                          )}
                        </div>
                        {dept.internshipPartners?.length > 0 && (
                          <p className={styles.deptPartners}>
                            <span className={styles.deptDetailLabel}>Key recruiters:</span>{' '}
                            {dept.internshipPartners.join(', ')}
                          </p>
                        )}
                        {dept.facilities?.length > 0 && (
                          <p className={styles.deptPartners}>
                            <span className={styles.deptDetailLabel}>Facilities:</span>{' '}
                            {dept.facilities.join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              {uni.website && (
                <p className={styles.programsCta}>
                  <a href={uni.website} target="_blank" rel="noopener noreferrer" className={styles.programsLink}>
                    View all programs on official website <IconExternalLink aria-hidden />
                  </a>
                </p>
              )}
            </section>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <section className={styles.card} aria-labelledby="highlights-heading">
              <h2 id="highlights-heading" className={styles.cardTitle}>Highlights</h2>
              <ul className={styles.highlightList}>
                {highlights.map((h, i) => (
                  <li key={i} className={styles.highlightItem}>{h}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Degree Levels */}
          {uni.degreeLevel?.length > 0 && (
            <section className={styles.card} aria-labelledby="degrees-heading">
              <h2 id="degrees-heading" className={styles.cardTitle}>Degree Levels</h2>
              <div className={styles.degreeTags}>
                {uni.degreeLevel.map((d, i) => (
                  <span key={i} className={styles.degreeTag}>{d}</span>
                ))}
              </div>
            </section>
          )}

          {/* Alumni Pulse */}
          {(() => {
            const pulse = getAlumniPulse(uni.id, alumniFieldFilter);
            const alumni = getAlumniLinks(uni.shortName);
            if (!pulse && !alumni) return null;
            const snap = pulse?.outcomeSnapshot;
            const reachEntries = pulse?.reachMap ? Object.entries(pulse.reachMap) : [];
            const countryFlags = { UAE: "🇦🇪", UK: "🇬🇧", USA: "🇺🇸", PK: "🇵🇰", DE: "🇩🇪", CA: "🇨🇦", SA: "🇸🇦", SG: "🇸🇬", AU: "🇦🇺" };
            return (
              <section id="alumni" className={styles.alumniPulse} aria-labelledby="alumni-heading">
                <div className={styles.alumniPulseHeader}>
                  <h2 id="alumni-heading" className={styles.alumniPulseTitle}>Alumni Pulse</h2>
                  <p className={styles.alumniPulseTagline}>What life looks like after {uni.shortName}</p>
                </div>

                {pulse && (
                  <>
                    {/* 1. Outcome Snapshot */}
                    {snap && (
                      <div className={styles.pulseBlock}>
                        <h3 className={styles.pulseBlockTitle}>Where are they now?</h3>
                        <div className={styles.outcomeGrid}>
                          <div className={styles.outcomeItem}>
                            <span className={styles.outcomeIcon}>🌍</span>
                            <span className={styles.outcomeValue}>{snap.abroadPercent != null ? `${snap.abroadPercent}%` : "—"}</span>
                            <span className={styles.outcomeLabel}>working abroad</span>
                          </div>
                          <div className={styles.outcomeItem}>
                            <span className={styles.outcomeIcon}>🏢</span>
                            <span className={styles.outcomeValue}>{Array.isArray(snap.topEmployers) ? snap.topEmployers.slice(0, 3).join(", ") : "—"}</span>
                            <span className={styles.outcomeLabel}>top employers</span>
                          </div>
                          <div className={styles.outcomeItem}>
                            <span className={styles.outcomeIcon}>🚀</span>
                            <span className={styles.outcomeValue}>{snap.startupsFounded != null ? `${snap.startupsFounded}+` : "—"}</span>
                            <span className={styles.outcomeLabel}>startups founded</span>
                          </div>
                          <div className={styles.outcomeItem}>
                            <span className={styles.outcomeIcon}>📈</span>
                            <span className={styles.outcomeValue}>{snap.employedWithin6Months != null ? `${snap.employedWithin6Months}%` : "—"}</span>
                            <span className={styles.outcomeLabel}>employed within 6 mo</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Network Strength Meter */}
                    {pulse.networkStrength != null && (
                      <div className={styles.pulseBlock}>
                        <div className={styles.strengthHeader}>
                          <h3 className={styles.pulseBlockTitle}>Alumni network strength</h3>
                          <span className={styles.strengthScore}>{pulse.networkStrength}/10</span>
                        </div>
                        <div className={styles.strengthBar}>
                          <div className={styles.strengthFill} style={{ width: `${pulse.networkStrength * 10}%` }} />
                        </div>
                      </div>
                    )}

                    {/* 4. Reach Map Micro */}
                    {reachEntries.length > 0 && (
                      <div className={styles.pulseBlock}>
                        <h3 className={styles.pulseBlockTitle}>Alumni reach</h3>
                        <div className={styles.reachMapWrap}>
                          <div className={styles.reachMapSvg} aria-hidden>
                            <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
                              <ellipse cx="50" cy="30" rx="45" ry="25" fill="rgba(16,185,129,0.03)" stroke="rgba(16,185,129,0.15)" strokeWidth="0.5" />
                              {reachEntries.map(([code, count]) => {
                                const c = COUNTRY_COORDS[code] || { x: 50, y: 30 };
                                const r = 2 + Math.min(count / 50, 3);
                                const countryName = code === "PK" ? "Pakistan" : code;
                                return (
                                  <g key={code}>
                                    <title>{count} alumni in {countryName}</title>
                                    <circle cx={c.x} cy={c.y} r={r} fill="var(--color-primary)" opacity={0.4 + Math.min(count / 150, 0.5)} className={styles.reachDot} />
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                          <div className={styles.reachLegend}>
                            {reachEntries.slice(0, 5).map(([code, count]) => (
                              <span key={code} className={styles.reachLegendItem} title={`${count} alumni in ${code === "PK" ? "Pakistan" : code}`}>
                                {countryFlags[code] || "•"} {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Field Filter */}
                    {fields.length > 1 && (
                      <div className={styles.pulseFieldFilter}>
                        <button
                          type="button"
                          className={`${styles.pulseFilterBtn} ${alumniFieldFilter ? '' : styles.pulseFilterActive}`}
                          onClick={() => setAlumniFieldFilter(null)}
                        >All fields</button>
                        {fields.slice(0, 4).map((f) => (
                          <button
                            key={f}
                            type="button"
                            className={`${styles.pulseFilterBtn} ${alumniFieldFilter === f ? styles.pulseFilterActive : ''}`}
                            onClick={() => setAlumniFieldFilter(f)}
                          >{f}</button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Connect links - minimal */}
                {alumni && (
                  <div className={styles.pulseConnect}>
                    {alumni.linkedin && (
                      <a href={alumni.linkedin} target="_blank" rel="noopener noreferrer" className={styles.pulseConnectLink}>
                        <IconLinkedIn aria-hidden /> LinkedIn alumni
                      </a>
                    )}
                    {alumni.alumni && (
                      <a href={alumni.alumni} target="_blank" rel="noopener noreferrer" className={styles.pulseConnectLink}>
                        <IconExternalLink aria-hidden /> Official network
                      </a>
                    )}
                  </div>
                )}
              </section>
            );
          })()}

          {/* Similar Universities */}
          <section id="similar" className={styles.card} aria-labelledby="similar-heading">
            <h2 id="similar-heading" className={styles.cardTitle}>Similar Universities</h2>
            {similar.length > 0 ? (
              <div className={styles.similarGrid}>
                {similar.map((s) => (
                  <Link key={s.id} href={`/university/${s.id}`} className={styles.similarCard}>
                    <span className={styles.similarLogo}>{s.shortName.charAt(0)}</span>
                    <div className={styles.similarInfo}>
                      <span className={styles.similarName}>{s.shortName}</span>
                      <span className={styles.similarMeta}>{s.city} • {s.type}</span>
                    </div>
                    <span className={styles.similarArrow}>→</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={styles.similarEmpty}>
                <Link href="/">Explore all universities</Link> to find more options.
              </p>
            )}
          </section>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerMain}>
            <Link href="/" className={styles.backLink}>
              <IconArrowLeft aria-hidden /> Back to Explore
            </Link>
            {admissions.applyUrl && (
              <a
                href={admissions.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.applyFooter}
              >
                Apply to {uni.shortName} <IconExternalLink aria-hidden />
              </a>
            )}
          </div>
          {lastScraperRun && (
            <p className={styles.dataSource}>
              <IconShield aria-hidden /> Data sourced from official university portals. Last verified: {lastScraperRun}.
            </p>
          )}
        </footer>
      </div>

      {/* Sticky Apply Bar */}
      {showStickyBar && admissions.applyUrl && (
        <div className={styles.stickyBar}>
          <span className={styles.stickyText}>Ready to apply?</span>
          <a
            href={admissions.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.stickyBtn}
          >
            Apply to {uni.shortName} <IconExternalLink aria-hidden />
          </a>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}

      {showLoginPrompt && (
        <LoginPromptModal
          universityName={uni?.shortName}
          onContinueAsGuest={handleSaveAsGuest}
          onDismiss={() => setShowLoginPrompt(false)}
        />
      )}
    </main>
  );
}
