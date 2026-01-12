// Smart Ranking Algorithm for University Matching

/**
 * Calculate match score for a university based on user preferences
 * Higher score = better match
 */
export function calculateMatchScore(university, filters) {
    let score = 0;

    // 1. Field Category Match (30 points)
    if (university.fields.includes(filters.field)) {
        score += 30;
    }

    // 2. Exact Program Match (40 points)
    if (filters.program !== "Any") {
        const fieldPrograms = university.programs[filters.field] || [];
        if (fieldPrograms.includes(filters.program)) {
            score += 40;
        }
    } else {
        // If "Any" program, give partial points for having the field
        if (university.fields.includes(filters.field)) {
            score += 20;
        }
    }

    // 3. Campus/Hostel Match (15 points)
    if (filters.hostel !== "Any") {
        if (university.hostelAvailability === filters.hostel) {
            score += 15;
        }
    } else {
        score += 7; // Partial points for flexibility
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

    // 6. Degree Level Match (bonus points)
    if (filters.degreeLevel !== "Any") {
        if (university.degreeLevel.includes(filters.degreeLevel)) {
            score += 10;
        }
    }

    // 7. Base score from university ranking (inverse - higher ranked = higher score)
    score += Math.max(0, 20 - university.ranking);

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

    // Sort by score (highest first)
    scored.sort((a, b) => b.matchScore - a.matchScore);

    return scored;
}

/**
 * Get match percentage for display
 */
export function getMatchPercentage(score) {
    // Max possible score is approximately 120
    const maxScore = 120;
    const percentage = Math.min(100, Math.round((score / maxScore) * 100));
    return percentage;
}
