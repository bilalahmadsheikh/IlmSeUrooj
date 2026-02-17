'use client';

import styles from './FilterSection.module.css';
import { filterOptions } from '@/data/universities';
import SearchableSelect from '@/components/SearchableSelect/SearchableSelect';
import { IconArrowRight } from '@/components/Icons/Icons';

export default function FilterSection({ filters, setFilters, onStartSwiping, isSwipeMode }) {
    const handleFieldChange = (value) => {
        setFilters(prev => ({
            ...prev,
            field: value,
            program: "Any" // Reset program when field changes
        }));
    };

    const handleFilterChange = (key) => (value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
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
                                <span className={styles.labelIcon}></span>
                                Field / Category
                            </label>
                            <SearchableSelect
                                value={filters.field}
                                onChange={handleFieldChange}
                                options={filterOptions.fields}
                                placeholder="Select field..."
                            />
                        </div>

                        {/* Degree Level */}
                        <div className={styles.filterGroup}>
                            <label className={styles.label}>
                                <span className={styles.labelIcon}></span>
                                Degree Level
                            </label>
                            <SearchableSelect
                                value={filters.degreeLevel}
                                onChange={handleFilterChange('degreeLevel')}
                                options={filterOptions.degreeLevel}
                                placeholder="Select degree..."
                            />
                        </div>

                        {/* Exact Program */}
                        <div className={styles.filterGroup}>
                            <label className={styles.label}>
                                <span className={styles.labelIcon}></span>
                                Exact Program
                            </label>
                            <SearchableSelect
                                value={filters.program}
                                onChange={handleFilterChange('program')}
                                options={currentPrograms}
                                placeholder="Select program..."
                            />
                        </div>

                        {/* Campus/Hostel */}
                        <div className={styles.filterGroup}>
                            <label className={styles.label}>
                                <span className={styles.labelIcon}></span>
                                Campus / Hostel
                            </label>
                            <SearchableSelect
                                value={filters.hostel}
                                onChange={handleFilterChange('hostel')}
                                options={filterOptions.hostelAvailability}
                                placeholder="Select hostel..."
                            />
                        </div>

                        {/* City */}
                        <div className={styles.filterGroup}>
                            <label className={styles.label}>
                                <span className={styles.labelIcon}></span>
                                City / Location
                            </label>
                            <SearchableSelect
                                value={filters.city}
                                onChange={handleFilterChange('city')}
                                options={filterOptions.cities}
                                placeholder="Select city..."
                            />
                        </div>

                        {/* Campus Type */}
                        <div className={styles.filterGroup}>
                            <label className={styles.label}>
                                <span className={styles.labelIcon}></span>
                                Campus Focus
                            </label>
                            <SearchableSelect
                                value={filters.campusType}
                                onChange={handleFilterChange('campusType')}
                                options={filterOptions.campusType}
                                placeholder="Select type..."
                            />
                        </div>
                    </div>

                    {!isSwipeMode && (
                        <button type="button" className={styles.startBtn} onClick={onStartSwiping} aria-label="Start swiping through university matches">
                            <span className={styles.btnIcon} aria-hidden />
                            Start Swiping
                            <IconArrowRight className={styles.btnArrow} aria-hidden />
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
