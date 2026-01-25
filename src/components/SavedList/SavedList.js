'use client';

import styles from './SavedList.module.css';

export default function SavedList({ savedUniversities, onRemove, onClose }) {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <span className={styles.titleIcon}>💚</span>
                        Saved Universities
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {savedUniversities.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}></span>
                        <p className={styles.emptyText}>No universities saved yet!</p>
                        <p className={styles.emptyHint}>Swipe right on universities you like to save them here.</p>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {savedUniversities.map((uni) => (
                            <div key={uni.id} className={styles.item}>
                                <div className={styles.itemLogo}>
                                    <span>{uni.shortName.charAt(0)}</span>
                                </div>
                                <div className={styles.itemInfo}>
                                    <h3 className={styles.itemName}>{uni.shortName}</h3>
                                    <p className={styles.itemDetails}>
                                        <span>{uni.city}</span>
                                        <span>•</span>
                                        <span>{uni.type}</span>
                                    </p>
                                </div>
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => onRemove(uni.id)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {savedUniversities.length > 0 && (
                    <div className={styles.footer}>
                        <p className={styles.count}>
                            {savedUniversities.length} universit{savedUniversities.length === 1 ? 'y' : 'ies'} saved
                        </p>
                        <button className={styles.applyBtn}>
                            Apply to Selected →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
