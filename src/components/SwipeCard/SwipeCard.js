'use client';

import { useState, useRef } from 'react';
import styles from './SwipeCard.module.css';
import { getMatchPercentage } from '@/utils/ranking';

export default function SwipeCard({ university, onSwipe, isTop }) {
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const cardRef = useRef(null);

    const matchPercent = getMatchPercentage(university.matchScore || 0);

    const handleDragStart = (e) => {
        if (!isTop) return;
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        setDragStart({ x: clientX, y: clientY });
        setIsDragging(true);
    };

    const handleDragMove = (e) => {
        if (!isDragging || !isTop) return;
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        const offsetX = clientX - dragStart.x;
        const offsetY = clientY - dragStart.y;

        setDragOffset({ x: offsetX, y: offsetY });

        // Determine swipe direction for visual feedback
        if (offsetX > 50) {
            setSwipeDirection('right');
        } else if (offsetX < -50) {
            setSwipeDirection('left');
        } else {
            setSwipeDirection(null);
        }
    };

    const handleDragEnd = () => {
        if (!isDragging || !isTop) return;

        const threshold = 100;

        if (dragOffset.x > threshold) {
            // Swipe right - Save
            onSwipe('right', university);
        } else if (dragOffset.x < -threshold) {
            // Swipe left - Skip
            onSwipe('left', university);
        }

        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
        setSwipeDirection(null);
    };

    const handleButtonSwipe = (direction) => {
        onSwipe(direction, university);
    };

    const cardStyle = isTop && isDragging ? {
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`,
        transition: 'none'
    } : {};

    return (
        <div
            ref={cardRef}
            className={`${styles.card} ${isTop ? styles.top : ''} ${swipeDirection ? styles[swipeDirection] : ''}`}
            style={cardStyle}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
        >
            {/* Swipe Overlays */}
            <div className={`${styles.overlay} ${styles.likeOverlay}`}>
                <span>💚 SAVE</span>
            </div>
            <div className={`${styles.overlay} ${styles.skipOverlay}`}>
                <span>❌ SKIP</span>
            </div>

            {/* Card Content */}
            <div className={styles.cardInner}>
                <div className={styles.header}>
                    <div className={styles.logoContainer}>
                        <span className={styles.logoPlaceholder}>{university.shortName.charAt(0)}</span>
                    </div>
                    <div className={styles.headerInfo}>
                        <h2 className={styles.name}>{university.shortName}</h2>
                        <p className={styles.fullName}>{university.name}</p>
                    </div>
                    <div className={styles.matchBadge}>
                        <span className={styles.matchPercent}>{matchPercent}%</span>
                        <span className={styles.matchLabel}>Match</span>
                    </div>
                </div>

                <div className={styles.tags}>
                    <span className={styles.tag}>
                        <span className={styles.tagIcon}>📍</span>
                        {university.city}
                    </span>
                    <span className={styles.tag}>
                        <span className={styles.tagIcon}>🏛️</span>
                        {university.type}
                    </span>
                    <span className={styles.tag}>
                        <span className={styles.tagIcon}>🏠</span>
                        {university.hostelAvailability.split(' ')[0]}
                    </span>
                </div>

                <div className={styles.programs}>
                    <h3 className={styles.sectionTitle}>Top Programs</h3>
                    <div className={styles.programList}>
                        {(university.programs[Object.keys(university.programs)[0]] || []).slice(0, 4).map((program, idx) => (
                            <span key={idx} className={styles.programTag}>{program}</span>
                        ))}
                    </div>
                </div>

                <div className={styles.highlights}>
                    <h3 className={styles.sectionTitle}>Highlights</h3>
                    <div className={styles.highlightList}>
                        {university.highlights.map((highlight, idx) => (
                            <span key={idx} className={styles.highlightTag}>✨ {highlight}</span>
                        ))}
                    </div>
                </div>

                {showDetails && (
                    <div className={styles.details}>
                        <p className={styles.description}>{university.description}</p>
                        <div className={styles.detailRow}>
                            <span>💰 Avg Fee:</span>
                            <span>{university.avgFee}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span>📅 Established:</span>
                            <span>{university.established}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span>🎯 Focus:</span>
                            <span>{university.campusType}</span>
                        </div>

                        {/* View Full Details Button */}
                        <button className={styles.fullDetailsBtn} disabled>
                            View Full Details →
                            <span className={styles.comingSoon}>Coming Soon</span>
                        </button>
                    </div>
                )}

                <button
                    className={styles.detailsBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDetails(!showDetails);
                    }}
                >
                    {showDetails ? 'Show Less' : 'View Details'}
                </button>

                {/* Swipe Buttons */}
                <div className={styles.actions}>
                    <button
                        className={`${styles.actionBtn} ${styles.skipBtn}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleButtonSwipe('left');
                        }}
                    >
                        <span>✕</span>
                    </button>
                    <button
                        className={`${styles.actionBtn} ${styles.saveBtn}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleButtonSwipe('right');
                        }}
                    >
                        <span>💚</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
