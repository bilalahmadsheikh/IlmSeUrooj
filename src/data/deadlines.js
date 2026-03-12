// Dynamic deadline builder — derives all timeline events from universities.js
// universities.js is the SINGLE SOURCE OF TRUTH, updated by CI/CD scrapers.
// ZERO estimated or fabricated dates. Only real scraped data.

import { universities } from './universities';

export const EVENT_COLORS = {
  registration_close: { bg: "rgba(59, 130, 246, 0.15)", border: "#3B82F6", text: "#3B82F6" },
  application: { bg: "rgba(59, 130, 246, 0.15)", border: "#3B82F6", text: "#3B82F6" },
  test_date: { bg: "rgba(245, 158, 11, 0.15)", border: "#F59E0B", text: "#F59E0B" },
  entry_test: { bg: "rgba(245, 158, 11, 0.15)", border: "#F59E0B", text: "#F59E0B" },
  result_date: { bg: "rgba(34, 197, 94, 0.15)", border: "#22C55E", text: "#22C55E" },
  merit_list: { bg: "rgba(168, 85, 247, 0.15)", border: "#A855F7", text: "#A855F7" },
  fee_deadline: { bg: "rgba(239, 68, 68, 0.15)", border: "#EF4444", text: "#EF4444" },
  fee_submission: { bg: "rgba(239, 68, 68, 0.15)", border: "#EF4444", text: "#EF4444" },
};

export const EVENT_LABELS = {
  registration_close: "Apply By",
  application: "Apply By",
  test_date: "Entry Test",
  entry_test: "Entry Test",
  result_date: "Result",
  merit_list: "Merit List",
  fee_deadline: "Fee Deadline",
  fee_submission: "Fee Deadline",
};

const SUPABASE_TYPE_MAP = {
  application: "registration_close",
  entry_test: "test_date",
  merit_list: "merit_list",
  fee_submission: "fee_deadline",
  document: "fee_deadline",
  interview: "test_date",
  other: "result_date",
};

// University systems — campuses that share the same test date
// These are NOT real conflicts when they overlap
const UNIVERSITY_SYSTEMS = {
  'FAST': ['fast-isb', 'fast-lhr', 'fast-khi', 'fast-psh', 'fast-cfd'],
  'COMSATS': ['comsats-isb', 'comsats-lhr', 'comsats-wah', 'comsats-abbottabad', 'comsats-sahiwal', 'comsats-attock', 'comsats-vehari'],
  'Bahria': ['bahria-isb', 'bahria-lhr', 'bahria-khi'],
  'UET': ['uet-lahore', 'uet-taxila'],
};

export function toSlug(shortName) {
  return shortName.toLowerCase().replace(/[()&]/g, '').replace(/\s+/g, '-');
}

function fieldsToPrograms(uni) {
  return (uni.fields || []).map(f => f.toLowerCase().replace(/\s+/g, '_'));
}

/**
 * Get the university system name for a slug, or null if standalone.
 */
export function getSystemName(slug) {
  for (const [system, slugs] of Object.entries(UNIVERSITY_SYSTEMS)) {
    if (slugs.includes(slug)) return system;
  }
  return null;
}

/**
 * Build timeline events from a single university's CI/CD-scraped data.
 * ONLY real data — no estimations.
 */
function buildEventsFromUniversity(uni) {
  const events = [];
  const adm = uni.admissions;
  if (!adm) return events;
  const programs = fieldsToPrograms(uni);

  if (adm.deadline) {
    events.push({
      type: "registration_close",
      date: adm.deadline,
      label: "Apply By",
      programs,
    });
  }

  if (adm.testDate) {
    events.push({
      type: "test_date",
      date: adm.testDate,
      label: adm.testName || "Entry Test",
      programs,
    });
  }

  return events;
}

export function buildDeadlinesFromUniversities() {
  const deadlines = {};
  for (const uni of universities) {
    if (!uni.admissions?.deadline && !uni.admissions?.testDate) continue;
    const slug = toSlug(uni.shortName);
    const events = buildEventsFromUniversity(uni);
    if (events.length === 0) continue;
    deadlines[slug] = {
      name: uni.name,
      shortName: uni.shortName,
      slug,
      universityId: uni.id,
      events,
    };
  }
  return deadlines;
}

export function mergeSupabaseDeadlines(derived, supabaseRows) {
  if (!supabaseRows || supabaseRows.length === 0) return derived;
  const merged = JSON.parse(JSON.stringify(derived));

  const byUni = {};
  for (const row of supabaseRows) {
    if (!row.is_active) continue;
    if (!byUni[row.university_id]) byUni[row.university_id] = [];
    byUni[row.university_id].push(row);
  }

  for (const [uniId, rows] of Object.entries(byUni)) {
    let slug = Object.keys(merged).find(s => {
      const entry = merged[s];
      return entry.slug === uniId || toSlug(entry.shortName) === uniId || String(entry.universityId) === uniId;
    });
    if (!slug) {
      slug = uniId;
      merged[slug] = { name: rows[0].university_name, shortName: rows[0].university_name, slug: uniId, universityId: uniId, events: [] };
    }
    const entry = merged[slug];
    for (const row of rows) {
      const eventType = SUPABASE_TYPE_MAP[row.deadline_type] || row.deadline_type;
      const dateStr = typeof row.deadline_date === 'string' ? row.deadline_date.slice(0, 10) : new Date(row.deadline_date).toISOString().slice(0, 10);
      entry.events.push({
        type: eventType,
        date: dateStr,
        label: row.notes || EVENT_LABELS[eventType] || row.deadline_type,
        programs: row.program ? [row.program.toLowerCase()] : ["all"],
        fromSupabase: true,
      });
    }
    entry.events.sort((a, b) => a.date.localeCompare(b.date));
  }
  return merged;
}

/**
 * Detect REAL conflicts — excludes campuses of the same university system
 * (e.g. all FAST campuses sharing the same test date is expected, not a conflict)
 */
export function detectRealConflicts(entries) {
  const testDateMap = {};
  for (const entry of entries) {
    for (const event of entry.events) {
      if (event.type === 'test_date' || event.type === 'entry_test') {
        if (!testDateMap[event.date]) testDateMap[event.date] = [];
        testDateMap[event.date].push({ shortName: entry.shortName, slug: entry.slug });
      }
    }
  }

  const conflicts = [];
  for (const [date, unis] of Object.entries(testDateMap)) {
    if (unis.length <= 1) continue;

    // Group by university system
    const systems = {};
    const standalone = [];
    for (const u of unis) {
      const sys = getSystemName(u.slug);
      if (sys) {
        if (!systems[sys]) systems[sys] = [];
        systems[sys].push(u.shortName);
      } else {
        standalone.push(u.shortName);
      }
    }

    // Real conflict = different systems or standalone unis on same date
    const groups = [...Object.keys(systems), ...standalone];
    if (groups.length > 1) {
      conflicts.push({
        date,
        universities: groups,
        type: 'test_date',
      });
    }
  }

  return conflicts.sort((a, b) => a.date.localeCompare(b.date));
}

export const universityDeadlines = buildDeadlinesFromUniversities();
