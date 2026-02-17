'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';
import Header from '@/components/Header/Header';
import FilterSection from '@/components/FilterSection/FilterSection';
import SwipeCard from '@/components/SwipeCard/SwipeCard';
import SavedList from '@/components/SavedList/SavedList';
import UniversityList from '@/components/UniversityList/UniversityList';
import AdmissionsDeadlines from '@/components/AdmissionsDeadlines/AdmissionsDeadlines';
import UniversityComparison from '@/components/UniversityComparison/UniversityComparison';
import AdmissionPredictor from '@/components/AdmissionPredictor/AdmissionPredictor';
import AnimatedBackground from '@/components/Background/AnimatedBackground';
import DecorativeImages from '@/components/Background/DecorativeImages';
import Toast from '@/components/Toast/Toast';
import RecommendationsSection from '@/components/RecommendationsSection/RecommendationsSection';
import { IconBookmark, IconArrowRight, IconCelebrate, IconArrowLeft } from '@/components/Icons/Icons';
import { universities } from '@/data/universities';
import { rankUniversities } from '@/utils/ranking';
import { loadSavedFromStorage, saveToStorage } from '@/utils/savedStorage';

// Normalize saved item: { university, savedAt, tag, note }
function hydrateSavedItems(rows) {
  return rows
    .map(({ id, savedAt, tag, note }) => {
      const university = universities.find(u => u.id === id);
      if (!university) return null;
      return { university, savedAt: savedAt ?? Date.now(), tag: tag ?? null, note: note ?? '' };
    })
    .filter(Boolean);
}

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
  const [toast, setToast] = useState(null);
  const [compareInitialIds, setCompareInitialIds] = useState(null);

  // Saved items: [{ university, savedAt, tag, note }, ...] — order = display order
  const [savedItems, setSavedItems] = useState([]);
  const [savedLoaded, setSavedLoaded] = useState(false);

  // Universities state
  const [rankedUniversities, setRankedUniversities] = useState([]);
  const [allRankedUniversities, setAllRankedUniversities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [skippedIds, setSkippedIds] = useState([]);

  const savedUniversities = savedItems.map(i => i.university);
  const savedIds = savedUniversities.map(u => u.id);

  // Load saved from localStorage on mount
  useEffect(() => {
    const rows = loadSavedFromStorage();
    setSavedItems(hydrateSavedItems(rows));
    setSavedLoaded(true);
  }, []);

  // Persist saved items when they change (after initial load)
  useEffect(() => {
    if (!savedLoaded) return;
    saveToStorage(savedItems);
  }, [savedItems, savedLoaded]);

  // Rank universities when filters change
  useEffect(() => {
    const ranked = rankUniversities(universities, filters);
    setAllRankedUniversities(ranked);
    const filtered = ranked.filter(uni =>
      !savedIds.includes(uni.id) &&
      !skippedIds.includes(uni.id)
    );
    setRankedUniversities(filtered);
    setCurrentIndex(0);
  }, [filters, savedIds, skippedIds]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Handle swipe action
  const handleSwipe = (direction, university) => {
    if (direction === 'right') {
      if (!savedIds.includes(university.id)) {
        setSavedItems(prev => [...prev, { university, savedAt: Date.now(), tag: null, note: '' }]);
        showToast(`${university.shortName} saved to your list!`, 'success');
      }
    } else {
      setSkippedIds(prev => [...prev, university.id]);
    }
    setCurrentIndex(prev => prev + 1);
  };

  // Handle save from list
  const handleSaveFromList = (university) => {
    if (!savedIds.includes(university.id)) {
      setSavedItems(prev => [...prev, { university, savedAt: Date.now(), tag: null, note: '' }]);
      showToast(`${university.shortName} added to saved list`, 'success');
    }
  };

  // Remove from saved
  const handleRemoveSaved = (id) => {
    const name = savedItems.find(i => i.university.id === id)?.university?.shortName ?? 'University';
    setSavedItems(prev => prev.filter(i => i.university.id !== id));
    showToast(`${name} removed from list`, 'removed');
  };

  // Update a saved item (tag, note)
  const handleUpdateSavedItem = useCallback((id, updates) => {
    setSavedItems(prev => prev.map(item =>
      item.university.id === id
        ? { ...item, ...updates }
        : item
    ));
  }, []);

  // Reorder: move item at fromIndex to toIndex
  const handleReorderSaved = useCallback((fromIndex, toIndex) => {
    setSavedItems(prev => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  // Compare selected saved universities (scroll to comparison and pre-fill)
  const handleCompareSaved = useCallback((ids) => {
    setCompareInitialIds(ids);
    setShowSaved(false);
  }, []);

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
      <AnimatedBackground />
      <DecorativeImages />

      <Header
        savedCount={savedItems.length}
        onShowSaved={() => setShowSaved(true)}
      />

      <FilterSection
        filters={filters}
        setFilters={setFilters}
        onStartSwiping={handleStartSwiping}
        isSwipeMode={isSwipeMode}
      />

      {!isSwipeMode && allRankedUniversities.length > 0 && (
        <RecommendationsSection
          rankedUniversities={allRankedUniversities}
          filters={filters}
          onStartSwiping={handleStartSwiping}
          onSave={handleSaveFromList}
          savedIds={savedIds}
        />
      )}

      {savedItems.length > 0 && (
        <button
          type="button"
          className={styles.shortlistStrip}
          onClick={() => setShowSaved(true)}
          aria-label="Open saved list"
        >
          <IconBookmark className={styles.shortlistIcon} aria-hidden />
          <span className={styles.shortlistText}>
            Your shortlist: <strong>{savedItems.length}</strong> universit{savedItems.length === 1 ? 'y' : 'ies'} saved
          </span>
          <IconArrowRight className={styles.shortlistArrow} aria-hidden />
        </button>
      )}

      {isSwipeMode && (
        <div className={styles.swipeModeContainer}>
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
                  <IconCelebrate className={styles.noMoreIcon} aria-hidden />
                  <h3 className={styles.noMoreTitle}>All Done!</h3>
                  <p className={styles.noMoreText}>
                    You've seen all {rankedUniversities.length + savedItems.length + skippedIds.length} matching universities.
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
              <div className={styles.swipeHint} role="status" aria-label="Swipe left to skip, right to save">
                <span className={styles.hintLeft}><IconArrowLeft className={styles.hintIcon} aria-hidden /> Skip</span>
                <span className={styles.hintCenter}>Swipe or tap buttons</span>
                <span className={styles.hintRight}>Save <IconArrowRight className={styles.hintIcon} aria-hidden /></span>
              </div>
            )}

            <div className={styles.progress}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${((currentIndex + savedItems.length) / (rankedUniversities.length + savedItems.length + skippedIds.length)) * 100}%`
                  }}
                />
              </div>
              <span className={styles.progressText}>
                {currentIndex + 1} of {rankedUniversities.length + skippedIds.length} remaining
              </span>
            </div>
          </section>

          {/* University List Section */}
          <UniversityList
            universities={allRankedUniversities}
            field={filters.field}
            filters={filters}
            onSave={handleSaveFromList}
            savedIds={savedIds}
          />

          {/* Admissions Deadlines Section */}
          <AdmissionsDeadlines currentField={filters.field} />

          {/* University Comparison Tool */}
          <UniversityComparison initialSelectedIds={compareInitialIds} onConsumeInitialIds={() => setCompareInitialIds(null)} />

          {/* Admission Chance Predictor */}
          <AdmissionPredictor />
        </div>
      )}

      {showSaved && (
        <SavedList
          savedItems={savedItems}
          onRemove={handleRemoveSaved}
          onUpdateItem={handleUpdateSavedItem}
          onReorder={handleReorderSaved}
          onCompare={handleCompareSaved}
          onClose={() => setShowSaved(false)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </main>
  );
}
