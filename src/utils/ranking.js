// Smart Ranking Algorithm for University Matching

/**
 * Calculate match score for a university based on user preferences
 * Higher score = better match
 */
export function calculateMatchScore(university, filters) {
    let score = 0;

    // 1. Field-specific ranking (40 points max)
    // Use field-specific ranking if available
    const fieldRanking = university.fieldRankings?.[filters.field];
    if (fieldRanking) {
        // Lower ranking number = higher score (rank 1 gets 40 points, rank 15 gets ~13 points)
        score += Math.max(10, 45 - (fieldRanking * 2.5));
    } else if (university.fields.includes(filters.field)) {
        // Field is available but no specific ranking
        score += 15;
    }

    // 2. Exact Program Match (30 points)
    if (filters.program !== "Any") {
        const fieldPrograms = university.programs[filters.field] || [];
        if (fieldPrograms.includes(filters.program)) {
            score += 30;
        }
    } else {
        // If "Any" program, give partial points for having the field
        if (university.fields.includes(filters.field)) {
            score += 15;
        }
    }

    // 3. Campus/Hostel Match (10 points)
    if (filters.hostel !== "Any") {
        if (university.hostelAvailability === filters.hostel) {
            score += 10;
        }
    } else {
        score += 5; // Partial points for flexibility
    }

    // 4. City Match (10 points)
    if (filters.city !== "Any") {
        if (university.city === filters.city) {
            score += 10;
        }
    } else {
        score += 5; // Partial points for flexibility
    }

    // 5. Campus Type Match (5 points)
    if (filters.campusType !== "Any") {
        if (university.campusType === filters.campusType) {
            score += 5;
        }
    } else {
        score += 2; // Partial points for flexibility
    }

    // 6. Degree Level Match (5 points)
    if (filters.degreeLevel !== "Any") {
        if (university.degreeLevel.includes(filters.degreeLevel)) {
            score += 5;
        }
    }

    return score;
}

/**
 * Filter and rank universities based on user preferences
 * Returns sorted array with best matches first
 */
export function rankUniversities(universities, filters) {
    // First, filter universities that match the field
    const filtered = universities.filter(uni => {
        // Must have the selected field
        if (!uni.fields.includes(filters.field)) {
            return false;
        }

        // If specific program selected, must offer it
        if (filters.program !== "Any") {
            const fieldPrograms = uni.programs[filters.field] || [];
            if (!fieldPrograms.includes(filters.program)) {
                return false;
            }
        }

        // If specific city selected, must be in that city
        if (filters.city !== "Any" && uni.city !== filters.city) {
            return false;
        }

        // If specific hostel preference, must match
        if (filters.hostel !== "Any" && uni.hostelAvailability !== filters.hostel) {
            return false;
        }

        // If specific campus type, must match
        if (filters.campusType !== "Any" && uni.campusType !== filters.campusType) {
            return false;
        }

        return true;
    });

    // Calculate scores for each university
    const scored = filtered.map(uni => ({
        ...uni,
        matchScore: calculateMatchScore(uni, filters)
    }));

    // Sort by score (highest first), then by field-specific ranking
    scored.sort((a, b) => {
        // First by score
        if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
        }
        // Then by field-specific ranking
        const aRank = a.fieldRankings?.[filters.field] || 999;
        const bRank = b.fieldRankings?.[filters.field] || 999;
        return aRank - bRank;
    });

    return scored;
}

/**
 * Get match percentage for display
 */
export function getMatchPercentage(score) {
    // Max possible score is approximately 100
    const maxScore = 100;
    const percentage = Math.min(100, Math.round((score / maxScore) * 100));
    return percentage;
}

/**
 * Get field-specific rank for a university
 */
export function getFieldRank(university, field) {
    return university.fieldRankings?.[field] || null;
}
