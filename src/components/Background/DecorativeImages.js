'use client';

import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import styles from './DecorativeImages.module.css';

// Regular decorative images for dark/light themes
const decorativeImages = [
    // Swipe Section - Education themed
    { src: '/images/education.png', alt: 'Education', position: 'swipe-left', section: 'swipe' },
    { src: '/images/education1.png', alt: 'Learning', position: 'swipe-right', section: 'swipe' },

    // Universities List - Culture themed
    { src: '/images/culture.png', alt: 'Culture', position: 'list-left', section: 'universities' },

    // Deadlines Section - Journey themed
    { src: '/images/culture1.png', alt: 'Heritage', position: 'deadlines-right', section: 'deadlines' },

    // Comparison Section - Scenery themed (diversity)
    { src: '/images/scenery.png', alt: 'Scenery', position: 'comparison-left', section: 'comparison' },
    { src: '/images/scenery1.png', alt: 'Pakistan', position: 'comparison-right', section: 'comparison' },
];

// Treasure theme map backgrounds - base images to repeat
const treasureMapImages = [
    '/images/map_newspaper.png',
    '/images/map_writing1.png',
    '/images/map_newspaper2.png',
];

// Generate repeated backgrounds to fill entire page (circular linked list pattern)
const generateRepeatedBackgrounds = () => {
    const repeated = [];
    const repeatCount = 10; // Repeat enough times to cover full page
    for (let i = 0; i < repeatCount; i++) {
        treasureMapImages.forEach((src, imgIndex) => {
            repeated.push({
                src,
                alt: `Map Background ${i * treasureMapImages.length + imgIndex + 1}`,
                key: `map-${i}-${imgIndex}`
            });
        });
    }
    return repeated;
};

export default function DecorativeImages() {
    const { theme } = useTheme();

    // Treasure theme - show repeating map backgrounds
    if (theme === 'treasure') {
        const repeatedBackgrounds = generateRepeatedBackgrounds();
        return (
            <div className={styles.treasureContainer} aria-hidden="true">
                {repeatedBackgrounds.map((bg) => (
                    <div
                        key={bg.key}
                        className={styles.mapBackgroundWrapper}
                    >
                        <Image
                            src={bg.src}
                            alt={bg.alt}
                            fill
                            loading="lazy"
                            sizes="100vw"
                            className={styles.mapBackgroundImage}
                        />
                    </div>
                ))}
            </div>
        );
    }

    // Dark/Light themes - show decorative side images
    return (
        <div className={styles.decorativeContainer} aria-hidden="true">
            {decorativeImages.map((img, index) => (
                <div
                    key={index}
                    className={`${styles.imageWrapper} ${styles[img.position]}`}
                >
                    <Image
                        src={img.src}
                        alt={img.alt}
                        width={200}
                        height={200}
                        loading="lazy"
                        className={styles.decorativeImage}
                    />
                </div>
            ))}
        </div>
    );
}
