'use client';

import { useState } from 'react';
import styles from './UniversityComparison.module.css';
import { universities } from '@/data/universities';

export default function UniversityComparison() {
    const [selectedUnis, setSelectedUnis] = useState([null, null, null]);

    const handleSelect = (index, uniId) => {
        const newSelected = [...selectedUnis];
        newSelected[index] = uniId ? universities.find(u => u.id === parseInt(uniId)) : null;
        setSelectedUnis(newSelected);
    };

    const getComparisonValue = (uni, field) => {
        if (!uni) return '-';
        switch (field) {
            case 'fee': return uni.avgFee;
            case 'type': return uni.type;
            case 'city': return uni.city;
            case 'hostel': return uni.hostelAvailability;
            case 'campusType': return uni.campusType;
            case 'ranking': return `#${uni.ranking}`;
            case 'established': return uni.established;
            default: return '-';
        }
    };

    const getBestValue = (field) => {
        const selected = selectedUnis.filter(u => u !== null);
        if (selected.length < 2) return null;

        switch (field) {
            case 'ranking':
                return selected.reduce((best, u) =>
                    !best || u.ranking < best.ranking ? u : best, null)?.id;
            case 'established':
                return selected.reduce((best, u) =>
                    !best || u.established < best.established ? u : best, null)?.id;
            default:
                return null;
        }
    };

    const comparisonFields = [
        { key: 'ranking', label: '📊 Overall Ranking', description: 'National ranking based on research, faculty, and outcomes' },
        { key: 'type', label: '🏛️ Institution Type', description: 'Public (government-funded) or Private' },
        { key: 'city', label: '📍 Location', description: 'Main campus city' },
        { key: 'fee', label: '💰 Average Fee', description: 'Per semester fee range' },
        { key: 'hostel', label: '🏠 Hostel Availability', description: 'On-campus accommodation options' },
        { key: 'campusType', label: '🎯 Campus Focus', description: 'Research, Industry, or Campus Life oriented' },
        { key: 'established', label: '📅 Established', description: 'Year the university was founded' },
    ];

    const hasSelection = selectedUnis.some(u => u !== null);

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <span className={styles.titleIcon}>⚖️</span>
                    Compare Universities
                </h2>
                <p className={styles.subtitle}>
                    Select up to 3 universities to compare side-by-side
                </p>
            </div>

            {/* University Selectors */}
            <div className={styles.selectors}>
                {[0, 1, 2].map((index) => (
                    <div key={index} className={styles.selectorCard}>
                        <select
                            className={styles.select}
                            value={selectedUnis[index]?.id || ''}
                            onChange={(e) => handleSelect(index, e.target.value)}
                        >
                            <option value="">Select University {index + 1}</option>
                            {universities.map((uni) => (
                                <option
                                    key={uni.id}
                                    value={uni.id}
                                    disabled={selectedUnis.some((s, i) => i !== index && s?.id === uni.id)}
                                >
                                    {uni.shortName}
                                </option>
                            ))}
                        </select>

                        {selectedUnis[index] && (
                            <div className={styles.selectedInfo}>
                                <div className={styles.uniLogo}>
                                    {selectedUnis[index].shortName.charAt(0)}
                                </div>
                                <span className={styles.uniName}>{selectedUnis[index].shortName}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Comparison Table */}
            {hasSelection && (
                <div className={styles.comparisonTable}>
                    <div className={styles.methodology}>
                        <h4>📋 How We Compare</h4>
                        <p>Each field is compared based on official university data. Rankings are from HEC Pakistan.
                            Fees are approximate per-semester costs. Green highlight indicates the best option in that category.</p>
                    </div>

                    {comparisonFields.map((field) => {
                        const bestId = getBestValue(field.key);
                        return (
                            <div key={field.key} className={styles.row}>
                                <div className={styles.rowLabel}>
                                    <span className={styles.fieldLabel}>{field.label}</span>
                                    <span className={styles.fieldDesc}>{field.description}</span>
                                </div>
                                <div className={styles.rowValues}>
                                    {selectedUnis.map((uni, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.value} ${uni && bestId === uni.id ? styles.best : ''}`}
                                        >
                                            {getComparisonValue(uni, field.key)}
                                            {uni && bestId === uni.id && <span className={styles.bestBadge}>Best</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Programs Comparison */}
                    <div className={styles.programsSection}>
                        <h4 className={styles.programsTitle}>🎓 Available Programs</h4>
                        <div className={styles.programsGrid}>
                            {selectedUnis.map((uni, index) => (
                                <div key={index} className={styles.programsCard}>
                                    {uni ? (
                                        <>
                                            <h5>{uni.shortName}</h5>
                                            <div className={styles.fieldsList}>
                                                {uni.fields.map((field, idx) => (
                                                    <span key={idx} className={styles.fieldTag}>{field}</span>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <span className={styles.noSelection}>Not selected</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!hasSelection && (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📊</span>
                    <p>Select universities above to start comparing</p>
                </div>
            )}
        </section>
    );
}
