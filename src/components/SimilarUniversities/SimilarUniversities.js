'use client';

import styles from './SimilarUniversities.module.css';
import { getMatchPercentage, getFieldRank } from '@/utils/ranking';
import { IconBookmark } from '@/components/Icons/Icons';

function getSimilarCandidates(rankedUniversities, savedIds, savedUniversities, max = 5) {
  const savedCities = new Set(savedUniversities.map((u) => u.city));
  const savedIdsSet = new Set(savedIds);
  const out = [];
  for (const uni of rankedUniversities) {
    if (savedIdsSet.has(uni.id)) continue;
    const inSavedCity = savedCities.has(uni.city);
    if (inSavedCity || out.length < max) {
      out.push({ ...uni, similarReason: inSavedCity ? `Same city as your shortlist` : 'Top match for your filters' });
      if (out.length >= max) break;
    }
  }
  return out;
}

export default function SimilarUniversities({
  rankedUniversities,
  savedIds,
  savedUniversities,
  field,
  onSave,
}) {
  const similar = getSimilarCandidates(
    rankedUniversities,
    savedIds,
    savedUniversities,
    5
  );

  if (similar.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="similar-heading">
      <h2 id="similar-heading" className={styles.title}>
        You might also like
      </h2>
      <p className={styles.subtitle}>
        Based on your shortlist and filters
      </p>
      <div className={styles.grid} role="list">
        {similar.map((uni) => {
          const isSaved = savedIds.includes(uni.id);
          const matchPercent = getMatchPercentage(uni.matchScore || 0);
          const fieldRank = getFieldRank(uni, field);
          return (
            <article key={uni.id} className={styles.card} role="listitem">
              <div className={styles.cardHeader}>
                <div className={styles.logo}>{uni.shortName.charAt(0)}</div>
                <div className={styles.primary}>
                  <h3 className={styles.name}>{uni.shortName}</h3>
                  <p className={styles.meta}>
                    {uni.city} &middot; {uni.type}
                    {fieldRank != null && ` &middot; #${fieldRank} in ${field}`}
                  </p>
                </div>
                <div className={styles.match}>
                  <span className={styles.matchPercent}>{matchPercent}%</span>
                  <span className={styles.matchLabel}>match</span>
                </div>
              </div>
              {uni.similarReason && (
                <p className={styles.reason}>{uni.similarReason}</p>
              )}
              <button
                type="button"
                className={`${styles.saveBtn} ${isSaved ? styles.saved : ''}`}
                onClick={() => onSave(uni)}
                disabled={isSaved}
                aria-pressed={isSaved}
                aria-label={isSaved ? `${uni.shortName} already saved` : `Save ${uni.shortName}`}
              >
                <IconBookmark className={styles.saveIcon} aria-hidden />
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
