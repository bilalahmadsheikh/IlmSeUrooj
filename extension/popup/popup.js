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
      
      <div id="manual-token-section" style="display: none; margin-top: 15px; text-align: left;">
        <p style="font-size: 12px; color: #a1a1aa; margin-bottom: 5px;">If automatic sign-in fails, paste your token here:</p>
        <input type="text" id="manual-token-input" placeholder="eyJh..." style="width: 100%; box-sizing: border-box; padding: 8px; border-radius: 6px; border: 1px solid #3f3f46; background: #18181b; color: white; font-family: monospace; font-size: 11px;">
        <button id="btn-save-token" class="btn-primary" style="margin-top: 8px; width: 100%; padding: 6px;">Submit Token</button>
      </div>
      <button id="btn-show-manual" class="btn-secondary" style="margin-top: 15px; width: 100%; font-size: 12px; padding: 6px;">Having trouble signing in?</button>
    </div>
  `;
  signinBtn.classList.remove('hidden');
  signoutBtn.classList.add('hidden');

  document.getElementById('btn-show-manual').addEventListener('click', (e) => {
    e.target.style.display = 'none';
    document.getElementById('manual-token-section').style.display = 'block';
  });

  document.getElementById('btn-save-token').addEventListener('click', async () => {
    const token = document.getElementById('manual-token-input').value.trim();
    if (!token) return;

    // Send token to background to store and verify
    contentEl.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    await chrome.runtime.sendMessage({ type: 'AUTH_TOKEN', token });
    init(); // Refresh UI
  });
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
