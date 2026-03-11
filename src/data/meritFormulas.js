// Merit cutoff data and formulas for the strategy engine.
// Maps university shortName → { cutoffs, weights, fieldMapping }.
// Cutoffs represent approximate aggregate percentages from the most recent cycle.

export const meritData = {
  NUST: {
    cutoffs: { engineering: 72, cs: 78, business: 65, medical: 80 },
    weights: { test: 75, fsc: 15, matric: 10 },
    fieldMapping: {
      "Pre-Engineering": "engineering",
      "Computer Science": "cs",
      "Business": "business",
      "Medical": "medical",
      "Natural Sciences": "cs",
      "Others": "business",
    },
  },
  LUMS: {
    cutoffs: { business: 85, cs: 82, engineering: 80 },
    weights: { test: 40, fsc: 35, essay: 25 },
    fieldMapping: {
      "Business": "business",
      "Computer Science": "cs",
      "Pre-Engineering": "engineering",
      "Natural Sciences": "cs",
    },
  },
  "FAST Isb": {
    cutoffs: { cs: 75.3, se: 73, ai: 74, ds: 71.69, cyber: 71.45, engineering: 68, business: 62 },
    weights: { test: 50, fsc: 50 },
    fieldMapping: { "Computer Science": "cs", "Pre-Engineering": "engineering", "Business": "business" },
  },
  "FAST Lhr": {
    cutoffs: { cs: 76.8, se: 75.6, ds: 74.4, cyber: 75.6, engineering: 70 },
    weights: { test: 50, fsc: 50 },
    fieldMapping: { "Computer Science": "cs", "Pre-Engineering": "engineering" },
  },
  "FAST Khi": {
    cutoffs: { cs: 68.08, se: 66.52, ai: 67.43, ds: 66.14, engineering: 62 },
    weights: { test: 50, fsc: 50 },
    fieldMapping: { "Computer Science": "cs", "Pre-Engineering": "engineering" },
  },
  "FAST Psh": {
    cutoffs: { cs: 58.46, se: 59.73, ai: 64.57 },
    weights: { test: 50, fsc: 50 },
    fieldMapping: { "Computer Science": "cs" },
  },
  "FAST CFD": {
    cutoffs: { cs: 67.02, se: 66.68, ai: 66.35, engineering: 60, business: 55 },
    weights: { test: 50, fsc: 50 },
    fieldMapping: { "Computer Science": "cs", "Pre-Engineering": "engineering", "Business": "business" },
  },
  "COMSATS Isb": {
    cutoffs: { cs: 82.7, se: 81.6, ai: 80.2, cyber: 79.2, ds: 78.3, engineering: 72, business: 65 },
    weights: { test: 50, fsc: 40, matric: 10 },
    fieldMapping: { "Computer Science": "cs", "Pre-Engineering": "engineering", "Business": "business", "Natural Sciences": "cs", "Others": "business" },
  },
  "COMSATS Lhr": {
    cutoffs: { cs: 87.36, se: 85.6, ce: 83.09, pharmd: 83.52, ee: 76.74, engineering: 76, business: 68 },
    weights: { test: 50, fsc: 40, matric: 10 },
    fieldMapping: { "Computer Science": "cs", "Pre-Engineering": "engineering", "Business": "business", "Medical": "pharmd" },
  },
  "COMSATS Wah": {
    cutoffs: { cs: 80, se: 80, ai: 80, engineering: 72 },
    weights: { test: 50, fsc: 40, matric: 10 },
    fieldMapping: { "Computer Science": "cs", "Pre-Engineering": "engineering" },
  },
  "COMSATS Abbottabad": {
    cutoffs: { cs: 78, se: 75, pharmd: 77, engineering: 70 },
    weights: { test: 50, fsc: 40, matric: 10 },
    fieldMapping: { "Computer Science": "cs", "Pre-Engineering": "engineering", "Medical": "pharmd" },
  },
  "COMSATS Sahiwal": {
    cutoffs: { cs: 68, se: 66, engineering: 60, business: 55 },
    weights: { test: 50, fsc: 40, matric: 10 },
    fieldMapping: { "Computer Science": "cs", "Pre-Engineering": "engineering", "Business": "business", "Natural Sciences": "cs" },
  },
  "COMSATS Attock": {
    cutoffs: { cs: 62, se: 60, engineering: 56, business: 52 },
    weights: { test: 50, fsc: 40, matric: 10 },
    fieldMapping: { "Computer Science": "cs", "Pre-Engineering": "engineering", "Business": "business", "Natural Sciences": "cs" },
  },
  "COMSATS Vehari": {
    cutoffs: { cs: 58, se: 56, business: 50 },
    weights: { test: 50, fsc: 40, matric: 10 },
    fieldMapping: { "Computer Science": "cs", "Business": "business" },
  },
  IBA: {
    cutoffs: { business: 82, cs: 78 },
    weights: { test: 50, fsc: 30, matric: 20 },
    fieldMapping: { "Business": "business", "Computer Science": "cs", "Others": "business" },
  },
  "UET Lahore": {
    cutoffs: { engineering: 81.13, cs: 78.57 },
    weights: { test: 30, fsc: 50, matric: 20 },
    fieldMapping: { "Pre-Engineering": "engineering", "Computer Science": "cs", "Others": "engineering" },
  },
  "UET Taxila": {
    cutoffs: { engineering: 74, cs: 72 },
    weights: { test: 30, fsc: 50, matric: 20 },
    fieldMapping: { "Pre-Engineering": "engineering", "Computer Science": "cs" },
  },
  GIKI: {
    cutoffs: { engineering: 75, cs: 72, business: 65 },
    weights: { test: 60, fsc: 30, matric: 10 },
    fieldMapping: { "Pre-Engineering": "engineering", "Computer Science": "cs", "Business": "business" },
  },
  PIEAS: {
    cutoffs: { engineering: 80, cs: 78 },
    weights: { test: 60, fsc: 30, matric: 10 },
    fieldMapping: { "Pre-Engineering": "engineering", "Computer Science": "cs", "Natural Sciences": "cs" },
  },
  "Bahria Isb": {
    cutoffs: { cs: 80, se: 78, engineering: 72, business: 65 },
    weights: { test: 40, fsc: 40, matric: 20 },
    fieldMapping: { "Computer Science": "cs", "Pre-Engineering": "engineering", "Business": "business", "Others": "business" },
  },
  Habib: {
    cutoffs: { cs: 70, engineering: 68 },
    weights: { test: 50, fsc: 30, essay: 20 },
    fieldMapping: { "Computer Science": "cs", "Pre-Engineering": "engineering", "Others": "cs" },
  },
  AKU: {
    cutoffs: { medical: 88 },
    weights: { test: 50, fsc: 40, matric: 10 },
    fieldMapping: { "Medical": "medical" },
  },
  NED: {
    cutoffs: { engineering: 75, cs: 87, se: 87 },
    weights: { test: 30, fsc: 50, matric: 20 },
    fieldMapping: { "Pre-Engineering": "engineering", "Computer Science": "cs", "Others": "engineering" },
  },
  Air: {
    cutoffs: { engineering: 68, cs: 65, business: 60 },
    weights: { test: 50, fsc: 40, matric: 10 },
    fieldMapping: { "Pre-Engineering": "engineering", "Computer Science": "cs", "Business": "business", "Natural Sciences": "cs", "Others": "business" },
  },
  SZABIST: {
    cutoffs: { cs: 60, business: 55 },
    weights: { test: 50, fsc: 50 },
    fieldMapping: { "Computer Science": "cs", "Business": "business", "Others": "business" },
  },
  ITU: {
    cutoffs: { cs: 72, engineering: 68, business: 60 },
    weights: { test: 50, fsc: 40, matric: 10 },
    fieldMapping: { "Computer Science": "cs", "Pre-Engineering": "engineering", "Business": "business" },
  },
};

/**
 * Compute a match score (0–100) for a student vs a university.
 *
 * @param {string} shortName  — university shortName from universities.js
 * @param {number|null} percentage — student's effective FSc/IBCC percentage
 * @param {boolean} isProjected — whether the marks are projected
 * @param {string|null} studentField — student's preferred field (e.g. "Computer Science")
 * @param {number|null} testScore — entry test score (percentage, if available)
 * @returns {{ score: number, tier: "safe"|"match"|"reach"|"unknown" }}
 */
export function computeMatchScore(shortName, percentage, isProjected, studentField, testScore) {
  const data = meritData[shortName];
  if (!data || percentage == null) {
    return { score: 0, tier: "unknown" };
  }

  const fieldKey = data.fieldMapping?.[studentField];
  const allCutoffs = Object.values(data.cutoffs).filter(Boolean);
  const cutoff = fieldKey ? (data.cutoffs[fieldKey] ?? Math.min(...allCutoffs)) : Math.min(...allCutoffs);

  let effectivePct = Number(percentage);
  if (isProjected) {
    effectivePct *= 0.90; // 10% safety margin for projected marks
  }

  // Blend: if student has a test score, weight it in based on university formula
  let blendedScore = effectivePct;
  if (testScore != null && data.weights?.test) {
    const testWeight = data.weights.test / 100;
    const fscWeight = 1 - testWeight;
    blendedScore = testScore * testWeight + effectivePct * fscWeight;
  }

  const diff = blendedScore - cutoff;

  let score;
  if (diff >= 10) score = Math.min(100, 80 + diff);
  else if (diff >= 0) score = 60 + diff * 2;
  else if (diff >= -10) score = 40 + (diff + 10) * 2;
  else score = Math.max(5, 40 + (diff + 10) * 2);

  score = Math.round(Math.max(0, Math.min(100, score)));

  let tier;
  if (score >= 75) tier = "safe";
  else if (score >= 45) tier = "match";
  else tier = "reach";

  // Field mismatch penalty
  if (studentField && !data.fieldMapping?.[studentField]) {
    score = Math.round(score * 0.3);
    tier = "reach";
  }

  return { score, tier };
}
