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
import LoginPromptModal from '@/components/LoginPromptModal/LoginPromptModal';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingSaveUniversity, setPendingSaveUniversity] = useState(null);

  // Saved items: [{ university, savedAt, tag, note }, ...] — order = display order
  const [savedItems, setSavedItems] = useState([]);
  const [savedLoaded, setSavedLoaded] = useState(false);

  // Universities state
  const [rankedUniversities, setRankedUniversities] = useState([]);
  const [allRankedUniversities, setAllRankedUniversities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Use a plain array but derive Set in useMemo for O(1) lookups
  const [skippedIds, setSkippedIds] = useState([]);
  const skippedSet = useMemo(() => new Set(skippedIds), [skippedIds]);

  const savedUniversities = useMemo(() => savedItems.map(i => i.university), [savedItems]);
  const savedIds = useMemo(() => savedItems.map(i => i.university.id), [savedItems]);
  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

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

        // Sync localStorage items not in API to Supabase — one batch request instead of N
        const localRows = loadSavedFromStorage();
        const localItems = hydrateSavedItems(localRows);
        const apiIds = new Set(hydrated.map((i) => i.university.id));

        const toSync = localItems
          .filter((item) => !apiIds.has(item.university.id))
          .map((item) => ({
            university_slug: getUniversitySlug(item.university),
            university_name: item.university.shortName ?? item.university.name,
            portal_domain: getPortalDomain(item.university),
            status: 'saved',
            _item: item, // keep reference for hydration below
          }))
          .filter((x) => x.university_slug && x.portal_domain);

        if (toSync.length > 0) {
          try {
            const batchRes = await fetch('/api/applications/batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                items: toSync.map(({ _item: _unused, ...rest }) => rest),
              }),
            });
            if (batchRes.ok && !cancelled) {
              const { created: createdRecords = [] } = await batchRes.json();
              // Map created records back to local items by slug
              const createdBySlug = new Map(createdRecords.map((a) => [a.university_slug, a]));
              for (const syncItem of toSync) {
                const record = createdBySlug.get(syncItem.university_slug);
                hydrated = [...hydrated, {
                  university: syncItem._item.university,
                  savedAt: syncItem._item.savedAt,
                  tag: syncItem._item.tag,
                  note: syncItem._item.note,
                  applicationId: record?.id ?? null,
                }];
              }
            }
          } catch (syncErr) {
            console.warn('[page] Batch sync failed, saved list may be out of sync:', syncErr);
          }
        }

        if (!cancelled) {
          setSavedItems(hydrated);
        }
      } catch (e) {
        console.warn('[page] Failed to fetch saved from API:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.id, savedLoaded]);

  // Persist saved items to localStorage when they change (after initial load)
  useEffect(() => {
    if (!savedLoaded) return;
    saveToStorage(savedItems);
  }, [savedItems, savedLoaded]);

  // Rank universities when filters change — uses Sets for O(1) exclusion lookups
  useEffect(() => {
    const ranked = rankUniversities(universities, filters);
    setAllRankedUniversities(ranked);
    const filtered = ranked.filter(uni => !savedSet.has(uni.id) && !skippedSet.has(uni.id));
    setRankedUniversities(filtered);
    setCurrentIndex(0);
  }, [filters, savedSet, skippedSet]);

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
          } else if (res.status !== 409) {
            // 409 = already exists (duplicate save), that's fine. Anything else is unexpected.
            console.warn('[page] Failed to sync save to API, status:', res.status);
          }
        } catch (err) {
          // Network error — item is still saved locally via localStorage, so don't show error to user
          console.warn('[page] Save sync failed (network):', err);
        }
      }
    }
  }, [isLoggedIn]);

  // Handle swipe action
  const handleSwipe = useCallback((direction, university) => {
    if (direction === 'right') {
      if (!savedSet.has(university.id)) {
        if (!isLoggedIn) {
          setPendingSaveUniversity(university);
          setShowLoginPrompt(true);
          return;
        }
        addSavedWithSync(university);
        showToast(`${university.shortName} saved to your list!`, 'success');
      }
    } else {
      setSkippedIds(prev => [...prev, university.id]);
    }
    setCurrentIndex(prev => prev + 1);
  }, [savedSet, isLoggedIn, addSavedWithSync, showToast]);

  // Handle save from list — shows login prompt for guests
  const handleSaveFromList = useCallback((university) => {
    if (savedSet.has(university.id)) return;
    if (!isLoggedIn) {
      setPendingSaveUniversity(university);
      setShowLoginPrompt(true);
      return;
    }
    addSavedWithSync(university);
    showToast(`${university.shortName} added to saved list`, 'success');
  }, [savedSet, isLoggedIn, addSavedWithSync, showToast]);

  const handleSaveAsGuest = useCallback(() => {
    if (pendingSaveUniversity && !savedSet.has(pendingSaveUniversity.id)) {
      addSavedWithSync(pendingSaveUniversity);
      showToast(`${pendingSaveUniversity.shortName} added to saved list`, 'success');
    }
    setPendingSaveUniversity(null);
    setShowLoginPrompt(false);
  }, [pendingSaveUniversity, savedSet, addSavedWithSync, showToast]);

  // Remove from saved
  const handleRemoveSaved = useCallback(async (id, applicationId) => {
    const item = savedItems.find(i => i.university.id === id);
    const name = item?.university?.shortName ?? 'University';
    const appId = applicationId ?? item?.applicationId;

    // Optimistically remove from UI immediately
    setSavedItems(prev => prev.filter(i => i.university.id !== id));
    showToast(`${name} removed from list`, 'removed');

    if (isLoggedIn && appId) {
      try {
        const res = await fetch(`/api/applications/${appId}`, { method: 'DELETE', credentials: 'include' });
        if (!res.ok && res.status !== 404) {
          // 404 means it was already gone — that's fine
          console.warn('[page] Failed to delete application from API, status:', res.status);
        }
      } catch (err) {
        // Network error — item is removed from UI and localStorage, API will self-correct on next sync
        console.warn('[page] Remove sync failed (network):', err);
      }
    }
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

  // Search-filtered view of all ranked universities (used for UniversityList + RecommendationsSection)
  const searchFilteredUniversities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allRankedUniversities;
    return allRankedUniversities.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.shortName?.toLowerCase().includes(q) ||
      u.city?.toLowerCase().includes(q)
    );
  }, [allRankedUniversities, searchQuery]);

  // Get visible cards (current + next for stacking effect) — memoized to prevent re-render cascade
  const visibleCards = useMemo(
    () => rankedUniversities.slice(currentIndex, currentIndex + 2),
    [rankedUniversities, currentIndex]
  );
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {!isSwipeMode && searchFilteredUniversities.length > 0 && (
        <RecommendationsSection
          rankedUniversities={searchFilteredUniversities}
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
                    width: (() => {
                      const total = rankedUniversities.length + savedItems.length + skippedIds.length;
                      return total ? `${((currentIndex + savedItems.length) / total) * 100}%` : '0%';
                    })()
                  }}
                />
              </div>
              <span className={styles.progressText}>
                {currentIndex + 1} of {rankedUniversities.length + skippedIds.length} remaining
              </span>
            </div>
          </section>

          {/* University List Section — respects search query */}
          <UniversityList
            universities={searchFilteredUniversities}
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
          <AdmissionsDeadlines currentField={filters.field} savedIds={savedIds} />

        </div>
      )}

      {/* University Comparison Tool — always rendered for hash nav */}
      <div id="compare">
        <UniversityComparison initialSelectedIds={compareInitialIds} onConsumeInitialIds={() => setCompareInitialIds(null)} />
      </div>

      {/* Admission Chance Predictor */}
      <div id="predictor">
        <AdmissionPredictor savedIds={savedIds} />
      </div>

      {/* Entry Tests & Cutoffs */}
      <div id="entry-tests">
        <EntryTests savedUniversities={savedUniversities} />
      </div>

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

      {showLoginPrompt && (
        <LoginPromptModal
          universityName={pendingSaveUniversity?.shortName}
          onContinueAsGuest={handleSaveAsGuest}
          onDismiss={() => { setPendingSaveUniversity(null); setShowLoginPrompt(false); }}
        />
      )}

      <FloatingPanel />
      <ScrollToTop />
    </main>
  );
}
