'use client';

import { useState } from 'react';
import styles from './UniversityList.module.css';
import { getMatchPercentage, getFieldRank } from '@/utils/ranking';

export default function UniversityList({ universities, field, onSave, savedIds }) {
    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (universities.length === 0) {
        return (
            <section className={styles.section}>
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>🔍</span>
                    <p>No universities match your current filters.</p>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <span className={styles.titleIcon}>🏛️</span>
                    All Universities
                    <span className={styles.count}>({universities.length})</span>
                </h2>
                <p className={styles.subtitle}>
                    Ranked by {field} programs
                </p>
            </div>

            <div className={styles.list}>
                {universities.map((uni, index) => {
                    const isExpanded = expandedId === uni.id;
                    const isSaved = savedIds.includes(uni.id);
                    const fieldRank = getFieldRank(uni, field);
                    const matchPercent = getMatchPercentage(uni.matchScore || 0);

                    return (
                        <div
                            key={uni.id}
                            className={`${styles.card} ${isExpanded ? styles.expanded : ''} ${isSaved ? styles.saved : ''}`}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.rank}>
                                    <span className={styles.rankNumber}>#{index + 1}</span>
                                    {fieldRank && fieldRank <= 3 && (
                                        <span className={styles.topBadge}>🏆</span>
                                    )}
                                </div>

                                <div className={styles.logo}>
                                    <span>{uni.shortName.charAt(0)}</span>
                                </div>

                                <div className={styles.info}>
                                    <h3 className={styles.name}>{uni.shortName}</h3>
                                    <p className={styles.fullName}>{uni.name}</p>
                                    <div className={styles.tags}>
                                        <span className={styles.tag}>📍 {uni.city}</span>
                                        <span className={styles.tag}>🏛️ {uni.type}</span>
                                        {fieldRank && (
                                            <span className={styles.tagHighlight}>
                                                #{fieldRank} in {field}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <div className={styles.matchBadge}>
                                        <span className={styles.matchPercent}>{matchPercent}%</span>
                                        <span className={styles.matchLabel}>Match</span>
                                    </div>
                                </div>
                            </div>

                            {/* Expandable Details */}
                            {isExpanded && (
                                <div className={styles.details}>
                                    <p className={styles.description}>{uni.description}</p>

                                    <div className={styles.detailsGrid}>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>💰 Avg Fee</span>
                                            <span className={styles.detailValue}>{uni.avgFee}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>📅 Established</span>
                                            <span className={styles.detailValue}>{uni.established}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>🏠 Campus</span>
                                            <span className={styles.detailValue}>{uni.hostelAvailability}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>🎯 Focus</span>
                                            <span className={styles.detailValue}>{uni.campusType}</span>
                                        </div>
                                    </div>

                                    <div className={styles.programs}>
                                        <h4 className={styles.programsTitle}>{field} Programs</h4>
                                        <div className={styles.programTags}>
                                            {(uni.programs[field] || []).map((program, idx) => (
                                                <span key={idx} className={styles.programTag}>{program}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles.highlights}>
                                        <h4 className={styles.highlightsTitle}>Highlights</h4>
                                        <div className={styles.highlightTags}>
                                            {uni.highlights.map((h, idx) => (
                                                <span key={idx} className={styles.highlightTag}>✨ {h}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* View Full Details button */}
                                    <button className={styles.fullDetailsBtn} disabled>
                                        View Full Details →
                                        <span className={styles.comingSoon}>Coming Soon</span>
                                    </button>
                                </div>
                            )}

                            {/* Card Footer Actions */}
                            <div className={styles.cardFooter}>
                                <button
                                    className={styles.expandBtn}
                                    onClick={() => toggleExpand(uni.id)}
                                >
                                    {isExpanded ? '▲ Show Less' : '▼ View Details'}
                                </button>

                                <button
                                    className={`${styles.saveBtn} ${isSaved ? styles.savedBtn : ''}`}
                                    onClick={() => onSave(uni)}
                                    disabled={isSaved}
                                >
                                    {isSaved ? '✓ Saved' : '💚 Save'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
