/**
 * Alumni & network links for Pakistani universities
 * Verified from official university websites - Mar 2026
 * LinkedIn: institutional pages (company or school). Official: alumni portals/pages.
 */

export const alumniLinks = {
  // --- NUST ---
  'NUST': {
    linkedin: 'https://www.linkedin.com/company/national-university-of-sciences-and-technology',
    alumni: 'https://alumni.nust.edu.pk/',
    label: 'NUST Alumni'
  },

  // --- LUMS ---
  'LUMS': {
    linkedin: 'https://www.linkedin.com/school/lums/',
    alumni: 'https://alumni.lums.edu.pk/',
    label: 'LUMS Alumni'
  },

  // --- FAST-NUCES (all campuses share main LinkedIn; no dedicated alumni portal) ---
  'FAST Isb': { linkedin: 'https://www.linkedin.com/company/fastnuces', label: 'FAST Alumni' },
  'FAST Lhr': { linkedin: 'https://www.linkedin.com/company/fastnuces', label: 'FAST Alumni' },
  'FAST Khi': { linkedin: 'https://www.linkedin.com/company/fastnuces', label: 'FAST Alumni' },
  'FAST Psh': { linkedin: 'https://www.linkedin.com/company/fastnuces', label: 'FAST Alumni' },
  'FAST CFD': { linkedin: 'https://www.linkedin.com/company/fastnuces', label: 'FAST Alumni' },

  // --- COMSATS (all campuses share main pages) ---
  'COMSATS Isb': {
    linkedin: 'https://www.linkedin.com/company/comsats-university-islamabad',
    alumni: 'https://ww2.comsats.edu.pk/alumni/',
    label: 'COMSATS Alumni'
  },
  'COMSATS Lhr': {
    linkedin: 'https://www.linkedin.com/company/comsats-university-islamabad',
    alumni: 'https://ww2.comsats.edu.pk/alumni/',
    label: 'COMSATS Alumni'
  },
  'COMSATS Wah': {
    linkedin: 'https://www.linkedin.com/company/comsats-university-islamabad',
    alumni: 'https://ww2.comsats.edu.pk/alumni/',
    label: 'COMSATS Alumni'
  },
  'COMSATS Abbottabad': {
    linkedin: 'https://www.linkedin.com/company/comsats-university-islamabad',
    alumni: 'https://ww2.comsats.edu.pk/alumni/',
    label: 'COMSATS Alumni'
  },
  'COMSATS Sahiwal': {
    linkedin: 'https://www.linkedin.com/company/comsats-university-islamabad',
    alumni: 'https://ww2.comsats.edu.pk/alumni/',
    label: 'COMSATS Alumni'
  },
  'COMSATS Attock': {
    linkedin: 'https://www.linkedin.com/company/comsats-university-islamabad',
    alumni: 'https://ww2.comsats.edu.pk/alumni/',
    label: 'COMSATS Alumni'
  },
  'COMSATS Vehari': {
    linkedin: 'https://www.linkedin.com/company/comsats-university-islamabad',
    alumni: 'https://ww2.comsats.edu.pk/alumni/',
    label: 'COMSATS Alumni'
  },

  // --- IBA ---
  'IBA': {
    linkedin: 'https://www.linkedin.com/company/ibakhiofficial',
    alumni: 'https://alumni.iba.edu.pk/',
    label: 'IBA Alumni'
  },

  // --- UET Lahore ---
  'UET Lahore': {
    linkedin: 'https://www.linkedin.com/company/uet-lahore',
    alumni: 'https://csalumni.uet.edu.pk/',
    label: 'UET Lahore Alumni'
  },

  // --- UET Taxila ---
  'UET Taxila': {
    linkedin: 'https://www.linkedin.com/company/uet-taxila',
    alumni: 'https://web.uettaxila.edu.pk/alumni/',
    label: 'UET Taxila Alumni'
  },

  // --- GIKI ---
  'GIKI': {
    linkedin: 'https://www.linkedin.com/company/gik-institute',
    alumni: 'https://gikialumni.org/',
    label: 'GIKI Alumni'
  },

  // --- PIEAS (no dedicated alumni portal) ---
  'PIEAS': {
    linkedin: 'https://www.linkedin.com/company/pakistan-institute-of-engineering-applied-sciences',
    label: 'PIEAS Alumni'
  },

  // --- Bahria (all campuses) ---
  'Bahria Isb': {
    linkedin: 'https://www.linkedin.com/company/bahria-university',
    alumni: 'https://cms.bahria.edu.pk/Logins/Alumni',
    label: 'Bahria Alumni'
  },
  'Bahria Lhr': {
    linkedin: 'https://www.linkedin.com/company/bahria-university',
    alumni: 'https://cms.bahria.edu.pk/Logins/Alumni',
    label: 'Bahria Alumni'
  },
  'Bahria Khi': {
    linkedin: 'https://www.linkedin.com/company/bahria-university',
    alumni: 'https://cms.bahria.edu.pk/Logins/Alumni',
    label: 'Bahria Alumni'
  },

  // --- Habib ---
  'Habib': {
    linkedin: 'https://www.linkedin.com/company/habib-university',
    alumni: 'https://habib.edu.pk/alumni/',
    label: 'Habib Alumni'
  },

  // --- AKU ---
  'AKU': {
    linkedin: 'https://www.linkedin.com/company/aga-khan-university',
    alumni: 'https://aku.edu/alumni',
    label: 'AKU Alumni'
  },

  // --- NED ---
  'NED': {
    linkedin: 'https://www.linkedin.com/company/ned-university-of-engineering-and-technology',
    alumni: 'https://nedan.neduet.edu.pk/',
    label: 'NED Alumni'
  },

  // --- Air University (no dedicated alumni portal) ---
  'Air': {
    linkedin: 'https://www.linkedin.com/company/airuniversityofficial',
    label: 'Air University Alumni'
  },

  // --- SZABIST (no dedicated alumni portal) ---
  'SZABIST': {
    linkedin: 'https://www.linkedin.com/company/szabist_2',
    label: 'SZABIST Alumni'
  },

  // --- ITU ---
  'ITU': {
    linkedin: 'https://www.linkedin.com/company/information-technology-university',
    alumni: 'https://itu.edu.pk/alumni',
    label: 'ITU Alumni'
  },
};

export function getAlumniLinks(shortName) {
  return alumniLinks[shortName] || null;
}
