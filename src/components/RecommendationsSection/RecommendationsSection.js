'use client';

import { useState } from 'react';
import styles from './RecommendationsSection.module.css';
import { getMatchPercentage, getMatchReasons, getFieldRank } from '@/utils/ranking';
import { IconArrowRight, IconCheck } from '@/components/Icons/Icons';

const TOP_N = 5;

export default function RecommendationsSection({
  rankedUniversities,
  filters,
  onStartSwiping,
  onSave,
  savedIds,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const topPicks = rankedUniversities.slice(0, TOP_N);

  if (topPicks.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="recommendations-heading">
      <div className={styles.header}>
        <h2 id="recommendations-heading" className={styles.title}>
          Top picks for you
        </h2>
        <p className={styles.subtitle}>
          Based on your filters: <strong>{filters.field}</strong>
          {filters.program !== 'Any' && `, ${filters.program}`}
          {filters.city !== 'Any' && ` in ${filters.city}`}
        </p>
      </div>

      <div className={styles.grid} role="list">
        {topPicks.map((uni, index) => {
          const isExpanded = expandedId === uni.id;
          const isSaved = savedIds.includes(uni.id);
          const matchPercent = getMatchPercentage(uni.matchScore || 0);
          const reasons = getMatchReasons(uni, filters);
          const fieldRank = getFieldRank(uni, filters.field);

          return (
            <article
              key={uni.id}
              className={`${styles.card} ${isExpanded ? styles.cardExpanded : ''} ${isSaved ? styles.cardSaved : ''}`}
              role="listitem"
            >
              <div className={styles.cardHeader}>
                <span className={styles.rank} aria-label={`Rank ${index + 1}`}>
                  #{index + 1}
                </span>
                <div className={styles.logo}>
                  <span aria-hidden="true">{uni.shortName.charAt(0)}</span>
                </div>
                <div className={styles.primary}>
                  <h3 className={styles.name}>{uni.shortName}</h3>
                  <p className={styles.meta}>
                    {uni.city} &middot; {uni.type}
                    {fieldRank != null && (
                      <span className={styles.fieldRank}> &middot; #{fieldRank} in {filters.field}</span>
                    )}
                  </p>
                </div>
                <div className={styles.matchWrap}>
                  <span className={styles.matchPercent} aria-label={`${matchPercent} percent match`}>
                    {matchPercent}%
                  </span>
                  <span className={styles.matchLabel}>match</span>
                </div>
              </div>

              {reasons.length > 0 && (
                <div className={styles.reasons} role="list">
                  {reasons.map((r, i) => (
                    <span key={i} className={styles.reasonTag}>
                      <IconCheck className={styles.reasonIcon} aria-hidden />
                      {r}
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                className={styles.whyBtn}
                onClick={() => setExpandedId(isExpanded ? null : uni.id)}
                aria-expanded={isExpanded}
                aria-controls={`rec-details-${uni.id}`}
              >
                {isExpanded ? 'Hide details' : 'Why recommended'}
              </button>

              {isExpanded && (
                <div id={`rec-details-${uni.id}`} className={styles.details}>
                  <p className={styles.description}>{uni.description}</p>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Avg fee</span>
                      <span className={styles.detailValue}>{uni.avgFee}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Campus</span>
                      <span className={styles.detailValue}>{uni.hostelAvailability}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Focus</span>
                      <span className={styles.detailValue}>{uni.campusType}</span>
                    </div>
                  </div>
                  {(uni.highlights || []).length > 0 && (
                    <div className={styles.highlights}>
                      <span className={styles.highlightsLabel}>Highlights:</span>
                      <div className={styles.highlightTags}>
                        {uni.highlights.map((h, idx) => (
                          <span key={idx} className={styles.highlightTag}>{h}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.saveBtn} ${isSaved ? styles.saveBtnSaved : ''}`}
                  onClick={() => onSave(uni)}
                  disabled={isSaved}
                  aria-pressed={isSaved}
                  aria-label={isSaved ? `${uni.shortName} already saved` : `Save ${uni.shortName}`}
                >
                  {isSaved ? (
                    <>
                      <IconCheck className={styles.saveIcon} aria-hidden />
                      Saved
                    </>
                  ) : (
                    'Save to list'
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.cta}>
        <button type="button" className={styles.swipeCta} onClick={onStartSwiping}>
          Swipe through all {rankedUniversities.length} matches
          <IconArrowRight className={styles.ctaIcon} aria-hidden />
        </button>
      </div>
    </section>
  );
}
