'use client';

import styles from './AnimatedBackground.module.css';

export default function AnimatedBackground() {
    return (
        <div className={styles.background}>
            {/* Subtle gradient mesh overlay */}
            <div className={styles.gradientMesh} />

            {/* Subtle texture pattern - topography inspired */}
            <div className={styles.texturePattern} />

            {/* Ambient corner glow - minimal */}
            <div className={styles.ambientGlow} />
        </div>
    );
}
