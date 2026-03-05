'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import styles from './page.module.css';
import Header from '@/components/Header/Header';
import FilterSection from '@/components/FilterSection/FilterSection';
import SwipeCard from '@/components/SwipeCard/SwipeCard';
import SavedList from '@/components/SavedList/SavedList';
import UniversityList from '@/components/UniversityList/UniversityList';
import AdmissionsDeadlines from '@/components/AdmissionsDeadlines/AdmissionsDeadlines';
import UniversityComparison from '@/components/UniversityComparison/UniversityComparison';
import AdmissionPredictor from '@/components/AdmissionPredictor/AdmissionPredictor';
import EntryTests from '@/components/EntryTests/EntryTests';
import AnimatedBackground from '@/components/Background/AnimatedBackground';
import DecorativeImages from '@/components/Background/DecorativeImages';
import Toast from '@/components/Toast/Toast';
import RecommendationsSection from '@/components/RecommendationsSection/RecommendationsSection';
import ScrollToTop from '@/components/ScrollToTop/ScrollToTop';
import SimilarUniversities from '@/components/SimilarUniversities/SimilarUniversities';
import ScholarshipsPanel from '@/components/ScholarshipsPanel/ScholarshipsPanel';
import FloatingPanel from '@/components/FloatingPanel/FloatingPanel';
import { useProfile } from '@/hooks/useProfile';
import { IconBookmark, IconArrowRight, IconCelebrate, IconArrowLeft } from '@/components/Icons/Icons';
import { universities } from '@/data/universities';
import { rankUniversities } from '@/utils/ranking';
import { loadSavedFromStorage, saveToStorage } from '@/utils/savedStorage';
import { getUniversitySlug, getPortalDomain, findUniversityByApplication } from '@/utils/universityHelpers';
import Link from 'next/link';

// Normalize saved item from localStorage: { university, savedAt, tag, note }
function hydrateSavedItems(rows) {
  return rows
    .map(({ id, savedAt, tag, note }) => {
      const university = universities.find(u => u.id === id);
      if (!university) return null;
      return { university, savedAt: savedAt ?? Date.now(), tag: tag ?? null, note: note ?? '' };
    })
    .filter(Boolean);
}

// Hydrate saved items from API applications (status='saved')
function hydrateSavedFromApplications(applications) {
  return applications
    .map((app) => {
      const university = findUniversityByApplication(app, universities);
      if (!university) return null;
      const savedAt = app.created_at ? new Date(app.created_at).getTime() : Date.now();
      return {
        university,
        savedAt,
        tag: null,
        note: app.notes ?? '',
        applicationId: app.id,
      };
    })
    .filter(Boolean);
}

export default function Home() {
  const { profile, loading: profileLoading } = useProfile();
  const isLoggedIn = !!profile;

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
  const [showScholarships, setShowScholarships] = useState(false);
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

  const savedUniversities = useMemo(() => savedItems.map(i => i.university), [savedItems]);
  const savedIds = useMemo(() => savedItems.map(i => i.university.id), [savedItems]);

  // Load saved: localStorage for guests, API for logged-in users
  useEffect(() => {
    const rows = loadSavedFromStorage();
    setSavedItems(hydrateSavedItems(rows));
    setSavedLoaded(true);
  }, []);

  // When logged in: fetch saved from API and sync localStorage items not yet in API
  useEffect(() => {
    if (!profile || !savedLoaded) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/applications', { credentials: 'include' });
        if (!res.ok || cancelled) return;
        const { applications } = await res.json();
        const savedFromApi = (applications || []).filter((a) => a.status === 'saved');
        let hydrated = hydrateSavedFromApplications(savedFromApi);

        if (cancelled) return;

        // Sync localStorage items not in API to Supabase
        const localRows = loadSavedFromStorage();
        const localItems = hydrateSavedItems(localRows);
        const apiIds = new Set(hydrated.map((i) => i.university.id));

        for (const item of localItems) {
          if (apiIds.has(item.university.id)) continue;
          const slug = getUniversitySlug(item.university);
          const domain = getPortalDomain(item.university);
          if (!slug || !domain) continue;
          try {
            const postRes = await fetch('/api/applications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                university_slug: slug,
                university_name: item.university.shortName ?? item.university.name,
                portal_domain: domain,
                status: 'saved',
              }),
            });
            if (postRes.ok && !cancelled) {
              const { application } = await postRes.json();
              hydrated = [...hydrated, {
                university: item.university,
                savedAt: item.savedAt,
                tag: item.tag,
                note: item.note,
                applicationId: application.id,
              }];
              apiIds.add(item.university.id);
            }
          } catch (_) {}
        }

        if (!cancelled && hydrated.length >= 0) {
          setSavedItems(hydrated);
        }
      } catch (e) {
        console.warn('Failed to fetch saved from API', e);
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.id, savedLoaded]);

  // Persist saved items to localStorage when they change (after initial load)
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

  const addSavedWithSync = useCallback(async (university) => {
    const item = { university, savedAt: Date.now(), tag: null, note: '' };
    setSavedItems(prev => [...prev, item]);

    if (isLoggedIn) {
      const slug = getUniversitySlug(university);
      const domain = getPortalDomain(university);
      if (slug && domain) {
        try {
          const res = await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              university_slug: slug,
              university_name: university.shortName ?? university.name,
              portal_domain: domain,
              status: 'saved',
            }),
          });
          if (res.ok) {
            const { application } = await res.json();
            setSavedItems(prev =>
              prev.map(i => i.university.id === university.id ? { ...i, applicationId: application.id } : i)
            );
          }
        } catch (_) {}
      }
    }
  }, [isLoggedIn]);

  // Handle swipe action
  const handleSwipe = (direction, university) => {
    if (direction === 'right') {
      if (!savedIds.includes(university.id)) {
        addSavedWithSync(university);
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
      addSavedWithSync(university);
      showToast(`${university.shortName} added to saved list`, 'success');
    }
  };

  // Remove from saved
  const handleRemoveSaved = useCallback(async (id, applicationId) => {
    const item = savedItems.find(i => i.university.id === id);
    const name = item?.university?.shortName ?? 'University';

    if (isLoggedIn && (applicationId ?? item?.applicationId)) {
      try {
        await fetch(`/api/applications/${applicationId ?? item.applicationId}`, { method: 'DELETE', credentials: 'include' });
      } catch (_) {}
    }

    setSavedItems(prev => prev.filter(i => i.university.id !== id));
    showToast(`${name} removed from list`, 'removed');
  }, [savedItems, isLoggedIn]);

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

  // Keyboard: Escape closes saved panel; arrow keys in swipe mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showSaved) {
          setShowSaved(false);
          e.preventDefault();
        } else if (showScholarships) {
          setShowScholarships(false);
          e.preventDefault();
        }
        return;
      }
      if (!isSwipeMode || !hasMoreCards) return;
      const topCard = visibleCards[0];
      if (e.key === 'ArrowLeft' && topCard) {
        handleSwipe('left', topCard);
        e.preventDefault();
      } else if (e.key === 'ArrowRight' && topCard) {
        handleSwipe('right', topCard);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSaved, showScholarships, isSwipeMode, hasMoreCards, visibleCards]);

  return (
    <main className={styles.main}>
      <AnimatedBackground />
      <DecorativeImages />

      <Header
        savedCount={savedItems.length}
        onShowSaved={() => setShowSaved(true)}
        onShowScholarships={() => setShowScholarships(true)}
      />




      {/* Social proof for non-logged-in users */}
      {!isLoggedIn && !isSwipeMode && (
        <div className={styles.socialProof}>
          Used by students applying to NUST, LUMS, FAST and 23 more universities
        </div>
      )}

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
              <>
                <div className={styles.swipeHint} role="status" aria-label="Swipe left to skip, right to save">
                  <span className={styles.hintLeft}><IconArrowLeft className={styles.hintIcon} aria-hidden /> Skip</span>
                  <span className={styles.hintCenter}>Swipe, tap, or use arrow keys</span>
                  <span className={styles.hintRight}>Save <IconArrowRight className={styles.hintIcon} aria-hidden /></span>
                </div>
                <p className={styles.statsStrip}>
                  Explored <strong>{currentIndex + skippedIds.length}</strong>
                  {' · '}Saved <strong>{savedItems.length}</strong>
                  {' · '}<strong>{rankedUniversities.length - currentIndex}</strong> remaining
                </p>
              </>
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

          {/* You might also like - similar to shortlist */}
          {savedItems.length > 0 && (
            <SimilarUniversities
              rankedUniversities={allRankedUniversities}
              savedIds={savedIds}
              savedUniversities={savedUniversities}
              field={filters.field}
              onSave={handleSaveFromList}
            />
          )}

          {/* Admissions Deadlines Section */}
          <AdmissionsDeadlines currentField={filters.field} />

          {/* University Comparison Tool */}
          <UniversityComparison initialSelectedIds={compareInitialIds} onConsumeInitialIds={() => setCompareInitialIds(null)} />

          {/* Admission Chance Predictor */}
          <AdmissionPredictor />

          {/* Entry Tests & Cutoffs */}
          <EntryTests />
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
          isLoggedIn={isLoggedIn}
        />
      )}

      {showScholarships && (
        <ScholarshipsPanel onClose={() => setShowScholarships(false)} savedIds={savedIds} />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      <FloatingPanel />
      <ScrollToTop />
    </main>
  );
}
