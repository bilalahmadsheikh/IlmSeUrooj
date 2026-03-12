'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { universities } from '@/data/universities';
import { loadSavedFromStorage, saveToStorage } from '@/utils/savedStorage';
import { getUniversitySlug, getPortalDomain, findUniversityByApplication } from '@/utils/universityHelpers';
import { useProfile } from '@/hooks/useProfile';

function hydrateSavedItems(rows) {
    return rows
        .map(({ id, savedAt, tag, note }) => {
            const university = universities.find(u => u.id === id || u.id === parseInt(id, 10));
            if (!university) return null;
            return { university, savedAt: savedAt ?? Date.now(), tag: tag ?? null, note: note ?? '' };
        })
        .filter(Boolean);
}

function hydrateSavedFromApplications(applications) {
    return applications
        .map((app) => {
            const university = findUniversityByApplication(app, universities);
            if (!university) return null;
            const savedAt = app.created_at ? new Date(app.created_at).getTime() : Date.now();
            return { university, savedAt, tag: null, note: app.notes ?? '', applicationId: app.id };
        })
        .filter(Boolean);
}

/**
 * Shared hook for saved-university state.
 * Reads from localStorage (guests) and Supabase (logged-in users).
 * Provides addSave/removeSave that sync to both stores.
 */
export function useSaved() {
    const { profile } = useProfile();
    const isLoggedIn = !!profile;

    const [savedItems, setSavedItems] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [pendingSaveUniversity, setPendingSaveUniversity] = useState(null);

    useEffect(() => {
        const rows = loadSavedFromStorage();
        setSavedItems(hydrateSavedItems(rows));
        setLoaded(true);
    }, []);

    useEffect(() => {
        if (!profile || !loaded) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/applications', { credentials: 'include' });
                if (!res.ok || cancelled) return;
                const { applications } = await res.json();
                const savedFromApi = (applications || []).filter(a => a.status === 'saved');
                const hydrated = hydrateSavedFromApplications(savedFromApi);
                if (!cancelled) {
                    const localRows = loadSavedFromStorage();
                    const localItems = hydrateSavedItems(localRows);
                    const apiIds = new Set(hydrated.map(i => i.university.id));
                    const extras = localItems.filter(item => !apiIds.has(item.university.id));
                    setSavedItems([...hydrated, ...extras]);
                }
            } catch (e) {
                console.warn('[useSaved] Failed to fetch saved from API:', e);
            }
        })();
        return () => { cancelled = true; };
    }, [profile?.id, loaded]);

    useEffect(() => {
        if (!loaded) return;
        saveToStorage(savedItems);
    }, [savedItems, loaded]);

    const savedIds = useMemo(() => savedItems.map(i => i.university.id), [savedItems]);
    const savedSet = useMemo(() => new Set(savedIds), [savedIds]);
    const savedUniversities = useMemo(() => savedItems.map(i => i.university), [savedItems]);

    const syncToApi = useCallback(async (university) => {
        const slug = getUniversitySlug(university);
        const domain = getPortalDomain(university);
        if (!slug || !domain) return null;
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
                return application?.id ?? null;
            }
        } catch { /* network error, localStorage is still the fallback */ }
        return null;
    }, []);

    const performSave = useCallback(async (university) => {
        if (savedSet.has(university.id)) return;
        const item = { university, savedAt: Date.now(), tag: null, note: '' };
        setSavedItems(prev => [...prev, item]);

        if (isLoggedIn) {
            const appId = await syncToApi(university);
            if (appId) {
                setSavedItems(prev =>
                    prev.map(i => i.university.id === university.id ? { ...i, applicationId: appId } : i)
                );
            }
        }
    }, [savedSet, isLoggedIn, syncToApi]);

    const addSave = useCallback((university) => {
        if (savedSet.has(university.id)) return;
        if (!isLoggedIn) {
            setPendingSaveUniversity(university);
            setShowLoginPrompt(true);
            return;
        }
        performSave(university);
    }, [savedSet, isLoggedIn, performSave]);

    const addSaveAsGuest = useCallback(() => {
        if (pendingSaveUniversity) {
            performSave(pendingSaveUniversity);
        }
        setPendingSaveUniversity(null);
        setShowLoginPrompt(false);
    }, [pendingSaveUniversity, performSave]);

    const dismissLoginPrompt = useCallback(() => {
        setPendingSaveUniversity(null);
        setShowLoginPrompt(false);
    }, []);

    const removeSave = useCallback(async (id, applicationId) => {
        const item = savedItems.find(i => i.university.id === id);
        const appId = applicationId ?? item?.applicationId;
        setSavedItems(prev => prev.filter(i => i.university.id !== id));

        if (isLoggedIn && appId) {
            try {
                await fetch(`/api/applications/${appId}`, { method: 'DELETE', credentials: 'include' });
            } catch { /* silent */ }
        }
    }, [savedItems, isLoggedIn]);

    const isSaved = useCallback((id) => savedSet.has(id), [savedSet]);

    return {
        savedItems,
        savedIds,
        savedUniversities,
        savedSet,
        isLoggedIn,
        loaded,
        addSave,
        addSaveAsGuest,
        removeSave,
        isSaved,
        showLoginPrompt,
        dismissLoginPrompt,
        pendingSaveUniversity,
    };
}
