'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Header from '@/components/Header/Header';
import FilterSection from '@/components/FilterSection/FilterSection';
import SwipeCard from '@/components/SwipeCard/SwipeCard';
import SavedList from '@/components/SavedList/SavedList';
import { universities } from '@/data/universities';
import { rankUniversities } from '@/utils/ranking';

export default function Home() {
  // Filter state with defaults
  const [filters, setFilters] = useState({
    field: 'Pre-Engineering',
    degreeLevel: 'Any',
    program: 'Any',
    hostel: 'Any',
    city: 'Any',
    campusType: 'Any'
  });

  // UI state
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Universities state
  const [rankedUniversities, setRankedUniversities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedUniversities, setSavedUniversities] = useState([]);
  const [skippedIds, setSkippedIds] = useState([]);

  // Rank universities when filters change
  useEffect(() => {
    const ranked = rankUniversities(universities, filters);
    // Filter out already swiped universities
    const filtered = ranked.filter(uni =>
      !savedUniversities.some(s => s.id === uni.id) &&
      !skippedIds.includes(uni.id)
    );
    setRankedUniversities(filtered);
    setCurrentIndex(0);
  }, [filters, savedUniversities, skippedIds]);

  // Handle swipe action
  const handleSwipe = (direction, university) => {
    if (direction === 'right') {
      // Save university
      setSavedUniversities(prev => [...prev, university]);
    } else {
      // Skip university
      setSkippedIds(prev => [...prev, university.id]);
    }
    setCurrentIndex(prev => prev + 1);
  };

  // Remove from saved
  const handleRemoveSaved = (id) => {
    setSavedUniversities(prev => prev.filter(uni => uni.id !== id));
  };

  // Start swiping
  const handleStartSwiping = () => {
    setIsSwipeMode(true);
    setCurrentIndex(0);
    setSkippedIds([]);
  };

  // Get visible cards (current + next for stacking effect)
  const visibleCards = rankedUniversities.slice(currentIndex, currentIndex + 2);
  const hasMoreCards = currentIndex < rankedUniversities.length;

  return (
    <main className={styles.main}>
      <Header
        savedCount={savedUniversities.length}
        onShowSaved={() => setShowSaved(true)}
      />

      <FilterSection
        filters={filters}
        setFilters={setFilters}
        onStartSwiping={handleStartSwiping}
        isSwipeMode={isSwipeMode}
      />

      {isSwipeMode && (
        <section className={styles.swipeSection}>
          <div className={styles.cardContainer}>
            {hasMoreCards ? (
              visibleCards.map((uni, index) => (
                <SwipeCard
                  key={uni.id}
                  university={uni}
                  isTop={index === 0}
                  onSwipe={handleSwipe}
                />
              )).reverse()
            ) : (
              <div className={styles.noMore}>
                <span className={styles.noMoreIcon}>🎉</span>
                <h3 className={styles.noMoreTitle}>All Done!</h3>
                <p className={styles.noMoreText}>
                  You've seen all {rankedUniversities.length + savedUniversities.length + skippedIds.length} matching universities.
                </p>
                <button
                  className={styles.resetBtn}
                  onClick={() => {
                    setSkippedIds([]);
                    setCurrentIndex(0);
                  }}
                >
                  Start Over
                </button>
              </div>
            )}
          </div>

          {hasMoreCards && (
            <div className={styles.swipeHint}>
              <span className={styles.hintLeft}>← Skip</span>
              <span className={styles.hintCenter}>Swipe or tap buttons</span>
              <span className={styles.hintRight}>Save →</span>
            </div>
          )}

          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${((currentIndex + savedUniversities.length) / (rankedUniversities.length + savedUniversities.length + skippedIds.length)) * 100}%`
                }}
              />
            </div>
            <span className={styles.progressText}>
              {currentIndex + 1} of {rankedUniversities.length + skippedIds.length} remaining
            </span>
          </div>
        </section>
      )}

      {showSaved && (
        <SavedList
          savedUniversities={savedUniversities}
          onRemove={handleRemoveSaved}
          onClose={() => setShowSaved(false)}
        />
      )}
    </main>
  );
}
