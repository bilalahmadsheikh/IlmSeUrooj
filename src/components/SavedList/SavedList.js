'use client';

import { useState, useMemo } from 'react';
import styles from './SavedList.module.css';

const SORT_OPTIONS = [
  { value: 'manual', label: 'My order' },
  { value: 'savedAt', label: 'Date saved' },
  { value: 'deadline', label: 'Nearest deadline' },
  { value: 'ranking', label: 'Ranking' },
];

const TAGS = [
  { value: null, label: 'No tag', color: null },
  { value: 'dream', label: 'Dream', color: 'dream' },
  { value: 'target', label: 'Target', color: 'target' },
  { value: 'safety', label: 'Safety', color: 'safety' },
];

function formatDeadline(uni) {
  const d = uni?.admissions?.deadline;
  if (!d) return null;
  const date = new Date(d);
  return date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDeadlineTime(uni) {
  const d = uni?.admissions?.deadline;
  return d ? new Date(d).getTime() : Infinity;
}

export default function SavedList({
  savedItems,
  onRemove,
  onUpdateItem,
  onReorder,
  onCompare,
  onClose,
}) {
  const [sortBy, setSortBy] = useState('manual');
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState(new Set());
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);

  const sortedItems = useMemo(() => {
    const list = [...savedItems];
    if (sortBy === 'manual') return list;
    if (sortBy === 'savedAt') return list.sort((a, b) => b.savedAt - a.savedAt);
    if (sortBy === 'deadline') return list.sort((a, b) => getDeadlineTime(a.university) - getDeadlineTime(b.university));
    if (sortBy === 'ranking') return list.sort((a, b) => (a.university.ranking ?? 999) - (b.university.ranking ?? 999));
    return list;
  }, [savedItems, sortBy]);

  const toggleCompareSelect = (id) => {
    setCompareSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  const handleCompare = () => {
    const ids = [...compareSelected];
    if (ids.length >= 2) {
      onCompare?.(ids);
      setCompareMode(false);
      setCompareSelected(new Set());
    }
  };

  const copyList = () => {
    const text = sortedItems
      .map((item, i) => `${i + 1}. ${item.university.shortName} — ${item.university.city} (${item.university.type})`)
      .join('\n');
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const applyLinks = useMemo(() => {
    return sortedItems
      .filter((item) => item.university.admissions?.applyUrl)
      .map((item) => ({
        name: item.university.shortName,
        url: item.university.admissions.applyUrl,
      }));
  }, [sortedItems]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.titleIcon}>💚</span>
            Saved Universities
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {savedItems.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIllustration}>
              <span className={styles.emptyBookmark} aria-hidden>📑</span>
              <span className={styles.emptyCap} aria-hidden>🎓</span>
            </div>
            <p className={styles.emptyText}>No universities saved yet!</p>
            <p className={styles.emptyHint}>
              Swipe right on cards or tap the heart on the list to save universities here.
            </p>
            <p className={styles.emptySubhint}>Your list is saved on this device and persists across visits.</p>
          </div>
        ) : (
          <>
            <div className={styles.toolbar}>
              <label className={styles.sortLabel}>Sort by</label>
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {compareMode ? (
                <div className={styles.compareActions}>
                  <button
                    type="button"
                    className={styles.compareBtnPrimary}
                    onClick={handleCompare}
                    disabled={compareSelected.size < 2}
                  >
                    Compare {compareSelected.size > 0 ? `(${compareSelected.size})` : ''}
                  </button>
                  <button
                    type="button"
                    className={styles.compareBtnSecondary}
                    onClick={() => { setCompareMode(false); setCompareSelected(new Set()); }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.compareModeBtn}
                  onClick={() => setCompareMode(true)}
                >
                  Compare 2–3
                </button>
              )}
            </div>

            <div className={styles.list}>
              {sortedItems.map((item, index) => {
                const uni = item.university;
                const isSelected = compareSelected.has(uni.id);
                const canMoveUp = sortBy === 'manual' && index > 0;
                const canMoveDown = sortBy === 'manual' && index < sortedItems.length - 1;
                const originalIndex = savedItems.findIndex((i) => i.university.id === uni.id);

                return (
                  <div key={uni.id} className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}>
                    {compareMode && (
                      <button
                        type="button"
                        className={styles.compareCheck}
                        onClick={() => toggleCompareSelect(uni.id)}
                        aria-pressed={isSelected}
                      >
                        {isSelected ? '✓' : ''}
                      </button>
                    )}
                    <div className={styles.itemMain}>
                      <div className={styles.itemLogo}>
                        <span>{uni.shortName.charAt(0)}</span>
                      </div>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemRow}>
                          <h3 className={styles.itemName}>{uni.shortName}</h3>
                          {uni.ranking != null && (
                            <span className={styles.rankBadge}>#{uni.ranking}</span>
                          )}
                        </div>
                        <p className={styles.itemDetails}>
                          <span>{uni.city}</span>
                          <span>•</span>
                          <span>{uni.type}</span>
                        </p>
                        {formatDeadline(uni) && (
                          <p className={styles.deadline}>
                            Apply by {formatDeadline(uni)}
                          </p>
                        )}
                        <div className={styles.tagRow}>
                          <select
                            className={styles.tagSelect}
                            value={item.tag ?? ''}
                            onChange={(e) =>
                              onUpdateItem(uni.id, {
                                tag: e.target.value === '' ? null : e.target.value,
                              })
                            }
                          >
                            {TAGS.map((t) => (
                              <option key={String(t.value)} value={t.value ?? ''}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {expandedNoteId === uni.id ? (
                          <div className={styles.noteBlock}>
                            <textarea
                              className={styles.noteInput}
                              placeholder="Add a note (visits, preferences…)"
                              value={item.note}
                              onChange={(e) => onUpdateItem(uni.id, { note: e.target.value })}
                              rows={2}
                            />
                            <button
                              type="button"
                              className={styles.noteClose}
                              onClick={() => setExpandedNoteId(null)}
                            >
                              Done
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.noteTrigger}
                            onClick={() => setExpandedNoteId(uni.id)}
                          >
                            {item.note ? `📝 ${item.note.slice(0, 30)}${item.note.length > 30 ? '…' : ''}` : '+ Add note'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      {sortBy === 'manual' && (
                        <div className={styles.reorderBtns}>
                          <button
                            type="button"
                            className={styles.reorderBtn}
                            onClick={() => onReorder(originalIndex, originalIndex - 1)}
                            disabled={!canMoveUp}
                            aria-label="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className={styles.reorderBtn}
                            onClick={() => onReorder(originalIndex, originalIndex + 1)}
                            disabled={!canMoveDown}
                            aria-label="Move down"
                          >
                            ↓
                          </button>
                        </div>
                      )}
                      {uni.website && (
                        <a
                          href={uni.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.linkBtn}
                        >
                          Site
                        </a>
                      )}
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => onRemove(uni.id)}
                        aria-label={`Remove ${uni.shortName}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.footer}>
              <p className={styles.count}>
                {savedItems.length} universit{savedItems.length === 1 ? 'y' : 'ies'} saved
              </p>
              <div className={styles.footerActions}>
                <button type="button" className={styles.exportBtn} onClick={copyList}>
                  {copied ? 'Copied!' : 'Copy list'}
                </button>
                {applyLinks.length > 0 && (
                  <div className={styles.applyWrap}>
                    <button
                      type="button"
                      className={styles.applyBtn}
                      onClick={() => setApplyOpen(!applyOpen)}
                    >
                      Apply to selected →
                    </button>
                    {applyOpen && (
                      <div className={styles.applyDropdown}>
                        {applyLinks.map(({ name, url }) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.applyLink}
                          >
                            {name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
