/**
 * University helpers - slug, portal domain, apply URL
 * Connects website data to extension and applications API
 */

/** shortName → extension slug (matches extension/universities/index.js) */
const SHORTNAME_TO_SLUG = {
  'NUST': 'nust',
  'LUMS': 'lums',
  'FAST Isb': 'fast', 'FAST Lhr': 'fast', 'FAST Khi': 'fast', 'FAST Psh': 'fast', 'FAST CFD': 'fast',
  'COMSATS Isb': 'comsats', 'COMSATS Lhr': 'comsats', 'COMSATS Wah': 'comsats',
  'COMSATS Abbottabad': 'comsats', 'COMSATS Sahiwal': 'comsats', 'COMSATS Attock': 'comsats', 'COMSATS Vehari': 'comsats',
  'IBA': 'iba',
  'UET Lahore': 'uet-lahore', 'UET Taxila': 'uet-taxila',
  'GIKI': 'giki',
  'PIEAS': 'pieas',
  'Bahria Isb': 'bahria', 'Bahria Lhr': 'bahria', 'Bahria Khi': 'bahria',
  'Habib': 'habib',
  'AKU': 'aku',
  'NED': 'ned',
  'Air': 'airuni',
  'SZABIST': 'szabist-khi',
  'ITU': 'itu',
};

export function getUniversitySlug(university) {
  if (!university) return null;
  return SHORTNAME_TO_SLUG[university.shortName] ?? university.slug ?? null;
}

/** Extract portal domain from applyUrl (e.g. ugadmissions.nust.edu.pk) */
export function getPortalDomain(university) {
  const url = university?.admissions?.applyUrl;
  if (!url) return null;
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function getApplyUrl(university) {
  return university?.admissions?.applyUrl ?? null;
}

/**
 * Find university from our data that matches an application's slug + portal_domain.
 * Used when hydrating saved items from Supabase applications API.
 */
export function findUniversityByApplication(app, universities) {
  if (!app?.university_slug || !universities?.length) return null;
  const slug = app.university_slug;
  const domain = app.portal_domain || '';
  return universities.find(
    (u) =>
      getUniversitySlug(u) === slug &&
      (domain ? getPortalDomain(u) === domain : true)
  ) ?? universities.find((u) => getUniversitySlug(u) === slug) ?? null;
}
