const STORAGE_KEY = 'unimatch-saved';
const VERSION = 1;

/**
 * Persist saved list: array of { id, savedAt, tag, note }
 */
export function loadSavedFromStorage() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data?.items)) return [];
    return data.items;
  } catch {
    return [];
  }
}

/**
 * Save to localStorage. items = [{ id, savedAt, tag, note }, ...]
 */
export function saveToStorage(items) {
  if (typeof window === 'undefined') return;
  try {
    const toStore = items.map(({ university, savedAt, tag, note }) => ({
      id: university.id,
      savedAt: savedAt ?? Date.now(),
      tag: tag ?? null,
      note: note ?? '',
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, items: toStore }));
  } catch (e) {
    console.warn('Failed to persist saved list', e);
  }
}
