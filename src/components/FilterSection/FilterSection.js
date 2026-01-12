'use client';

import styles from './FilterSection.module.css';
import { filterOptions } from '@/data/universities';

export default function FilterSection({ filters, setFilters, onStartSwiping, isSwipeMode }) {
    const handleFieldChange = (e) => {
        const newField = e.target.value;
        setFilters(prev => ({
            ...prev,
            field: newField,
            program: "Any" // Reset program when field changes
        }));
    };

    const handleFilterChange = (key) => (e) => {
        setFilters(prev => ({
            ...prev,
            [key]: e.target.value
        }));
    };

    const currentPrograms = filterOptions.programs[filters.field] || filterOptions.programs["Pre-Engineering"];

    return (
        <section className={styles.filterSection}>
            <div className={styles.container}>
                {!isSwipeMode && (
                    <div className={styles.hero}>
                        <h1 className={styles.title}>
                            Find Your <span className={styles.highlight}>Perfect</span> University
                        </h1>
                        <p className={styles.subtitle}>
                            Discover universities across Pakistan with our smart matching system.
                            Swipe right on your favorites!
                        </p>
                    </div>
                )}

                <div className={`${styles.filtersWrapper} ${isSwipeMode ? styles.compact : ''}`}>
                    <div className={styles.filters}>
                        {/* Field/Category - Primary Filter */}
                        <div className={styles.filterGroup}>
                            <label className={styles.label}>
                                <span className={styles.labelIcon}>📚</span>
                                Field / Category
                            </label>
                            <select
                                className={styles.select}
                                value={filters.field}
                                onChange={handleFieldChange}
                            >
                                {filterOptions.fields.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Degree Level */}
                        <div className={styles.filterGroup}>
                            <label className={styles.label}>
                                <span className={styles.labelIcon}>🎓</span>
                                Degree Level
                            </label>
                            <select
                                className={styles.select}
                                value={filters.degreeLevel}
                                onChange={handleFilterChange('degreeLevel')}
                            >
                                {filterOptions.degreeLevel.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Exact Program */}
                        <div className={styles.filterGroup}>
                            <label className={styles.label}>
                                <span className={styles.labelIcon}>💻</span>
                                Exact Program
                            </label>
                            <select
                                className={styles.select}
                                value={filters.program}
                                onChange={handleFilterChange('program')}
                            >
                                {currentPrograms.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Campus/Hostel */}
                        <div className={styles.filterGroup}>
                            <label className={styles.label}>
                                <span className={styles.labelIcon}>🏠</span>
                                Campus / Hostel
                            </label>
                            <select
                                className={styles.select}
                                value={filters.hostel}
                                onChange={handleFilterChange('hostel')}
                            >
                                {filterOptions.hostelAvailability.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* City */}
                        <div className={styles.filterGroup}>
                            <label className={styles.label}>
                                <span className={styles.labelIcon}>📍</span>
                                City / Location
                            </label>
                            <select
                                className={styles.select}
                                value={filters.city}
                                onChange={handleFilterChange('city')}
                            >
                                {filterOptions.cities.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Campus Type */}
                        <div className={styles.filterGroup}>
                            <label className={styles.label}>
                                <span className={styles.labelIcon}>🎯</span>
                                Campus Focus
                            </label>
                            <select
                                className={styles.select}
                                value={filters.campusType}
                                onChange={handleFilterChange('campusType')}
                            >
                                {filterOptions.campusType.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {!isSwipeMode && (
                        <button className={styles.startBtn} onClick={onStartSwiping}>
                            <span className={styles.btnIcon}>👆</span>
                            Start Swiping
                            <span className={styles.btnArrow}>→</span>
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
