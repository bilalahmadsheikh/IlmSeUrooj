'use client';

import { useState, useMemo } from 'react';
import styles from './ScholarshipsSection.module.css';
import { scholarships, scholarshipCategories } from '@/data/scholarships';

export default function ScholarshipsSection() {
  const [category, setCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    if (category === 'all') return scholarships;
    return scholarships.filter((s) => s.type === category);
  }, [category]);

  return (
    <section className={styles.section} aria-labelledby="scholarships-heading">
      <div className={styles.header}>
        <h2 id="scholarships-heading" className={styles.title}>
          Scholarships and financial aid
        </h2>
        <p className={styles.subtitle}>
          For underprivileged students: need-based aid, government schemes, and university support so you can afford a degree.
        </p>
      </div>

      <div className={styles.tips}>
        <h3 className={styles.tipsTitle}>Before you apply</h3>
        <ul className={styles.tipsList}>
          <li>Gather income proof, utility bills, and family documents early.</li>
          <li>Many universities consider aid only if you apply at admission time.</li>
          <li>LUMS NOP and Habib Yohsin are among the most generous for full need.</li>
          <li>Check HEC and Ehsaas portals when government schemes open (usually annually).</li>
        </ul>
      </div>

      <div className={styles.filters}>
        <label htmlFor="scholarship-category" className={styles.filterLabel}>
          Filter by type
        </label>
        <select
          id="scholarship-category"
          className={styles.filterSelect}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter scholarships by type"
        >
          {scholarshipCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.grid} role="list">
        {filtered.map((sch) => {
          const isExpanded = expandedId === sch.id;
          return (
            <article
              key={sch.id}
              className={isExpanded ? `${styles.card} ${styles.cardExpanded}` : styles.card}
              role="listitem"
            >
              <div className={styles.cardTop}>
                <span className={styles.badge} data-type={sch.type}>
                  {sch.type.replace('-', ' ')}
                </span>
                {sch.forUnderprivileged && (
                  <span className={styles.underprivilegedBadge}>For underprivileged students</span>
                )}
              </div>
              <h3 className={styles.name}>{sch.name}</h3>
              <p className={styles.provider}>{sch.provider}</p>
              {sch.coverage && <p className={styles.coverage}>{sch.coverage}</p>}
              <p className={styles.description}>{sch.description}</p>
              <button
                type="button"
                className={styles.moreBtn}
                onClick={() => setExpandedId(isExpanded ? null : sch.id)}
                aria-expanded={isExpanded}
                aria-controls={`sch-details-${sch.id}`}
              >
                {isExpanded ? 'Hide details' : 'Eligibility and how to apply'}
              </button>
              {isExpanded && (
                <div id={`sch-details-${sch.id}`} className={styles.details}>
                  <p className={styles.eligibility}>
                    <strong>Eligibility:</strong> {sch.eligibility}
                  </p>
                  {sch.applyUrl && (
                    <a
                      href={sch.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.applyLink}
                    >
                      Open application link
                    </a>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className={styles.disclaimer}>
        Scholarship details and links are for guidance. Always confirm deadlines and eligibility on the official provider website.
      </p>
    </section>
  );
}
