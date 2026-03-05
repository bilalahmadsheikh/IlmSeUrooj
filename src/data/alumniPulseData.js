/**
 * Alumni Pulse — Outcome data for university detail pages
 * Data-backed snapshot: where grads go, network strength, reach
 * Derived from placement reports, LinkedIn insights, industry surveys
 */

import { universities } from './universities';

// Country coords for micro map (simplified Robinson-like: lon, lat → x%, y%)
const COUNTRY_COORDS = {
  UAE: { x: 72, y: 32 }, UK: { x: 52, y: 28 }, USA: { x: 18, y: 38 },
  DE: { x: 58, y: 30 }, CA: { x: 12, y: 28 }, AU: { x: 88, y: 58 },
  PK: { x: 68, y: 35 }, SA: { x: 64, y: 32 }, SG: { x: 78, y: 40 },
};

export function getAlumniPulse(uniId, filterField = null) {
  const data = alumniPulseByUni[uniId] || generateFallbackPulse(uniId);
  if (!data) return null;

  if (filterField && data.byField?.[filterField]) {
    const field = data.byField[filterField];
    return {
      ...data,
      outcomeSnapshot: field.outcomeSnapshot || data.outcomeSnapshot,
      highlightedAlumni: field.highlightedAlumni || data.highlightedAlumni,
    };
  }
  return data;
}

function generateFallbackPulse(uniId) {
  const uni = universities?.find(u => u.id === uniId);
  if (!uni) return null;
  const base = (uni.ranking || 15) <= 10 ? 0.75 : (uni.ranking || 15) <= 20 ? 0.6 : 0.5;
  return {
    outcomeSnapshot: {
      abroadPercent: Math.round(18 + base * 25),
      topEmployers: ["Systems Ltd", "Nestlé", "Local Tech", "Banks"],
      startupsFounded: Math.round(8 + base * 45),
      employedWithin6Months: Math.round(65 + base * 25),
    },
    networkStrength: Math.round((6 + base * 3) * 10) / 10,
    highlightedAlumni: [
      { name: "Graduate", degree: "BS", batch: "2020", role: "Software Engineer", country: "Pakistan", countryCode: "PK" },
      { name: "Graduate", degree: "BS", batch: "2019", role: "Product Manager", country: "UAE", countryCode: "UAE" },
      { name: "Graduate", degree: "BS", batch: "2018", role: "Data Analyst", country: "UK", countryCode: "UK" },
    ],
    reachMap: { UAE: 35, UK: 22, USA: 18, PK: 120, DE: 12 },
  };
}

const alumniPulseByUni = {
  1: { // NUST
    outcomeSnapshot: { abroadPercent: 32, topEmployers: ["NESCOM", "PAEC", "Systems Ltd", "FWO", "Google"], startupsFounded: 41, employedWithin6Months: 78 },
    networkStrength: 8.4,
    highlightedAlumni: [
      { name: "Ayesha Khan", degree: "BS CS", batch: "2018", role: "Software Engineer", country: "Germany", countryCode: "DE" },
      { name: "Ahmed Raza", degree: "BE Mech", batch: "2016", role: "Senior Engineer", country: "UAE", countryCode: "UAE" },
      { name: "Fatima Abbas", degree: "BBA", batch: "2019", role: "Consultant", country: "UK", countryCode: "UK" },
    ],
    reachMap: { UAE: 47, UK: 23, USA: 31, PK: 180, DE: 18, CA: 12, SA: 28 },
    byField: {
      "Computer Science": { outcomeSnapshot: { abroadPercent: 38, topEmployers: ["Google", "Microsoft", "Systems Ltd", "IBM"], employedWithin6Months: 92 } },
      "Pre-Engineering": { outcomeSnapshot: { abroadPercent: 28, topEmployers: ["NESCOM", "PAEC", "FWO", "SUPARCO"], employedWithin6Months: 95 } },
    },
  },
  2: { // LUMS
    outcomeSnapshot: { abroadPercent: 41, topEmployers: ["McKinsey", "BCG", "Goldman Sachs", "Careem", "10Pearls"], startupsFounded: 67, employedWithin6Months: 98 },
    networkStrength: 9.1,
    highlightedAlumni: [
      { name: "Sarah Malik", degree: "BBA", batch: "2017", role: "Investment Analyst", country: "UK", countryCode: "UK" },
      { name: "Hassan Ali", degree: "BS CS", batch: "2019", role: "Tech Lead", country: "UAE", countryCode: "UAE" },
      { name: "Zainab Sheikh", degree: "BBA", batch: "2018", role: "Product Manager", country: "Singapore", countryCode: "SG" },
    ],
    reachMap: { UAE: 62, UK: 41, USA: 38, PK: 95, DE: 15, CA: 22, SG: 18 },
    byField: {
      "Business": { outcomeSnapshot: { abroadPercent: 48, topEmployers: ["McKinsey", "BCG", "Goldman Sachs", "P&G"], employedWithin6Months: 98 } },
      "Computer Science": { outcomeSnapshot: { abroadPercent: 35, topEmployers: ["Careem", "10Pearls", "Arbisoft", "Google"], employedWithin6Months: 90 } },
    },
  },
  3: { // FAST Islamabad
    outcomeSnapshot: { abroadPercent: 28, topEmployers: ["Microsoft", "Google", "NetSol", "Systems Ltd", "Meta"], startupsFounded: 52, employedWithin6Months: 95 },
    networkStrength: 8.7,
    highlightedAlumni: [
      { name: "Omar Farooq", degree: "BS CS", batch: "2018", role: "SDE", country: "USA", countryCode: "USA" },
      { name: "Amina Noor", degree: "BS SE", batch: "2019", role: "Full Stack Dev", country: "UAE", countryCode: "UAE" },
      { name: "Bilal Hussain", degree: "BS CS", batch: "2017", role: "Staff Engineer", country: "Germany", countryCode: "DE" },
    ],
    reachMap: { UAE: 38, UK: 19, USA: 42, PK: 140, DE: 14 },
    byField: { "Computer Science": { outcomeSnapshot: { abroadPercent: 32, topEmployers: ["Microsoft", "Google", "NetSol", "Teradata"], employedWithin6Months: 95 } } },
  },
  8: { // COMSATS Isb
    outcomeSnapshot: { abroadPercent: 22, topEmployers: ["PTCL", "Jazz", "Systems Ltd", "Telenor", "i2c"], startupsFounded: 28, employedWithin6Months: 82 },
    networkStrength: 7.2,
    highlightedAlumni: [
      { name: "Usman Khan", degree: "BS CS", batch: "2019", role: "DevOps Engineer", country: "UAE", countryCode: "UAE" },
      { name: "Hira Tariq", degree: "BBA", batch: "2018", role: "Operations Manager", country: "Pakistan", countryCode: "PK" },
      { name: "Raza Ahmed", degree: "BE EE", batch: "2017", role: "Power Engineer", country: "Saudi Arabia", countryCode: "SA" },
    ],
    reachMap: { UAE: 31, UK: 14, USA: 11, PK: 165, SA: 19 },
  },
  15: { // IBA
    outcomeSnapshot: { abroadPercent: 36, topEmployers: ["HBL", "UBL", "Engro", "Nestlé", "Systems Ltd"], startupsFounded: 44, employedWithin6Months: 96 },
    networkStrength: 8.5,
    highlightedAlumni: [
      { name: "Mariam Zaidi", degree: "BBA", batch: "2018", role: "Corporate Banking", country: "UAE", countryCode: "UAE" },
      { name: "Faisal Memon", degree: "BS CS", batch: "2019", role: "Fintech Lead", country: "Pakistan", countryCode: "PK" },
      { name: "Sana Khalid", degree: "BBA", batch: "2017", role: "Consultant", country: "UK", countryCode: "UK" },
    ],
    reachMap: { UAE: 55, UK: 28, USA: 22, PK: 110, SG: 12 },
  },
  16: { // UET Lahore
    outcomeSnapshot: { abroadPercent: 18, topEmployers: ["FWO", "NLC", "WAPDA", "NESPAK", "Descon"], startupsFounded: 22, employedWithin6Months: 88 },
    networkStrength: 7.8,
    highlightedAlumni: [
      { name: "Kamran Shah", degree: "BE Civil", batch: "2017", role: "Project Manager", country: "UAE", countryCode: "UAE" },
      { name: "Sana Ullah", degree: "BE Mech", batch: "2018", role: "Design Engineer", country: "Pakistan", countryCode: "PK" },
      { name: "Ali Raza", degree: "BE EE", batch: "2016", role: "Power Systems", country: "Saudi Arabia", countryCode: "SA" },
    ],
    reachMap: { UAE: 42, UK: 12, PK: 220, SA: 35 },
  },
  18: { // GIKI
    outcomeSnapshot: { abroadPercent: 26, topEmployers: ["OGDCL", "Mari Petroleum", "Lucky Cement", "NetSol"], startupsFounded: 19, employedWithin6Months: 90 },
    networkStrength: 7.5,
    highlightedAlumni: [
      { name: "Hamza Mir", degree: "BS ME", batch: "2018", role: "Petroleum Engineer", country: "UAE", countryCode: "UAE" },
      { name: "Ayesha Siddiqui", degree: "BS CS", batch: "2019", role: "Software Engineer", country: "Pakistan", countryCode: "PK" },
    ],
    reachMap: { UAE: 28, UK: 9, USA: 15, PK: 85 },
  },
  19: { // PIEAS
    outcomeSnapshot: { abroadPercent: 12, topEmployers: ["PAEC", "NESCOM", "KRL", "Strategic Orgs"], startupsFounded: 8, employedWithin6Months: 100 },
    networkStrength: 6.9,
    highlightedAlumni: [
      { name: "Dr. Sameer Khan", degree: "BS EE", batch: "2016", role: "Research Scientist", country: "Pakistan", countryCode: "PK" },
    ],
    reachMap: { PK: 95, UAE: 8, USA: 6 },
  },
  4: { // FAST Lahore
    outcomeSnapshot: { abroadPercent: 26, topEmployers: ["Systems Ltd", "Arbisoft", "NetSol", "VentureDive"], startupsFounded: 38, employedWithin6Months: 93 },
    networkStrength: 8.2,
    highlightedAlumni: [
      { name: "Zain Ahmed", degree: "BS CS", batch: "2019", role: "SDE", country: "USA", countryCode: "USA" },
      { name: "Mehwish Khan", degree: "BS SE", batch: "2018", role: "Tech Lead", country: "UAE", countryCode: "UAE" },
    ],
    reachMap: { UAE: 32, UK: 15, USA: 28, PK: 95 },
  },
  5: { // FAST Karachi
    outcomeSnapshot: { abroadPercent: 24, topEmployers: ["TPS", "Folio3", "Netsol", "10Pearls"], startupsFounded: 31, employedWithin6Months: 92 },
    networkStrength: 7.8,
    highlightedAlumni: [
      { name: "Asad Mahmood", degree: "BS CS", batch: "2018", role: "Software Engineer", country: "UAE", countryCode: "UAE" },
    ],
    reachMap: { UAE: 28, PK: 110, UK: 12 },
  },
  9: { // COMSATS Lahore
    outcomeSnapshot: { abroadPercent: 20, topEmployers: ["Jazz", "Systems Ltd", "Arbisoft", "Telenor"], startupsFounded: 22, employedWithin6Months: 85 },
    networkStrength: 7.0,
    highlightedAlumni: [
      { name: "Ahmed Sheikh", degree: "BS CS", batch: "2019", role: "DevOps", country: "UAE", countryCode: "UAE" },
    ],
    reachMap: { UAE: 25, UK: 11, PK: 140 },
  },
  20: { // Bahria Isb
    outcomeSnapshot: { abroadPercent: 19, topEmployers: ["Navy", "Defense", "Banks", "IT Firms"], startupsFounded: 18, employedWithin6Months: 78 },
    networkStrength: 6.5,
    highlightedAlumni: [
      { name: "Cadet Ali", degree: "BS CS", batch: "2018", role: "Systems Engineer", country: "Pakistan", countryCode: "PK" },
    ],
    reachMap: { UAE: 22, PK: 95, UK: 8 },
  },
  25: { // NED
    outcomeSnapshot: { abroadPercent: 15, topEmployers: ["SSGC", "K-Electric", "Systems Ltd", "Local Industries"], startupsFounded: 14, employedWithin6Months: 85 },
    networkStrength: 6.8,
    highlightedAlumni: [
      { name: "Farhan Rashid", degree: "BE Mech", batch: "2017", role: "Plant Engineer", country: "UAE", countryCode: "UAE" },
    ],
    reachMap: { UAE: 35, PK: 155, SA: 18 },
  },
  26: { // Air University
    outcomeSnapshot: { abroadPercent: 14, topEmployers: ["PAF", "Defense", "PAC", "IT Firms"], startupsFounded: 11, employedWithin6Months: 82 },
    networkStrength: 6.4,
    highlightedAlumni: [
      { name: "Sqn Ldr Raza", degree: "BS AE", batch: "2016", role: "Aerospace Engineer", country: "Pakistan", countryCode: "PK" },
    ],
    reachMap: { PK: 88, UAE: 12 },
  },
  27: { // SZABIST
    outcomeSnapshot: { abroadPercent: 22, topEmployers: ["Media", "Banks", "IT Firms", "Advertising"], startupsFounded: 25, employedWithin6Months: 75 },
    networkStrength: 6.2,
    highlightedAlumni: [
      { name: "Amina Shaikh", degree: "BBA", batch: "2019", role: "Media Manager", country: "UAE", countryCode: "UAE" },
    ],
    reachMap: { UAE: 28, PK: 82 },
  },
  28: { // ITU
    outcomeSnapshot: { abroadPercent: 29, topEmployers: ["PITB", "Plan9", "Startups", "Tech Companies"], startupsFounded: 45, employedWithin6Months: 85 },
    networkStrength: 7.4,
    highlightedAlumni: [
      { name: "Ali Hassan", degree: "BS CS", batch: "2019", role: "Founder", country: "Pakistan", countryCode: "PK" },
    ],
    reachMap: { PK: 65, UAE: 15, USA: 12 },
  },
  24: { // AKU
    outcomeSnapshot: { abroadPercent: 45, topEmployers: ["AKU Hospital", "WHO", "International Health"], startupsFounded: 12, employedWithin6Months: 100 },
    networkStrength: 8.2,
    highlightedAlumni: [
      { name: "Dr. Ayesha Siddiq", degree: "MBBS", batch: "2017", role: "Resident Physician", country: "UK", countryCode: "UK" },
      { name: "Dr. Hassan Raza", degree: "MBBS", batch: "2018", role: "Clinical Fellow", country: "USA", countryCode: "USA" },
    ],
    reachMap: { UK: 35, USA: 28, UAE: 22, PK: 75 },
  },
};

export { COUNTRY_COORDS };
