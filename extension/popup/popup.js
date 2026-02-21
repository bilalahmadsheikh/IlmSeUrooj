/**
 * Ilm Se Urooj Popup Script
 * Shows application list and auth controls.
 */

const contentEl = document.getElementById('popup-content');
const signinBtn = document.getElementById('btn-signin');
const signoutBtn = document.getElementById('btn-signout');

// ─── Initialize ────────────────────────────────────────────────

async function init() {
  const auth = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });

  if (!auth.authenticated) {
    showSignedOut();
  } else {
    showApplications(auth.profile);
  }
}

// ─── States ────────────────────────────────────────────────────

function showSignedOut() {
  contentEl.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🎓</div>
      <h3>Welcome to Ilm Se Urooj</h3>
      <p>Sign in to manage your university applications.</p>
    </div>
  `;
  signinBtn.classList.remove('hidden');
  signoutBtn.classList.add('hidden');
}

async function showApplications(profile) {
  signinBtn.classList.add('hidden');
  signoutBtn.classList.remove('hidden');

  // Show profile header
  const displayName = profile?.full_name || 'Student';

  contentEl.innerHTML = `
    <div class="profile-bar">
      <div class="avatar">${displayName.charAt(0).toUpperCase()}</div>
      <span>${displayName}</span>
    </div>
    <div class="section-title">Your Applications</div>
    <div class="loading"><div class="spinner"></div></div>
  `;

  // Fetch applications
  const result = await chrome.runtime.sendMessage({ type: 'GET_APPLICATIONS' });
  const apps = result.applications || [];

  if (apps.length === 0) {
    contentEl.innerHTML = `
      <div class="profile-bar">
        <div class="avatar">${displayName.charAt(0).toUpperCase()}</div>
        <span>${displayName}</span>
      </div>
      <div class="section-title">Your Applications</div>
      <div class="empty-state small">
        <p>No applications yet. Visit a university portal to get started!</p>
      </div>
    `;
    return;
  }

  const appsHTML = apps.map(app => `
    <div class="app-row">
      <div class="app-info">
        <strong>${app.university_name}</strong>
        <span class="app-program">${app.program_applied || 'Not specified'}</span>
      </div>
      <div class="app-meta">
        <span class="status-badge status-${app.status}">${formatStatus(app.status)}</span>
        ${app.confirmation_number
      ? `<span class="confirm-num">#${app.confirmation_number}</span>`
      : ''}
      </div>
      <button class="btn-open" data-domain="${app.portal_domain}" title="Open Portal">
        →
      </button>
    </div>
  `).join('');

  contentEl.innerHTML = `
    <div class="profile-bar">
      <div class="avatar">${displayName.charAt(0).toUpperCase()}</div>
      <span>${displayName}</span>
    </div>
    <div class="section-title">Your Applications (${apps.length})</div>
    <div class="app-list">${appsHTML}</div>
  `;

  // Add click handlers for "Open Portal" buttons
  contentEl.querySelectorAll('.btn-open').forEach(btn => {
    btn.addEventListener('click', () => {
      const domain = btn.dataset.domain;
      chrome.tabs.create({ url: `https://${domain}` });
    });
  });
}

// ─── Helpers ───────────────────────────────────────────────────

function formatStatus(status) {
  const labels = {
    pending: 'Pending',
    account_created: 'Account Created',
    form_filling: 'Filling',
    awaiting_review: 'In Review',
    submitted: 'Submitted',
    error: 'Error',
    accepted: 'Accepted',
    rejected: 'Rejected',
    waitlisted: 'Waitlisted',
  };
  return labels[status] || status;
}

// ─── Event Listeners ───────────────────────────────────────────

signinBtn.addEventListener('click', () => {
  const extId = chrome.runtime.id;
  chrome.tabs.create({ url: `http://localhost:3000/extension-auth?ext=${extId}` });
  window.close();
});

signoutBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'LOGOUT' });
  showSignedOut();
});

// ─── Start ─────────────────────────────────────────────────────

init();
