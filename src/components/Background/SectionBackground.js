'use client';

import { useTheme } from '@/context/ThemeContext';
import Image from 'next/image';
import styles from './SectionBackground.module.css';

// Image configurations for each section and theme
const sectionImages = {
    hero: {
        treasure: '/images/map_newspaper.png',
        dark: '/images/education.png',
        light: '/images/scenery.png'
    },
    universities: {
        treasure: '/images/map_writing1.png',
        dark: '/images/culture.png',
        light: '/images/education1.png'
    },
    deadlines: {
        treasure: '/images/map_newspaper2.png',
        dark: '/images/scenery1.png',
        light: '/images/culture1.png'
    },
    comparison: {
        treasure: '/images/map_pakistan.png',
        dark: '/images/pakistan.png',
        light: '/images/scenery1.png'
    }
};

export default function SectionBackground({ section, className = '' }) {
    const { theme } = useTheme();

    // Get the appropriate image for this section and theme
    const imageConfig = sectionImages[section];
    if (!imageConfig) return null;

    const imageSrc = imageConfig[theme] || imageConfig.dark;
    const isHero = section === 'hero';

    return (
        <div className={`${styles.backgroundWrapper} ${styles[theme]} ${className}`}>
            <Image
                src={imageSrc}
                alt=""
                fill
                sizes="100vw"
                className={styles.backgroundImage}
                priority={isHero}
                quality={60}
            />
            <div className={styles.overlay} />
        </div>
    );
}

