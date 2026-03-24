'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import styles from './UniversityComparison.module.css';
import { universities } from '@/data/universities';
import { departmentDetails, comparisonCriteria, departmentOptions } from '@/data/departmentData';
import { universityDetails } from '@/data/universityDetails';
import SearchableSelect from '@/components/SearchableSelect/SearchableSelect';

export default function UniversityComparison({ initialSelectedIds, onConsumeInitialIds }) {
    const sectionRef = useRef(null);
    const [selectedUnis, setSelectedUnis] = useState([null, null, null]);
    const [selectedDepartment, setSelectedDepartment] = useState('Computer Science');
    const [selectedCriteria, setSelectedCriteria] = useState('overall');

    useEffect(() => {
        if (!initialSelectedIds?.length) return;
        const ids = initialSelectedIds.slice(0, 3);
        const selected = ids.map(id => universities.find(u => u.id === id) ?? null);
        setSelectedUnis([...selected, null, null, null].slice(0, 3));
        requestAnimationFrame(() => {
            sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        onConsumeInitialIds?.();
    }, [initialSelectedIds]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const handleDepartmentChange = (value) => {
        setSelectedDepartment(value);
        // Keep selection if the uni has data for the new department, otherwise clear that slot
        setSelectedUnis(prev => prev.map(u => {
            if (!u) return null;
            return (u.fields.includes(value) && departmentDetails[u.id]?.[value]) ? u : null;
        }));
    };

    const getDeptData = (uni) => {
        if (!uni) return null;
        return departmentDetails[uni.id]?.[selectedDepartment] || null;
    };

    const getComparisonValue = (uni, field) => {
        if (!uni) return '—';
        const deptData = getDeptData(uni);
        if (!deptData) return 'N/A';
        const value = deptData[field.key];
        if (value === undefined) return '—';
        if (field.type === 'list' && Array.isArray(value)) return value.slice(0, 3).join(', ');
        if (field.type === 'rank') return `#${value}`;
        return value;
    };

    const getNumericValue = (uni, field) => {
        if (!uni) return null;
        const deptData = getDeptData(uni);
        if (!deptData) return null;
        const val = deptData[field.key];
        if (field.type === 'percentage') return parseInt(val) || 0;
        if (field.type === 'salary') return parseInt(val?.replace(/[^0-9]/g, '')) || 0;
        if (field.type === 'number') return parseInt(val) || 0;
        return null;
    };

    const getBestValue = (fieldKey, fieldType) => {
        const selected = selectedUnis.filter(u => u !== null && getDeptData(u));
        if (selected.length < 2) return null;

        const getValue = (u) => {
            const deptData = getDeptData(u);
            if (!deptData) return null;
            const val = deptData[fieldKey];
            if (fieldType === 'percentage') return parseInt(val) || 0;
            if (fieldType === 'salary') return parseInt(val?.replace(/[^0-9]/g, '')) || 0;
            if (fieldType === 'number') return parseInt(val) || 0;
            if (fieldType === 'quality') {
                const order = ['Exceptional', 'World-Class', 'Government', 'International', 'Defense', 'Excellent', 'Very High', 'High', 'Good', 'Medium', 'Average', 'Low'];
                const idx = order.indexOf(val);
                return idx === -1 ? 999 : idx;
            }
            return val;
        };

        const values = selected.map(u => ({ uni: u, value: getValue(u) }));
        let sorted;
        if (fieldType === 'rank' || fieldKey === 'ranking') {
            sorted = [...values].sort((a, b) => (a.value || 999) - (b.value || 999));
        } else if (fieldType === 'quality') {
            sorted = [...values].sort((a, b) => (a.value || 999) - (b.value || 999));
        } else {
            sorted = [...values].sort((a, b) => (b.value || 0) - (a.value || 0));
        }

        if (sorted.length >= 2 && sorted[0].value === sorted[1].value) return null;
        return sorted[0]?.uni?.id || null;
    };

    const getMaxValue = (field) => {
        const vals = selectedUnis
            .filter(u => u && getDeptData(u))
            .map(u => getNumericValue(u, field))
            .filter(v => v !== null && v > 0);
        return vals.length ? Math.max(...vals) : 1;
    };

    const getSummaryWinner = () => {
        const activeUnis = selectedUnis.filter(u => u !== null && getDeptData(u));
        if (activeUnis.length < 2) return null;

        const wins = {};
        activeUnis.forEach(u => { wins[u.id] = 0; });

        comparisonCriteria.forEach(criteria => {
            criteria.fields.forEach(field => {
                const bestId = getBestValue(field.key, field.type);
                if (bestId && wins[bestId] !== undefined) wins[bestId]++;
            });
        });

        const sorted = Object.entries(wins).sort((a, b) => b[1] - a[1]);
        const totalFields = comparisonCriteria.reduce((sum, c) => sum + c.fields.length, 0);

        if (sorted[0][1] === 0) return null;

        return {
            uni: universities.find(u => u.id === parseInt(sorted[0][0])),
            wins: sorted[0][1],
            totalFields,
            isTie: sorted.length >= 2 && sorted[0][1] === sorted[1][1],
            breakdown: sorted
                .map(([id, w]) => ({ uni: universities.find(u => u.id === parseInt(id)), wins: w }))
                .filter(x => x.uni),
        };
    };

    const getBestHecRank = () => {
        const active = selectedUnis.filter(u => u !== null);
        if (active.length < 2) return null;
        const sorted = [...active].sort((a, b) => (a.ranking || 999) - (b.ranking || 999));
        if (sorted[0].ranking === sorted[1]?.ranking) return null;
        return sorted[0].id;
    };

    const currentCriteria = comparisonCriteria.find(c => c.id === selectedCriteria);
    const hasSelection = selectedUnis.some(u => u !== null);
    const summaryWinner = hasSelection ? getSummaryWinner() : null;
    const bestHecId = getBestHecRank();

    return (
        <section className={styles.section} ref={sectionRef}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    Compare Universities
                </h2>
                <p className={styles.subtitle}>
                    Compare up to 3 universities side-by-side across departments, fees, rankings & more
                </p>
            </div>

            {/* Department filter */}
            <div className={styles.filterSection}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>
                        Department
                    </label>
                    <SearchableSelect
                        value={selectedDepartment}
                        onChange={handleDepartmentChange}
                        options={departmentOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                        placeholder="Select department..."
                    />
                </div>
                <div className={styles.filterInfo}>
                    <span className={styles.filterInfoBadge}>{filteredUniversities.length}</span>
                    <span className={styles.filterInfoText}>universities offer {selectedDepartment}</span>
                </div>
            </div>

            {/* University selectors */}
            <div className={styles.selectors}>
                {[0, 1, 2].map((index) => {
                    const availableOptions = filteredUniversities
                        .filter(uni => !selectedUnis.some((s, i) => i !== index && s?.id === uni.id))
                        .map(uni => ({ value: String(uni.id), label: uni.shortName }));
                    return (
                        <div key={index} className={styles.selectorCard}>
                            <SearchableSelect
                                value={selectedUnis[index]?.id ? String(selectedUnis[index].id) : ''}
                                onChange={(value) => handleSelect(index, value)}
                                options={[{ value: '', label: `University ${index + 1}` }, ...availableOptions]}
                                placeholder={`University ${index + 1}...`}
                            />
                            {selectedUnis[index] && (
                                <div className={styles.selectedInfo}>
                                    <div className={styles.uniLogo}>{selectedUnis[index].shortName.charAt(0)}</div>
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
                    );
                })}
            </div>

            {/* Criteria tabs */}
            {hasSelection && (
                <div className={styles.criteriaTabs} role="tablist" aria-label="Comparison criteria">
                    {comparisonCriteria.map(c => (
                        <button
                            key={c.id}
                            type="button"
                            role="tab"
                            aria-selected={selectedCriteria === c.id}
                            className={`${styles.criteriaTab} ${selectedCriteria === c.id ? styles.criteriaTabActive : ''}`}
                            onClick={() => setSelectedCriteria(c.id)}
                        >
                            <span className={styles.criteriaTabIcon}>{c.icon}</span>
                            <span className={styles.criteriaTabLabel}>{c.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Comparison table */}
            {hasSelection && currentCriteria && (
                <div className={styles.comparisonTable}>
                    {/* Sticky column headers */}
                    <div className={styles.tableHeader}>
                        <div className={styles.tableHeaderLabel}>
                            <span className={styles.deptBadge}>{selectedDepartment}</span>
                        </div>
                        <div className={styles.tableHeaderCols}>
                            {selectedUnis.map((uni, i) => (
                                <div key={i} className={styles.tableHeaderCol}>
                                    {uni ? (
                                        <>
                                            <div className={styles.colLogo}>{uni.shortName.charAt(0)}</div>
                                            <span className={styles.colName}>{uni.shortName}</span>
                                            <span className={styles.colCity}>{uni.city}</span>
                                        </>
                                    ) : (
                                        <span className={styles.colEmpty}>—</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Department metric rows */}
                    {currentCriteria.fields.map((field) => {
                        const bestId = getBestValue(field.key, field.type);
                        const showBar = field.type === 'percentage' || field.type === 'salary' || field.type === 'number';
                        const maxVal = showBar ? getMaxValue(field) : null;
                        return (
                            <div key={field.key} className={styles.row}>
                                <div className={styles.rowLabel}>
                                    <span className={styles.fieldLabel}>{field.label}</span>
                                </div>
                                <div className={styles.rowValues}>
                                    {selectedUnis.map((uni, index) => {
                                        const isBest = uni && bestId === uni.id;
                                        const displayVal = getComparisonValue(uni, field);
                                        const numVal = showBar ? getNumericValue(uni, field) : null;
                                        const barPct = numVal !== null && maxVal ? Math.round((numVal / maxVal) * 100) : null;
                                        return (
                                            <div key={index} className={`${styles.value} ${isBest ? styles.best : ''} ${!uni ? styles.valueEmpty : ''}`}>
                                                <span className={styles.valueText}>{displayVal}</span>
                                                {barPct !== null && uni && getDeptData(uni) && (
                                                    <div className={styles.valueBar}>
                                                        <div
                                                            className={`${styles.valueBarFill} ${isBest ? styles.valueBarBest : ''}`}
                                                            style={{ width: `${barPct}%` }}
                                                        />
                                                    </div>
                                                )}
                                                {isBest && <span className={styles.bestBadge}>Best</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* At a Glance — fee, acceptance rate, QS rank, entry test, HEC rank */}
                    <div className={styles.glanceSection}>
                        <div className={styles.glanceTitle}>At a Glance</div>

                        <div className={styles.row}>
                            <div className={styles.rowLabel}><span className={styles.fieldLabel}>Fee / Semester</span></div>
                            <div className={styles.rowValues}>
                                {selectedUnis.map((uni, i) => (
                                    <div key={i} className={`${styles.value} ${!uni ? styles.valueEmpty : ''}`}>
                                        <span className={`${styles.valueText} ${styles.valueTextSm}`}>
                                            {uni?.avgFee || '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.rowLabel}><span className={styles.fieldLabel}>Acceptance Rate</span></div>
                            <div className={styles.rowValues}>
                                {selectedUnis.map((uni, i) => (
                                    <div key={i} className={`${styles.value} ${!uni ? styles.valueEmpty : ''}`}>
                                        <span className={styles.valueText}>
                                            {uni ? (universityDetails[uni.id]?.acceptanceRate || '—') : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.rowLabel}><span className={styles.fieldLabel}>QS World Rank</span></div>
                            <div className={styles.rowValues}>
                                {selectedUnis.map((uni, i) => (
                                    <div key={i} className={`${styles.value} ${!uni ? styles.valueEmpty : ''}`}>
                                        <span className={styles.valueText}>
                                            {uni ? (universityDetails[uni.id]?.qsWorldRank || '—') : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.rowLabel}><span className={styles.fieldLabel}>Entry Test</span></div>
                            <div className={styles.rowValues}>
                                {selectedUnis.map((uni, i) => (
                                    <div key={i} className={`${styles.value} ${!uni ? styles.valueEmpty : ''}`}>
                                        <span className={styles.valueText}>
                                            {uni ? (uni.admissions?.testName || '—') : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={`${styles.row} ${styles.rowLast}`}>
                            <div className={styles.rowLabel}><span className={styles.fieldLabel}>HEC Pakistan Rank</span></div>
                            <div className={styles.rowValues}>
                                {selectedUnis.map((uni, i) => (
                                    <div key={i} className={`${styles.value} ${uni && bestHecId === uni.id ? styles.best : ''} ${!uni ? styles.valueEmpty : ''}`}>
                                        <span className={styles.valueText}>
                                            {uni ? `#${uni.ranking}` : '—'}
                                        </span>
                                        {uni && bestHecId === uni.id && <span className={styles.bestBadge}>Best</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Facilities */}
                    <div className={styles.facilitiesSection}>
                        <h4 className={styles.facilitiesTitle}>Key Facilities & Labs</h4>
                        <div className={styles.facilitiesGrid}>
                            {selectedUnis.map((uni, index) => (
                                <div key={index} className={styles.facilitiesCard}>
                                    {uni && getDeptData(uni) ? (
                                        <>
                                            <h5>{uni.shortName}</h5>
                                            <div className={styles.facilitiesList}>
                                                {getDeptData(uni).facilities?.map((f, idx) => (
                                                    <span key={idx} className={styles.facilityTag}>{f}</span>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <span className={styles.noSelection}>
                                            {uni ? 'No dept data' : 'Not selected'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recruiters */}
                    <div className={styles.recruitersSection}>
                        <h4 className={styles.recruitersTitle}>Top Recruiters & Partners</h4>
                        <div className={styles.recruitersGrid}>
                            {selectedUnis.map((uni, index) => (
                                <div key={index} className={styles.recruitersCard}>
                                    {uni && getDeptData(uni) ? (
                                        <>
                                            <h5>{uni.shortName}</h5>
                                            <div className={styles.recruitersList}>
                                                {getDeptData(uni).internshipPartners?.map((p, idx) => (
                                                    <span key={idx} className={styles.recruiterTag}>{p}</span>
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

            {/* Summary Winner */}
            {summaryWinner && !summaryWinner.isTie && (
                <div className={styles.summaryCard}>
                    <div className={styles.summaryTop}>
                        <span className={styles.summaryTrophy}></span>
                        <div className={styles.summaryTopText}>
                            <div className={styles.summaryTitle}>
                                Overall Winner: <span className={styles.summaryWinnerName}>{summaryWinner.uni.shortName}</span>
                            </div>
                            <div className={styles.summarySubtitle}>
                                Wins {summaryWinner.wins} of {summaryWinner.totalFields} comparison metrics for {selectedDepartment}
                            </div>
                        </div>
                    </div>
                    <div className={styles.summaryBreakdown}>
                        {summaryWinner.breakdown.map((item, i) => (
                            <div key={item.uni.id} className={styles.summaryRow}>
                                <span className={styles.summaryMedal}>
                                    {i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}
                                </span>
                                <span className={styles.summaryName}>{item.uni.shortName}</span>
                                <div className={styles.summaryBar}>
                                    <div
                                        className={`${styles.summaryBarFill} ${i === 0 ? styles.summaryBarGold : ''}`}
                                        style={{ width: `${Math.round((item.wins / summaryWinner.totalFields) * 100)}%` }}
                                    />
                                </div>
                                <span className={styles.summaryWinsCount}>{item.wins} wins</span>
                            </div>
                        ))}
                    </div>
                    <p className={styles.summaryNote}>
                        Based on {selectedDepartment} department data — placement, salary, research output, faculty quality &amp; industry connections.
                    </p>
                </div>
            )}

            {summaryWinner?.isTie && (
                <div className={styles.summaryTieCard}>

                    <p>It&apos;s a tie! Both universities perform equally across {selectedDepartment} metrics.</p>
                </div>
            )}

            {!hasSelection && (
                <div className={styles.emptyState}>

                    <p>Select universities above to compare {selectedDepartment} departments</p>
                    <span className={styles.emptyHint}>
                        {filteredUniversities.length} universities offer {selectedDepartment}
                    </span>
                </div>
            )}
        </section>
    );
}
