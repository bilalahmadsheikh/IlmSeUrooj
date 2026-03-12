/**
 * Ilm Se Urooj — Popup Script v2.0
 * Modern dashboard with portal detection, autofill trigger, timeline preview.
 */

const contentEl = document.getElementById('popup-content');

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

async function init() {
  try {
    const auth = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
    if (!auth.authenticated) {
      showSignedOut();
    } else {
      await showDashboard(auth.profile);
    }
  } catch (err) {
    contentEl.innerHTML = `
      <div class="error-state">
        <span>Failed to connect</span>
        <button class="retry-btn" id="retry-init">Retry</button>
      </div>`;
    document.getElementById('retry-init')?.addEventListener('click', init);
  }
}

function showSignedOut() {
  contentEl.innerHTML = `
    <div class="auth-card fade-in">
      <div class="auth-icon">🎓</div>
      <h3>Welcome to Ilm Se Urooj</h3>
      <p>Sign in to autofill university application forms with one click.</p>
      <button class="btn-signin" id="btn-signin">Sign In to Your Profile</button>
      <button class="btn-create" id="btn-create">Create Free Profile →</button>
    </div>`;

  document.getElementById('btn-signin').addEventListener('click', async () => {
    const base = await getSiteBase();
    chrome.tabs.create({ url: `${base}/extension-auth?ext=${chrome.runtime.id}` });
    window.close();
  });

  document.getElementById('btn-create').addEventListener('click', async () => {
    const base = await getSiteBase();
    chrome.tabs.create({ url: `${base}/profile` });
    window.close();
  });
}

async function showDashboard(profile) {
  const name = profile?.full_name || 'Student';
  const email = profile?.email || '';
  const completion = profile?.profile_completion || calculateCompleteness(profile);

  const ringSVG = buildProfileRing(40, completion);

  let portalHTML = '';
  let detectedUni = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const hostname = new URL(tab.url).hostname;
      const result = await chrome.runtime.sendMessage({ type: 'CHECK_UNIVERSITY', hostname });
      if (result?.university) {
        detectedUni = result.university;
        portalHTML = `
          <div class="portal-banner">
            <div class="portal-left">
              <span class="portal-icon">🏫</span>
              <div class="portal-label">On <strong>${result.university.name}</strong> portal</div>
            </div>
            <button class="btn-autofill" id="btn-trigger-autofill">⚡ Autofill</button>
          </div>`;
      }
    }
  } catch (_) {}

  let nudgeHTML = '';
  if (completion < 70) {
    const missing = getMissingFields(profile);
    nudgeHTML = `
      <div class="profile-nudge" id="nudge-profile">
        <span class="nudge-icon">⚠️</span>
        <span class="nudge-text">Profile ${completion}% — add ${missing} for better autofill</span>
        <span class="nudge-arrow">→</span>
      </div>`;
  }

  contentEl.innerHTML = `
    <div class="fade-in">
      ${portalHTML}
      <div class="profile-card">
        <div class="profile-ring-wrap">${ringSVG}</div>
        <div class="profile-info">
          <div class="profile-name">${escapeHTML(name)}</div>
          <div class="profile-email">${escapeHTML(email)}</div>
        </div>
      </div>
      ${nudgeHTML}
      <div class="section-title">My Applications</div>
      <div id="apps-list" class="apps-list"><div class="loading"><div class="spinner"></div></div></div>
      <div class="section-title">Upcoming Deadlines</div>
      <div id="timeline-preview" class="timeline-list"><div class="loading"><div class="spinner"></div></div></div>
    </div>
    <div class="popup-footer">
      <a href="#" class="footer-btn" id="link-timeline"><span class="footer-icon">📅</span>Timeline</a>
      <a href="#" class="footer-btn" id="link-dashboard"><span class="footer-icon">📊</span>Dashboard</a>
      <a href="#" class="footer-btn" id="link-profile"><span class="footer-icon">👤</span>Profile</a>
      <button class="footer-btn" id="btn-signout"><span class="footer-icon">🚪</span>Sign Out</button>
    </div>`;

  // Autofill trigger
  document.getElementById('btn-trigger-autofill')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_AUTOFILL' });
      window.close();
    }
  });

  // Profile nudge
  document.getElementById('nudge-profile')?.addEventListener('click', async () => {
    const base = await getSiteBase();
    chrome.tabs.create({ url: `${base}/profile` });
    window.close();
  });

  // Load apps
  loadApplications();
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

async function loadApplications() {
  const el = document.getElementById('apps-list');
  if (!el) return;

  try {
    const result = await chrome.runtime.sendMessage({ type: 'GET_APPLICATIONS' });
    const apps = result.applications || [];

    if (apps.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📋</span>
          <p>No applications yet — visit a university portal to start.</p>
        </div>`;
      return;
    }

    el.innerHTML = apps.slice(0, 5).map(app => `
      <div class="app-row">
        <div class="app-icon">${(app.university_name || '?')[0]}</div>
        <div class="app-info">
          <strong>${escapeHTML(app.university_name)}</strong>
          <span class="app-program">${escapeHTML(app.program_applied || 'No program')}</span>
        </div>
        <div class="app-meta">
          <span class="status-badge" style="color:${getStatusColor(app.status)};background:${getStatusBg(app.status)}">${formatStatus(app.status)}</span>
        </div>
        <button class="btn-open" data-domain="${app.portal_domain}" title="Open Portal">↗</button>
      </div>`).join('');

    if (apps.length > 5) {
      el.innerHTML += `<div style="text-align:center;padding:6px"><span style="font-size:10px;color:var(--text-muted)">+${apps.length - 5} more — view all on dashboard</span></div>`;
    }

    el.querySelectorAll('.btn-open').forEach(btn => {
      btn.addEventListener('click', () => {
        const domain = btn.dataset.domain;
        if (domain) chrome.tabs.create({ url: `https://${domain}` });
      });
    });
  } catch (err) {
    el.innerHTML = `
      <div class="error-state">
        <span>Could not load applications</span>
        <button class="retry-btn" onclick="loadApplications()">Retry</button>
      </div>`;
  }
}

async function loadTimelinePreview() {
  const el = document.getElementById('timeline-preview');
  if (!el) return;

  try {
    const result = await chrome.runtime.sendMessage({ type: 'GET_TIMELINE_STRATEGY' });
    const strategy = result.strategy || [];
    const conflicts = result.conflicts || [];

    if (strategy.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📅</span>
          <p>No upcoming deadlines found.</p>
        </div>`;
      return;
    }

    let html = '';

    if (conflicts.length > 0) {
      for (const c of conflicts.slice(0, 2)) {
        const dateStr = new Date(c.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
        html += `<div class="timeline-conflict">⚠️ ${c.universities.join(' & ')} — tests clash on ${dateStr}</div>`;
      }
    }

    for (const item of strategy.slice(0, 4)) {
      const tierColor = item.tier === 'safe' ? 'var(--accent)' : item.tier === 'match' ? 'var(--warning)' : 'var(--danger)';
      const daysLabel = item.daysRemaining == null ? 'Passed'
        : item.daysRemaining === 0 ? 'Today!'
        : item.daysRemaining <= 7 ? `${item.daysRemaining}d ⚡`
        : `${item.daysRemaining}d`;
      const daysClass = item.daysRemaining != null && item.daysRemaining <= 14 ? 'days-urgent'
        : item.daysRemaining != null && item.daysRemaining <= 60 ? 'days-soon' : 'days-far';

      html += `
        <div class="timeline-row">
          <div class="timeline-score" style="color:${tierColor}">${item.matchScore || '--'}%</div>
          <div class="timeline-info">
            <strong>${escapeHTML(item.shortName || item.university)}</strong>
            <span class="timeline-action">${escapeHTML(item.nextAction || '')}</span>
          </div>
          <span class="timeline-days ${daysClass}">${daysLabel}</span>
        </div>`;
    }

    el.innerHTML = html;
  } catch {
    el.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📅</span>
        <p>Timeline data unavailable.</p>
      </div>`;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function buildProfileRing(size, percent) {
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  const filled = circ * (Math.min(percent, 100) / 100);
  const color = percent >= 80 ? 'var(--accent)' : percent >= 50 ? 'var(--warning)' : 'var(--danger)';
  return `
    <svg width="${size}" height="${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--border)" stroke-width="3"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="3"
        stroke-dasharray="${filled} ${circ}" stroke-linecap="round"
        transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dasharray 0.6s ease"/>
      <text x="${size/2}" y="${size/2 + 4}" text-anchor="middle"
        font-size="10" fill="${color}" font-family="monospace" font-weight="700">${percent}%</text>
    </svg>`;
}

function calculateCompleteness(profile) {
  if (!profile) return 0;
  const fields = ['full_name','father_name','cnic','date_of_birth','gender','email','phone','address','city','province','fsc_marks','matric_marks','board_name','passing_year'];
  const filled = fields.filter(f => profile[f] != null && profile[f] !== '').length;
  return Math.round((filled / fields.length) * 100);
}

function getMissingFields(profile) {
  if (!profile) return 'your details';
  const critical = [];
  if (!profile.cnic) critical.push('CNIC');
  if (!profile.date_of_birth && !profile.dob) critical.push('DOB');
  if (!profile.fsc_marks && !profile.inter_marks) critical.push('marks');
  if (!profile.phone) critical.push('phone');
  if (critical.length === 0) return 'more details';
  return critical.slice(0, 2).join(', ');
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatStatus(status) {
  const labels = {
    pending: 'Pending', saved: 'Saved',
    account_created: 'Account', form_filling: 'Filling',
    awaiting_review: 'Review', submitted: 'Submitted',
    error: 'Error', accepted: 'Accepted',
    rejected: 'Rejected', waitlisted: 'Waitlist',
  };
  return labels[status] || status || 'Unknown';
}

function getStatusColor(status) {
  const c = {
    pending: '#9ca3af', saved: '#9ca3af',
    account_created: '#60a5fa', form_filling: '#fbbf24',
    awaiting_review: '#a855f7', submitted: '#4ade80',
    accepted: '#22c55e', rejected: '#ef4444', waitlisted: '#fb923c',
  };
  return c[status] || '#9ca3af';
}

function getStatusBg(status) {
  const b = {
    pending: 'rgba(156,163,175,0.12)', saved: 'rgba(156,163,175,0.12)',
    account_created: 'rgba(59,130,246,0.12)', form_filling: 'rgba(251,191,36,0.12)',
    awaiting_review: 'rgba(168,85,247,0.12)', submitted: 'rgba(74,222,128,0.12)',
    accepted: 'rgba(34,197,94,0.2)', rejected: 'rgba(239,68,68,0.15)',
    waitlisted: 'rgba(251,146,60,0.12)',
  };
  return b[status] || 'rgba(156,163,175,0.12)';
}

init();
