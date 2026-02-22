'use client';

// SVG circle showing profile completion %
export function ProfileRing({ percent, size = 36, warning }) {
    const r = (size / 2) - 4;
    const circumference = 2 * Math.PI * r;
    const filled = circumference * (Math.min(percent || 0, 100) / 100);

    return (
        <svg width={size} height={size} style={{ cursor: 'pointer' }}
            title={`Profile ${percent}% complete`}>
            <circle cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke="#1f2a1c" strokeWidth="3" />
            <circle cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke="#4ade80" strokeWidth="3"
                strokeDasharray={`${filled} ${circumference}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }} />
            <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
                fontSize="9" fill="#4ade80" fontFamily="DM Mono, monospace">
                {percent || 0}%
            </text>
            {warning && (
                <circle cx={size - 4} cy={4} r="4" fill="#fbbf24" />
            )}
        </svg>
    );
}
