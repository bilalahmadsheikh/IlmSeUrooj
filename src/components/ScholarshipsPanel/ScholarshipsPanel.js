'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import styles from './ScholarshipsPanel.module.css';
import { scholarships, scholarshipCategories, coverageLevels, quickLinks } from '@/data/scholarships';
import { universities } from '@/data/universities';
import { IconScholarship, IconClose, IconBookmark } from '@/components/Icons/Icons';

const SORT_OPTIONS = [
  { value: 'relevant', label: 'Most relevant' },
  { value: 'coverage', label: 'Full coverage first' },
  { value: 'provider', label: 'Provider A–Z' },
  { value: 'featured', label: 'Featured first' },
];

const BOOKMARK_KEY = 'unimatch_bookmarked_scholarships';

function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]');
  } catch { return []; }
}

function saveBookmarks(ids) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(ids));
}

function getUniversityById(id) {
  return universities.find((u) => u.id === id);
}

function getLinkedUniversityNames(sch) {
  if (!sch.universityIds?.length) return null;
  return sch.universityIds
    .map((uid) => getUniversityById(uid))
    .filter(Boolean)
    .map((u) => u.shortName);
}

function matchesSavedUnis(sch, savedIds) {
  if (!savedIds?.length || !sch.universityIds?.length) return false;
  return sch.universityIds.some((uid) => savedIds.includes(uid));
}

function getCoverageColor(level) {
  switch (level) {
    case 'full': return 'var(--color-success, #22c55e)';
    case 'high': return 'var(--color-info, #06b6d4)';
    case 'partial': return 'var(--color-warning, #eab308)';
    default: return 'var(--color-text-muted)';
  }
}

export default function ScholarshipsPanel({ onClose, savedIds = [] }) {
  const [category, setCategory] = useState('all');
  const [coverageFilter, setCoverageFilter] = useState('all');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevant');
  const [expandedId, setExpandedId] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const closeBtnRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    setBookmarkedIds(loadBookmarks());
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); e.preventDefault(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const toggleBookmark = useCallback((id) => {
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveBookmarks(next);
      return next;
    });
  }, []);

  const linkedUniversities = useMemo(() => {
    const uniMap = new Map();
    scholarships.forEach((s) => {
      s.universityIds?.forEach((uid) => {
        if (!uniMap.has(uid)) {
          const uni = getUniversityById(uid);
          if (uni) uniMap.set(uid, uni.shortName);
        }
      });
    });
    return [{ id: 'all', name: 'All universities' }, ...Array.from(uniMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))];
  }, []);

  const filtered = useMemo(() => {
    let list = [...scholarships];

    if (activeTab === 'saved' && savedIds.length > 0) {
      list = list.filter((s) => matchesSavedUnis(s, savedIds) || s.universityIds.length === 0);
    } else if (activeTab === 'bookmarked') {
      list = list.filter((s) => bookmarkedIds.includes(s.id));
    }

    if (showBookmarkedOnly) {
      list = list.filter((s) => bookmarkedIds.includes(s.id));
    }
    if (category !== 'all') {
      list = list.filter((s) => s.type === category);
    }
    if (coverageFilter !== 'all') {
      list = list.filter((s) => s.coverageLevel === coverageFilter);
    }
    if (universityFilter !== 'all') {
      list = list.filter((s) => s.universityIds?.includes(Number(universityFilter)));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.provider.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          (s.includes || []).some((inc) => inc.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'relevant') {
      list.sort((a, b) => {
        const aMatch = matchesSavedUnis(a, savedIds) ? 1 : 0;
        const bMatch = matchesSavedUnis(b, savedIds) ? 1 : 0;
        if (bMatch !== aMatch) return bMatch - aMatch;
        const aFeat = a.featured ? 1 : 0;
        const bFeat = b.featured ? 1 : 0;
        if (bFeat !== aFeat) return bFeat - aFeat;
        const coverOrder = { full: 3, high: 2, partial: 1, variable: 0 };
        return (coverOrder[b.coverageLevel] || 0) - (coverOrder[a.coverageLevel] || 0);
      });
    } else if (sortBy === 'coverage') {
      const coverOrder = { full: 3, high: 2, partial: 1, variable: 0 };
      list.sort((a, b) => (coverOrder[b.coverageLevel] || 0) - (coverOrder[a.coverageLevel] || 0));
    } else if (sortBy === 'provider') {
      list.sort((a, b) => a.provider.localeCompare(b.provider));
    } else if (sortBy === 'featured') {
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return list;
  }, [category, coverageFilter, universityFilter, searchQuery, sortBy, activeTab, savedIds, bookmarkedIds, showBookmarkedOnly]);

  const stats = useMemo(() => {
    const total = scholarships.length;
    const fullCoverage = scholarships.filter((s) => s.coverageLevel === 'full').length;
    const forSaved = savedIds.length > 0 ? scholarships.filter((s) => matchesSavedUnis(s, savedIds)).length : 0;
    const govCount = scholarships.filter((s) => s.type === 'government').length;
    const bookmarked = bookmarkedIds.length;
    return { total, fullCoverage, forSaved, govCount, bookmarked };
  }, [savedIds, bookmarkedIds]);

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="scholarships-panel-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <IconScholarship className={styles.titleIcon} aria-hidden />
            <div>
              <h2 id="scholarships-panel-title" className={styles.title}>Scholarships & Financial Aid</h2>
              <p className={styles.titleSub}>Find funding for your degree across Pakistani universities</p>
            </div>
          </div>
          <button ref={closeBtnRef} className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <IconClose aria-hidden />
          </button>
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{stats.total}</span>
            <span className={styles.statLabel}>Programs</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={`${styles.statNumber} ${styles.statGreen}`}>{stats.fullCoverage}</span>
            <span className={styles.statLabel}>Full coverage</span>
          </div>
          <div className={styles.statDivider} />
          {savedIds.length > 0 && (
            <>
              <div className={styles.statItem}>
                <span className={`${styles.statNumber} ${styles.statBlue}`}>{stats.forSaved}</span>
                <span className={styles.statLabel}>For your unis</span>
              </div>
              <div className={styles.statDivider} />
            </>
          )}
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{stats.govCount}</span>
            <span className={styles.statLabel}>Government</span>
          </div>
          {stats.bookmarked > 0 && (
            <>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={`${styles.statNumber} ${styles.statYellow}`}>{stats.bookmarked}</span>
                <span className={styles.statLabel}>Saved</span>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`} onClick={() => setActiveTab('all')}>
            All scholarships
          </button>
          {savedIds.length > 0 && (
            <button className={`${styles.tab} ${activeTab === 'saved' ? styles.tabActive : ''}`} onClick={() => setActiveTab('saved')}>
              For your universities
              <span className={styles.tabBadge}>{stats.forSaved}</span>
            </button>
          )}
          {bookmarkedIds.length > 0 && (
            <button className={`${styles.tab} ${activeTab === 'bookmarked' ? styles.tabActive : ''}`} onClick={() => setActiveTab('bookmarked')}>
              Bookmarked
              <span className={styles.tabBadge}>{stats.bookmarked}</span>
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarRow}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search scholarships, providers, or universities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search scholarships"
            />
          </div>
          <div className={styles.toolbarRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Type</label>
              <select className={styles.filterSelect} value={category} onChange={(e) => setCategory(e.target.value)}>
                {scholarshipCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Coverage</label>
              <select className={styles.filterSelect} value={coverageFilter} onChange={(e) => setCoverageFilter(e.target.value)}>
                {coverageLevels.map((lv) => (
                  <option key={lv.id} value={lv.id}>{lv.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>University</label>
              <select className={styles.filterSelect} value={universityFilter} onChange={(e) => setUniversityFilter(e.target.value)}>
                {linkedUniversities.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Sort</label>
              <select className={styles.filterSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.toolbarMeta}>
            <span className={styles.resultCount}>
              {filtered.length} of {scholarships.length} scholarships
            </span>
            {(category !== 'all' || coverageFilter !== 'all' || universityFilter !== 'all' || searchQuery.trim()) && (
              <button className={styles.clearFilters} onClick={() => { setCategory('all'); setCoverageFilter('all'); setUniversityFilter('all'); setSearchQuery(''); }}>
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className={styles.list} ref={listRef}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <IconScholarship className={styles.emptyIcon} aria-hidden />
              <h3 className={styles.emptyTitle}>No scholarships match</h3>
              <p className={styles.emptyText}>Try adjusting your filters or search term.</p>
              <button className={styles.emptyBtn} onClick={() => { setCategory('all'); setCoverageFilter('all'); setUniversityFilter('all'); setSearchQuery(''); setActiveTab('all'); }}>
                Reset all filters
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((sch) => {
                const isExpanded = expandedId === sch.id;
                const isBookmarked = bookmarkedIds.includes(sch.id);
                const isForSaved = matchesSavedUnis(sch, savedIds);
                const uniNames = getLinkedUniversityNames(sch);

                return (
                  <article
                    key={sch.id}
                    className={`${styles.card} ${isExpanded ? styles.cardExpanded : ''} ${isForSaved ? styles.cardForSaved : ''} ${sch.featured ? styles.cardFeatured : ''}`}
                  >
                    {/* Card top row */}
                    <div className={styles.cardHeader}>
                      <div className={styles.cardBadges}>
                        <span className={styles.badge} data-type={sch.type}>{sch.type.replace('-', ' ')}</span>
                        {sch.featured && <span className={styles.featuredBadge}>Popular</span>}
                        {isForSaved && <span className={styles.savedMatchBadge}>In your list</span>}
                        {sch.forUnderprivileged && <span className={styles.underprivBadge}>Need-friendly</span>}
                      </div>
                      <button
                        className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarked : ''}`}
                        onClick={() => toggleBookmark(sch.id)}
                        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark scholarship'}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                      >
                        <IconBookmark aria-hidden />
                      </button>
                    </div>

                    {/* Name & provider */}
                    <h3 className={styles.cardName}>{sch.name}</h3>
                    <p className={styles.cardProvider}>{sch.provider}</p>

                    {/* University chips */}
                    {uniNames && uniNames.length > 0 && (
                      <div className={styles.uniChips}>
                        {uniNames.map((name) => (
                          <span key={name} className={styles.uniChip}>{name}</span>
                        ))}
                      </div>
                    )}
                    {!uniNames && <div className={styles.uniChips}><span className={styles.uniChipGov}>All eligible universities</span></div>}

                    {/* Coverage & deadline */}
                    <div className={styles.cardMeta}>
                      <div className={styles.coverageTag} style={{ '--coverage-color': getCoverageColor(sch.coverageLevel) }}>
                        <span className={styles.coverageDot} />
                        {sch.coverage}
                      </div>
                      {sch.deadlineNote && (
                        <span className={styles.deadlineTag}>{sch.deadlineNote}</span>
                      )}
                    </div>

                    {/* What's included */}
                    {sch.includes && sch.includes.length > 0 && (
                      <div className={styles.includesTags}>
                        {sch.includes.map((inc) => (
                          <span key={inc} className={styles.includesTag}>{inc}</span>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    <p className={styles.cardDesc}>{sch.description}</p>

                    {/* Expand button */}
                    <button
                      type="button"
                      className={styles.expandBtn}
                      onClick={() => setExpandedId(isExpanded ? null : sch.id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? 'Hide details' : 'Eligibility & how to apply'}
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className={styles.details}>
                        <div className={styles.detailSection}>
                          <h4 className={styles.detailLabel}>Eligibility</h4>
                          <p className={styles.detailText}>{sch.eligibility}</p>
                        </div>
                        {sch.minAcademic && (
                          <div className={styles.detailSection}>
                            <h4 className={styles.detailLabel}>Minimum academics</h4>
                            <p className={styles.detailText}>{sch.minAcademic}%+ in FSc / A-Levels (approximate)</p>
                          </div>
                        )}
                        {sch.applyUrl && (
                          <div className={styles.detailActions}>
                            <a href={sch.applyUrl} target="_blank" rel="noopener noreferrer" className={styles.applyBtn}>
                              Open application link
                            </a>
                            <p className={styles.verifyNote}>Always verify deadline and eligibility on the official site before applying.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links footer */}
        <div className={styles.footer}>
          <div className={styles.quickLinks}>
            <span className={styles.quickLinksLabel}>Official portals:</span>
            {quickLinks.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.quickLink}>
                {link.label}
              </a>
            ))}
          </div>
          <p className={styles.disclaimer}>
            Information is for guidance only. Details and deadlines can change. Always confirm on the official provider website.
          </p>
        </div>

      </div>
    </div>
  );
}
