/**
 * Ilm Se Urooj — Popup Script
 * Shows ProfileRing, current portal detection, application list, auth controls.
 */

const contentEl = document.getElementById('popup-content');

// ─── Site URL ───────────────────────────────────────────────────

let _siteBase = null;
async function getSiteBase() {
  if (_siteBase) return _siteBase;
  try {
    const result = await chrome.runtime.sendMessage({ type: 'GET_SITE_BASE' });
    _siteBase = result?.url || 'http://localhost:3000';
  } catch {
    _siteBase = 'http://localhost:3000';
  }
  return _siteBase;
}

// ─── Initialize ────────────────────────────────────────────────

async function init() {
  const auth = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });

  if (!auth.authenticated) {
    showSignedOut();
  } else {
    showDashboard(auth.profile);
  }
}

// ─── Signed Out State ──────────────────────────────────────────

function showSignedOut() {
  contentEl.innerHTML = `
        <div class="auth-card">
            <h3>🎓 Welcome to Ilm Se Urooj</h3>
            <p>Sign in to manage your university applications and autofill forms.</p>
            <button class="btn-signin" id="btn-signin">Sign In</button>
            <button class="btn-create" id="btn-create">Create Free Profile</button>
        </div>
    `;

  document.getElementById('btn-signin').addEventListener('click', async () => {
    const extId = chrome.runtime.id;
    const base = await getSiteBase();
    chrome.tabs.create({ url: `${base}/extension-auth?ext=${extId}` });
    window.close();
  });

  document.getElementById('btn-create').addEventListener('click', async () => {
    const base = await getSiteBase();
    chrome.tabs.create({ url: `${base}/profile` });
    window.close();
  });
}

// ─── Dashboard State ───────────────────────────────────────────

async function showDashboard(profile) {
  const displayName = profile?.full_name || 'Student';
  const email = profile?.email || '';
  const completion = profile?.profile_completion || 0;

  // ProfileRing SVG
  const ringSize = 36;
  const r = (ringSize / 2) - 4;
  const circ = 2 * Math.PI * r;
  const filled = circ * (Math.min(completion, 100) / 100);
  const ringSVG = `
        <svg width="${ringSize}" height="${ringSize}" style="flex-shrink:0">
            <circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${r}" fill="none" stroke="#1f2a1c" stroke-width="3"/>
            <circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${r}" fill="none" stroke="#4ade80" stroke-width="3"
                stroke-dasharray="${filled} ${circ}" stroke-linecap="round"
                transform="rotate(-90 ${ringSize / 2} ${ringSize / 2})" style="transition: stroke-dasharray 0.5s ease"/>
            <text x="${ringSize / 2}" y="${ringSize / 2 + 4}" text-anchor="middle"
                font-size="9" fill="#4ade80" font-family="monospace">${completion}%</text>
        </svg>`;

  // Check if we're on a university portal
  let portalBannerHTML = '';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const hostname = new URL(tab.url).hostname;
      const result = await chrome.runtime.sendMessage({ type: 'CHECK_UNIVERSITY', hostname });
      if (result?.university) {
        portalBannerHTML = `
                    <div class="portal-banner">
                        <div class="portal-name">📍 You're on: <strong>${result.university.name}</strong></div>
                        <button class="btn-autofill-popup" id="btn-trigger-autofill">Autofill →</button>
                    </div>
                `;
      }
    }
  } catch (e) { /* ignore tabs permission errors */ }

  contentEl.innerHTML = `
        ${portalBannerHTML}
        <div class="profile-row">
            ${ringSVG}
            <div class="profile-info-popup">
                <strong>${displayName}</strong>
                <span>${email}</span>
            </div>
        </div>
        <div class="section-title">MY APPLICATIONS</div>
        <div id="apps-list"><div class="spinner"></div></div>
        <div class="section-title" style="margin-top:10px">UPCOMING DEADLINES</div>
        <div id="timeline-preview"><div class="spinner"></div></div>
        <div class="popup-links">
            <a href="#" id="link-timeline">Timeline</a>
            <a href="#" id="link-dashboard">Dashboard</a>
            <a href="#" id="link-profile">Edit Profile</a>
            <button id="btn-signout">Sign Out</button>
        </div>
    `;

  // Portal autofill trigger
  document.getElementById('btn-trigger-autofill')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_AUTOFILL' });
      window.close();
    }
  });

  // Load applications
  const result = await chrome.runtime.sendMessage({ type: 'GET_APPLICATIONS' });
  const apps = result.applications || [];
  const appsList = document.getElementById('apps-list');

  if (apps.length === 0) {
    appsList.innerHTML = `
            <div class="empty-state">
                <p>No applications yet.<br>Visit a university portal to start.</p>
            </div>
        `;
  } else {
    appsList.innerHTML = apps.map(app => `
            <div class="app-row">
                <div class="app-info">
                    <strong>${app.university_name}</strong>
                    <span class="app-program">${app.program_applied || 'Not specified'}</span>
                </div>
                <span class="status-badge" style="color:${getStatusColor(app.status)};background:${getStatusBg(app.status)}">
                    ${formatStatus(app.status)}
                </span>
                <button class="btn-open" data-domain="${app.portal_domain}" title="Open Portal">↗</button>
            </div>
        `).join('');

    appsList.querySelectorAll('.btn-open').forEach(btn => {
      btn.addEventListener('click', () => {
        chrome.tabs.create({ url: `https://${btn.dataset.domain}` });
      });
    });
  }

  // Load upcoming deadlines
  loadTimelinePreview();

  // Footer links
  document.getElementById('link-dashboard').addEventListener('click', async (e) => {
    e.preventDefault();
    const base = await getSiteBase();
    chrome.tabs.create({ url: `${base}/applications` });
    window.close();
  });

  document.getElementById('link-timeline').addEventListener('click', async (e) => {
    e.preventDefault();
    const base = await getSiteBase();
    chrome.tabs.create({ url: `${base}/timeline` });
    window.close();
  });

  document.getElementById('link-profile').addEventListener('click', async (e) => {
    e.preventDefault();
    const base = await getSiteBase();
    chrome.tabs.create({ url: `${base}/profile` });
    window.close();
  });

  document.getElementById('btn-signout').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'LOGOUT' });
    showSignedOut();
  });
}

// ─── Timeline Preview ───────────────────────────────────────────

async function loadTimelinePreview() {
  const el = document.getElementById('timeline-preview');
  if (!el) return;

  try {
    const result = await chrome.runtime.sendMessage({ type: 'GET_TIMELINE_STRATEGY' });
    const strategy = result.strategy || [];
    const conflicts = result.conflicts || [];

    if (strategy.length === 0) {
      el.innerHTML = '<div class="empty-state"><p>No upcoming deadlines found.</p></div>';
      return;
    }

    // Show top 4 most urgent items
    const top = strategy.slice(0, 4);

    let html = '';

    // Show conflicts first
    if (conflicts.length > 0) {
      for (const c of conflicts.slice(0, 2)) {
        const dateStr = new Date(c.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
        html += `<div class="timeline-conflict">⚠️ ${c.universities.join(' & ')} — tests on ${dateStr}</div>`;
      }
    }

    for (const item of top) {
      const tierColor = item.tier === 'safe' ? '#4ade80' : item.tier === 'match' ? '#fbbf24' : '#ef4444';
      const daysLabel = item.daysRemaining == null ? 'Passed'
        : item.daysRemaining === 0 ? 'Today!'
        : item.daysRemaining <= 7 ? `${item.daysRemaining}d ⚡`
        : `${item.daysRemaining}d`;
      const daysClass = item.daysRemaining != null && item.daysRemaining <= 14 ? 'days-urgent'
        : item.daysRemaining != null && item.daysRemaining <= 60 ? 'days-soon' : 'days-far';

      html += `
        <div class="timeline-row">
          <div class="timeline-score" style="color:${tierColor}">${item.matchScore}%</div>
          <div class="timeline-info">
            <strong>${item.shortName}</strong>
            <span class="timeline-action">${item.nextAction}</span>
          </div>
          <span class="timeline-days ${daysClass}">${daysLabel}</span>
        </div>`;
    }

    el.innerHTML = html;
  } catch (err) {
    el.innerHTML = '<div class="empty-state"><p>Sign in for deadline tracking.</p></div>';
  }
}

// ─── Helpers ───────────────────────────────────────────────────

function formatStatus(status) {
  const labels = {
    pending: 'Pending', saved: 'Saved',
    account_created: 'Account Created', form_filling: 'Filling',
    awaiting_review: 'In Review', submitted: 'Submitted ✅',
    error: 'Error', accepted: 'Accepted ✅',
    rejected: 'Rejected', waitlisted: 'Waitlisted',
  };
  return labels[status] || status;
}

function getStatusColor(status) {
  const colors = {
    pending: '#9ca3af', saved: '#9ca3af',
    account_created: '#60a5fa', form_filling: '#fbbf24',
    awaiting_review: '#a78bfa', submitted: '#4ade80',
    accepted: '#4ade80', rejected: '#ef4444', waitlisted: '#fb923c',
  };
  return colors[status] || '#9ca3af';
}

function getStatusBg(status) {
  const bgs = {
    pending: 'rgba(156,163,175,0.15)', saved: 'rgba(156,163,175,0.15)',
    account_created: 'rgba(59,130,246,0.15)', form_filling: 'rgba(251,191,36,0.15)',
    awaiting_review: 'rgba(167,139,250,0.15)', submitted: 'rgba(74,222,128,0.15)',
    accepted: 'rgba(74,222,128,0.2)', rejected: 'rgba(239,68,68,0.15)',
    waitlisted: 'rgba(251,146,60,0.15)',
  };
  return bgs[status] || 'rgba(156,163,175,0.15)';
}

// ─── Start ─────────────────────────────────────────────────────

init();
