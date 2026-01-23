'use client';

import { useState, useMemo } from 'react';
import styles from './UniversityComparison.module.css';
import { universities } from '@/data/universities';
import { departmentDetails, comparisonCriteria, departmentOptions } from '@/data/departmentData';

export default function UniversityComparison() {
    const [selectedUnis, setSelectedUnis] = useState([null, null, null]);
    const [selectedDepartment, setSelectedDepartment] = useState('Computer Science');
    const [selectedCriteria, setSelectedCriteria] = useState('overall');

    // Filter universities that have the selected department
    const filteredUniversities = useMemo(() => {
        return universities.filter(uni =>
            uni.fields.includes(selectedDepartment) &&
            departmentDetails[uni.id]?.[selectedDepartment]
        );
    }, [selectedDepartment]);

    const handleSelect = (index, uniId) => {
        const newSelected = [...selectedUnis];
        newSelected[index] = uniId ? universities.find(u => u.id === parseInt(uniId)) : null;
        setSelectedUnis(newSelected);
    };

    // Get department data for a university
    const getDeptData = (uni) => {
        if (!uni) return null;
        return departmentDetails[uni.id]?.[selectedDepartment] || null;
    };

    // Get comparison value based on field type
    const getComparisonValue = (uni, field) => {
        if (!uni) return '-';
        const deptData = getDeptData(uni);
        if (!deptData) return 'N/A';

        const value = deptData[field.key];
        if (value === undefined) return '-';

        if (field.type === 'list' && Array.isArray(value)) {
            return value.slice(0, 3).join(', ');
        }
        if (field.type === 'rank') {
            return `#${value}`;
        }
        return value;
    };

    // Find the best value for a field among selected universities
    const getBestValue = (fieldKey, fieldType) => {
        const selected = selectedUnis.filter(u => u !== null && getDeptData(u));
        if (selected.length < 2) return null;

        if (fieldType === 'rank' || fieldType === 'number') {
            // For ranking, lower is better. For research papers, higher is better.
            if (fieldKey === 'ranking') {
                return selected.reduce((best, u) => {
                    const current = getDeptData(u)?.[fieldKey];
                    const bestVal = getDeptData(best)?.[fieldKey];
                    return current < bestVal ? u : best;
                }, selected[0])?.id;
            }
            // For numbers like research papers, higher is better
            return selected.reduce((best, u) => {
                const current = getDeptData(u)?.[fieldKey];
                const bestVal = getDeptData(best)?.[fieldKey];
                return current > bestVal ? u : best;
            }, selected[0])?.id;
        }

        if (fieldType === 'percentage') {
            return selected.reduce((best, u) => {
                const current = parseInt(getDeptData(u)?.[fieldKey]) || 0;
                const bestVal = parseInt(getDeptData(best)?.[fieldKey]) || 0;
                return current > bestVal ? u : best;
            }, selected[0])?.id;
        }

        if (fieldType === 'salary') {
            return selected.reduce((best, u) => {
                const current = parseInt(getDeptData(u)?.[fieldKey]?.replace(/[^0-9]/g, '')) || 0;
                const bestVal = parseInt(getDeptData(best)?.[fieldKey]?.replace(/[^0-9]/g, '')) || 0;
                return current > bestVal ? u : best;
            }, selected[0])?.id;
        }

        if (fieldType === 'quality') {
            const qualityOrder = ['Exceptional', 'World-Class', 'Excellent', 'Very High', 'High', 'Good', 'Medium', 'Average', 'Low'];
            return selected.reduce((best, u) => {
                const currentIdx = qualityOrder.indexOf(getDeptData(u)?.[fieldKey]) || 999;
                const bestIdx = qualityOrder.indexOf(getDeptData(best)?.[fieldKey]) || 999;
                return currentIdx < bestIdx ? u : best;
            }, selected[0])?.id;
        }

        return null;
    };

    const currentCriteria = comparisonCriteria.find(c => c.id === selectedCriteria);
    const hasSelection = selectedUnis.some(u => u !== null);

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <span className={styles.titleIcon}>⚖️</span>
                    Compare Universities
                </h2>
                <p className={styles.subtitle}>
                    Select department and criteria to compare universities side-by-side
                </p>
            </div>

            {/* Filter Dropdowns */}
            <div className={styles.filterSection}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>
                        <span className={styles.filterIcon}>🎓</span>
                        Department
                    </label>
                    <select
                        className={styles.filterSelect}
                        value={selectedDepartment}
                        onChange={(e) => {
                            setSelectedDepartment(e.target.value);
                            setSelectedUnis([null, null, null]); // Reset selection
                        }}
                    >
                        {departmentOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.icon} {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>
                        <span className={styles.filterIcon}>📋</span>
                        Compare By
                    </label>
                    <select
                        className={styles.filterSelect}
                        value={selectedCriteria}
                        onChange={(e) => setSelectedCriteria(e.target.value)}
                    >
                        {comparisonCriteria.map(criteria => (
                            <option key={criteria.id} value={criteria.id}>
                                {criteria.icon} {criteria.label}
                            </option>
                        ))}
                    </select>
                </div>
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
                            {filteredUniversities.map((uni) => (
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
                                <div className={styles.uniDetails}>
                                    <span className={styles.uniName}>{selectedUnis[index].shortName}</span>
                                    <span className={styles.uniCity}>{selectedUnis[index].city}</span>
                                </div>
                                {getDeptData(selectedUnis[index]) && (
                                    <span className={styles.deptRank}>
                                        #{getDeptData(selectedUnis[index]).ranking} in {selectedDepartment}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Comparison Table */}
            {hasSelection && currentCriteria && (
                <div className={styles.comparisonTable}>
                    <div className={styles.criteriaHeader}>
                        <span className={styles.criteriaIcon}>{currentCriteria.icon}</span>
                        <h3 className={styles.criteriaTitle}>{currentCriteria.label}</h3>
                        <span className={styles.deptBadge}>{selectedDepartment}</span>
                    </div>

                    {currentCriteria.fields.map((field) => {
                        const bestId = getBestValue(field.key, field.type);
                        return (
                            <div key={field.key} className={styles.row}>
                                <div className={styles.rowLabel}>
                                    <span className={styles.fieldLabel}>{field.label}</span>
                                </div>
                                <div className={styles.rowValues}>
                                    {selectedUnis.map((uni, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.value} ${uni && bestId === uni.id ? styles.best : ''}`}
                                        >
                                            <span className={styles.valueText}>
                                                {getComparisonValue(uni, field)}
                                            </span>
                                            {uni && bestId === uni.id && (
                                                <span className={styles.bestBadge}>Best</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Key Facilities Section */}
                    <div className={styles.facilitiesSection}>
                        <h4 className={styles.facilitiesTitle}>🔧 Key Facilities & Labs</h4>
                        <div className={styles.facilitiesGrid}>
                            {selectedUnis.map((uni, index) => (
                                <div key={index} className={styles.facilitiesCard}>
                                    {uni && getDeptData(uni) ? (
                                        <>
                                            <h5>{uni.shortName}</h5>
                                            <div className={styles.facilitiesList}>
                                                {getDeptData(uni).facilities?.map((facility, idx) => (
                                                    <span key={idx} className={styles.facilityTag}>
                                                        {facility}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <span className={styles.noSelection}>
                                            {uni ? 'No data for this department' : 'Not selected'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Recruiters Section */}
                    <div className={styles.recruitersSection}>
                        <h4 className={styles.recruitersTitle}>🏢 Top Recruiters & Partners</h4>
                        <div className={styles.recruitersGrid}>
                            {selectedUnis.map((uni, index) => (
                                <div key={index} className={styles.recruitersCard}>
                                    {uni && getDeptData(uni) ? (
                                        <>
                                            <h5>{uni.shortName}</h5>
                                            <div className={styles.recruitersList}>
                                                {getDeptData(uni).internshipPartners?.map((partner, idx) => (
                                                    <span key={idx} className={styles.recruiterTag}>
                                                        {partner}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <span className={styles.noSelection}>
                                            {uni ? 'No data' : 'Not selected'}
                                        </span>
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
                    <p>Select universities above to compare {selectedDepartment} departments</p>
                    <span className={styles.emptyHint}>
                        {filteredUniversities.length} universities offer {selectedDepartment}
                    </span>
                </div>
            )}
        </section>
    );
}
