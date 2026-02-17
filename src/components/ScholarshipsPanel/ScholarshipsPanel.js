'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import styles from './ScholarshipsPanel.module.css';
import { scholarships, scholarshipCategories, quickLinks } from '@/data/scholarships';
import { IconScholarship, IconClose } from '@/components/Icons/Icons';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default order' },
  { value: 'coverage', label: 'Full coverage first' },
  { value: 'provider', label: 'Provider A–Z' },
];

export default function ScholarshipsPanel({ onClose }) {
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [expandedId, setExpandedId] = useState(null);
  const [tipsOpen, setTipsOpen] = useState(true);
  const closeBtnRef = useRef(null);

  const filtered = useMemo(() => {
    let list = category === 'all' ? scholarships : scholarships.filter((s) => s.type === category);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.provider.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'coverage') {
      list = [...list].sort((a, b) => {
        const aFull = (a.coverage || '').toLowerCase().includes('100%') ? 1 : 0;
        const bFull = (b.coverage || '').toLowerCase().includes('100%') ? 1 : 0;
        if (bFull !== aFull) return bFull - aFull;
        return 0;
      });
    } else if (sortBy === 'provider') {
      list = [...list].sort((a, b) => (a.provider || '').localeCompare(b.provider || ''));
    }
    return list;
  }, [category, searchQuery, sortBy]);

  const featured = useMemo(() => scholarships.filter((s) => s.featured), []);

  const restFiltered = useMemo(() => {
    if (category !== 'all' || searchQuery.trim()) return filtered;
    return filtered.filter((s) => !featured.some((f) => f.id === s.id));
  }, [filtered, featured, category, searchQuery]);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scholarships-panel-title"
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 id="scholarships-panel-title" className={styles.title}>
            <IconScholarship className={styles.titleIcon} aria-hidden />
            Scholarships & financial aid
          </h2>
          <button ref={closeBtnRef} className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <IconClose aria-hidden />
          </button>
        </div>

        <div className={styles.hero}>
          <p className={styles.heroText}>
            Find funding for your degree. Need-based aid, merit scholarships, and government schemes across Pakistani universities.
          </p>
        </div>

        <div className={styles.quickLinks}>
          <p className={styles.quickLinksTitle}>Official portals</p>
          <ul className={styles.quickLinksList}>
            {quickLinks.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.quickLink}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className={styles.tipsToggle}
          onClick={() => setTipsOpen(!tipsOpen)}
          aria-expanded={tipsOpen}
        >
          {tipsOpen ? 'Hide' : 'Show'} application tips
        </button>
        {tipsOpen && (
          <div className={styles.tips}>
            <ul className={styles.tipsList}>
              <li>Apply for financial aid when you apply for admission; many universities only consider aid at that time.</li>
              <li>Keep income proof, utility bills, and family documents ready for need-based applications.</li>
              <li>LUMS NOP and Habib Yohsin offer strong full-need support; check their portals for deadlines.</li>
              <li>Government schemes (HEC, Ehsaas) open periodically; subscribe to HEC updates for announcements.</li>
              <li>Merit scholarships often require maintaining a minimum GPA; read the terms before applying.</li>
              <li>Always confirm deadlines and eligibility on the official provider website; dates and criteria can change.</li>
            </ul>
          </div>
        )}

        <div className={styles.toolbar}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search by name or provider…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search scholarships"
          />
          <div className={styles.sortWrap}>
            <span className={styles.sortLabel}>Sort:</span>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort scholarships"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <p className={styles.resultCount}>
            Showing {filtered.length} of {scholarships.length} programs
          </p>
          <div className={styles.chips} role="group" aria-label="Filter by type">
            {scholarshipCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={category === cat.id ? `${styles.chip} ${styles.chipActive}` : styles.chip}
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.list}>
          {featured.length > 0 && category === 'all' && !searchQuery.trim() && (
            <div className={styles.featuredBlock}>
              <h3 className={styles.featuredTitle}>Popular & full coverage</h3>
              {featured.map((sch) => {
                const isExpanded = expandedId === sch.id;
                return (
                  <article key={sch.id} className={styles.cardFeatured}>
                    <div className={styles.cardTop}>
                      <span className={styles.badge} data-type={sch.type}>{sch.type.replace('-', ' ')}</span>
                      <span className={styles.coverage}>{sch.coverage}</span>
                    </div>
                    <h4 className={styles.name}>{sch.name}</h4>
                    <p className={styles.provider}>{sch.provider}</p>
                    {sch.deadlineNote && <p className={styles.deadlineNote}>{sch.deadlineNote}</p>}
                    <p className={styles.description}>{sch.description}</p>
                    <button
                      type="button"
                      className={styles.moreBtn}
                      onClick={() => setExpandedId(isExpanded ? null : sch.id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? 'Hide' : 'Eligibility & apply'}
                    </button>
                    {isExpanded && (
                      <div className={styles.details}>
                        <p className={styles.eligibility}>{sch.eligibility}</p>
                        {sch.applyUrl && (
                          <>
                            <a href={sch.applyUrl} target="_blank" rel="noopener noreferrer" className={styles.applyLink}>
                              Open application link
                            </a>
                            <p className={styles.verifyNote}>Verify deadline and eligibility on the official site before applying.</p>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <div className={styles.allBlock}>
            {restFiltered.length > 0 && (
              <h3 className={styles.sectionTitle}>
                {featured.length > 0 && category === 'all' && !searchQuery.trim() ? 'More programs' : 'All programs'}
              </h3>
            )}
            {filtered.length === 0 ? (
              <p className={styles.empty}>No scholarships match your search. Try a different filter or search term.</p>
            ) : (
              restFiltered.map((sch) => {
                const isExpanded = expandedId === sch.id;
                return (
                  <article key={sch.id} className={isExpanded ? `${styles.card} ${styles.cardExpanded}` : styles.card}>
                    <div className={styles.cardTop}>
                      <span className={styles.badge} data-type={sch.type}>{sch.type.replace('-', ' ')}</span>
                      {sch.coverage && <span className={styles.coverage}>{sch.coverage}</span>}
                    </div>
                    <h4 className={styles.name}>{sch.name}</h4>
                    <p className={styles.provider}>{sch.provider}</p>
                    {sch.deadlineNote && <p className={styles.deadlineNote}>{sch.deadlineNote}</p>}
                    <p className={styles.description}>{sch.description}</p>
                    <button
                      type="button"
                      className={styles.moreBtn}
                      onClick={() => setExpandedId(isExpanded ? null : sch.id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? 'Hide' : 'Eligibility & apply'}
                    </button>
                    {isExpanded && (
                      <div className={styles.details}>
                        <p className={styles.eligibility}>{sch.eligibility}</p>
                        {sch.applyUrl && (
                          <>
                            <a href={sch.applyUrl} target="_blank" rel="noopener noreferrer" className={styles.applyLink}>
                              Open application link
                            </a>
                            <p className={styles.verifyNote}>Verify deadline and eligibility on the official site before applying.</p>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.disclaimer}>
            Information is for guidance only. Details and deadlines can change. Always confirm on the official provider website before applying.
          </p>
        </div>
      </div>
    </div>
  );
}
