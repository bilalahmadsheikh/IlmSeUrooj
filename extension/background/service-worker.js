/**
 * Ilm Se Urooj — Service Worker v2.0
 * Handles auth token storage, message routing, and API communication.
 *
 * CONFIGURABLE: API base URL is read from chrome.storage.local.
 * Default: https://ilmseurooj.com/api
 * Override: set { unimatch_api_base: 'http://localhost:3000/api' } in storage.
 */

// Default to localhost for development. Set `unimatch_api_base` in
// chrome.storage.local to override (e.g. when deploying to production).
const FALLBACK_API_BASE = 'http://localhost:3000/api';

// University domain registry for CHECK_UNIVERSITY (mirrors content.js)
const DOMAIN_REGISTRY = {
  'admissions.nust.edu.pk': { slug: 'nust', name: 'NUST' },
  'ugadmissions.nust.edu.pk': { slug: 'nust', name: 'NUST' },
  'pgadmission.nust.edu.pk': { slug: 'nust', name: 'NUST' },
  'nu.edu.pk': { slug: 'fast', name: 'FAST-NUCES' },
  'admissions.nu.edu.pk': { slug: 'fast', name: 'FAST-NUCES' },
  'lums.edu.pk': { slug: 'lums', name: 'LUMS' },
  'admissions.lums.edu.pk': { slug: 'lums', name: 'LUMS' },
  'comsats.edu.pk': { slug: 'comsats', name: 'COMSATS' },
  'admissions.comsats.edu.pk': { slug: 'comsats', name: 'COMSATS' },
  'iba.edu.pk': { slug: 'iba', name: 'IBA' },
  'onlineadmission.iba.edu.pk': { slug: 'iba', name: 'IBA' },
  'giki.edu.pk': { slug: 'giki', name: 'GIKI' },
  'admission.giki.edu.pk': { slug: 'giki', name: 'GIKI' },
  'neduet.edu.pk': { slug: 'ned', name: 'NED' },
  'www.neduet.edu.pk': { slug: 'ned', name: 'NED' },
  'bahria.edu.pk': { slug: 'bahria', name: 'Bahria University' },
  'cms.bahria.edu.pk': { slug: 'bahria', name: 'Bahria University' },
  'uet.edu.pk': { slug: 'uet', name: 'UET Lahore' },
  'admission.uet.edu.pk': { slug: 'uet', name: 'UET Lahore' },
  'uettaxila.edu.pk': { slug: 'uet-taxila', name: 'UET Taxila' },
  'admissions.uettaxila.edu.pk': { slug: 'uet-taxila', name: 'UET Taxila' },
  'pieas.edu.pk': { slug: 'pieas', name: 'PIEAS' },
  'red.pieas.edu.pk': { slug: 'pieas', name: 'PIEAS' },
  'szabist.edu.pk': { slug: 'szabist', name: 'SZABIST' },
  'admissions.szabist.edu.pk': { slug: 'szabist', name: 'SZABIST' },
  'szabist-isb.edu.pk': { slug: 'szabist-isb', name: 'SZABIST Islamabad' },
  'admissions.szabist-isb.edu.pk': { slug: 'szabist-isb', name: 'SZABIST Islamabad' },
  'itu.edu.pk': { slug: 'itu', name: 'ITU' },
  'aku.edu': { slug: 'aku', name: 'Aga Khan University' },
  'akuross.aku.edu': { slug: 'aku', name: 'Aga Khan University' },
  'au.edu.pk': { slug: 'airuni', name: 'Air University' },
  'portals.au.edu.pk': { slug: 'airuni', name: 'Air University' },
  'webdata.au.edu.pk': { slug: 'airuni', name: 'Air University' },
  'habib.edu.pk': { slug: 'habib', name: 'Habib University' },
  'eapplication.habib.edu.pk': { slug: 'habib', name: 'Habib University' },
  'pucit.edu.pk': { slug: 'pucit', name: 'PUCIT' },
  'admission.pucit.edu.pk': { slug: 'pucit', name: 'PUCIT' },
  'uol.edu.pk': { slug: 'uol', name: 'University of Lahore' },
  'admission.uol.edu.pk': { slug: 'uol', name: 'University of Lahore' },
  'ucp.edu.pk': { slug: 'ucp', name: 'UCP' },
  'admissions.ucp.edu.pk': { slug: 'ucp', name: 'UCP' },
  'riphah.edu.pk': { slug: 'riphah', name: 'Riphah International' },
  'admissions.riphah.edu.pk': { slug: 'riphah', name: 'Riphah International' },
  'qau.edu.pk': { slug: 'qau', name: 'Quaid-i-Azam University' },
  'admission.qau.edu.pk': { slug: 'qau', name: 'Quaid-i-Azam University' },
  'iiu.edu.pk': { slug: 'iiu', name: 'IIUI' },
  'admission.iiu.edu.pk': { slug: 'iiu', name: 'IIUI' },
  'lse.edu.pk': { slug: 'lse', name: 'Lahore School of Economics' },
  'uos.edu.pk': { slug: 'uos', name: 'University of Sargodha' },
  'bzu.edu.pk': { slug: 'bzu', name: 'Bahauddin Zakariya University' },
  'uop.edu.pk': { slug: 'uop', name: 'University of Peshawar' },
  'uob.edu.pk': { slug: 'uob', name: 'University of Balochistan' },
  'muet.edu.pk': { slug: 'muet', name: 'MUET' },
  'ssuet.edu.pk': { slug: 'ssuet', name: 'SSUET' },
  'lumhs.edu.pk': { slug: 'lumhs', name: 'LUMHS' },
  'duhs.edu.pk': { slug: 'duhs', name: 'DUHS' },
  'kemu.edu.pk': { slug: 'kemu', name: 'KEMU' },
  'kust.edu.pk': { slug: 'kust', name: 'Kohat University' },
  'awkum.edu.pk': { slug: 'awkum', name: 'Abdul Wali Khan University' },
};

function lookupDomain(hostname) {
  if (!hostname) return null;
  const lower = hostname.toLowerCase();
  if (DOMAIN_REGISTRY[lower]) return DOMAIN_REGISTRY[lower];
  // Try parent domain match
  for (const [domain, info] of Object.entries(DOMAIN_REGISTRY)) {
    if (lower === domain || lower.endsWith('.' + domain)) return info;
  }
  return null;
}

// ─── API Base Configuration ─────────────────────────────────────

async function getApiBase() {
  const stored = await chrome.storage.local.get('unimatch_api_base');
  return stored.unimatch_api_base || FALLBACK_API_BASE;
}

async function getSiteBase() {
  const apiBase = await getApiBase();
  // Strip /api from the end
  return apiBase.replace(/\/api$/, '');
}

// ─── Token Management ──────────────────────────────────────────

/**
 * Parse the expiry time from a JWT token without verifying signature.
 * Returns expiry in milliseconds (epoch), or null on error.
 */
function parseJwtExpiry(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp) return payload.exp * 1000; // exp is in seconds
    return null;
  } catch {
    return null;
  }
}

async function storeToken(token) {
  const expiry = parseJwtExpiry(token) || (Date.now() + 60 * 60 * 1000); // default 1h
  await chrome.storage.local.set({
    unimatch_token: token,
    token_expiry: expiry,
  });
  console.log('[IlmSeUrooj] Auth token stored, expires:', new Date(expiry).toISOString());
}

async function getToken() {
  const result = await chrome.storage.local.get(['unimatch_token', 'token_expiry']);
  if (!result.unimatch_token) return null;

  // Check expiry — allow 5 min buffer before actual expiry
  const BUFFER_MS = 5 * 60 * 1000;
  if (result.token_expiry && Date.now() > result.token_expiry - BUFFER_MS) {
    console.log('[IlmSeUrooj] Token expired or near expiry, clearing');
    await chrome.storage.local.remove(['unimatch_token', 'token_expiry', 'unimatch_profile']);
    return null;
  }

  return result.unimatch_token;
}

async function clearToken() {
  await chrome.storage.local.remove([
    'unimatch_token', 'token_expiry', 'unimatch_profile',
    'unimatch_master_password',
  ]);
  console.log('[IlmSeUrooj] Auth data cleared');
}

// ─── API Helpers ───────────────────────────────────────────────

async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = await getToken();
  if (!token) return { error: 'Not authenticated', status: 401 };

  const apiBase = await getApiBase();
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint}`;
    const res = await fetch(url, options);

    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = { _raw: await res.text() };
    }

    return { ...data, status: res.status };
  } catch (err) {
    console.error('[IlmSeUrooj] API error:', err);
    return { error: err.message, status: 0 };
  }
}

async function fetchProfile() {
  const result = await apiRequest('/profile');
  if (result.profile) {
    await chrome.storage.local.set({ unimatch_profile: result.profile });
    console.log('[IlmSeUrooj] Profile cached');
  }
  return result;
}

// ─── Message Handler ───────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    console.error('[IlmSeUrooj] Message handler error:', err);
    sendResponse({ error: err.message });
  });
  return true; // Keep message channel open for async response
});

async function handleMessage(message, sender) {
  switch (message.type) {

    case 'AUTH_TOKEN': {
      await storeToken(message.token);
      // If the token came from a specific origin, store that as the API base
      if (message.siteUrl) {
        await chrome.storage.local.set({
          unimatch_api_base: message.siteUrl.replace(/\/$/, '') + '/api',
        });
      }
      const profileResult = await fetchProfile();
      return { success: true, profile: profileResult.profile };
    }

    case 'CHECK_AUTH': {
      const token = await getToken();
      if (!token) return { authenticated: false };
      const cached = await chrome.storage.local.get('unimatch_profile');
      // If no cached profile, try to fetch
      if (!cached.unimatch_profile) {
        const result = await fetchProfile();
        return { authenticated: true, profile: result.profile || null };
      }
      return { authenticated: true, profile: cached.unimatch_profile };
    }

    case 'GET_PROFILE':
      return await fetchProfile();

    case 'REFRESH_PROFILE': {
      // Force re-fetch even if cached
      const result = await fetchProfile();
      return result;
    }

    case 'LOGOUT':
      await clearToken();
      return { success: true };

    case 'GET_APPLICATIONS':
      return await apiRequest('/applications');

    case 'CREATE_APPLICATION':
      return await apiRequest('/applications', 'POST', message.data);

    case 'UPDATE_APPLICATION':
      return await apiRequest(`/applications/${message.id}`, 'PATCH', message.data);

    case 'GET_FIELD_MAP': {
      const apiBase = await getApiBase();
      const mapUrl = `${apiBase}/fieldmap?domain=${encodeURIComponent(message.domain)}`;
      try {
        const res = await fetch(mapUrl);
        return await res.json();
      } catch (err) {
        return { error: err.message };
      }
    }

    case 'POST_FIELD_MAP': {
      const apiBase = await getApiBase();
      try {
        const res = await fetch(`${apiBase}/fieldmap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.data),
        });
        return await res.json();
      } catch (err) {
        return { error: err.message };
      }
    }

    case 'GET_REMEMBERED_ANSWERS':
      return await apiRequest('/remembered-answers');

    case 'SAVE_REMEMBERED_ANSWER':
      return await apiRequest('/remembered-answers', 'POST', message.data);

    case 'SUBMITTED':
      return await apiRequest(`/applications/${message.applicationId}`, 'PATCH', {
        status: 'submitted',
        confirmation_number: message.confirmationNumber,
        submitted_at: new Date().toISOString(),
      });

    case 'CHECK_UNIVERSITY': {
      // Check if the provided hostname (or active tab) is a known university portal
      const hostname = message.hostname || null;
      if (hostname) {
        const uni = lookupDomain(hostname);
        return { university: uni || null };
      }
      // If no hostname provided, check active tab
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) return { university: null };
        const tabHostname = new URL(tab.url).hostname;
        const uni = lookupDomain(tabHostname);
        return { university: uni || null };
      } catch {
        return { university: null };
      }
    }

    case 'TRIGGER_AUTOFILL': {
      // Relay autofill trigger to the active tab's content script
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return { error: 'No active tab' };
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_AUTOFILL' });
        return response || { ok: true };
      } catch (err) {
        return { error: err.message };
      }
    }

    case 'GET_MASTER_PASSWORD': {
      const stored = await chrome.storage.local.get('unimatch_master_password');
      return { password: stored.unimatch_master_password || null };
    }

    case 'SET_MASTER_PASSWORD': {
      if (message.password) {
        await chrome.storage.local.set({ unimatch_master_password: message.password });
      }
      return { ok: true };
    }

    case 'SET_API_BASE': {
      // Developer override to point at localhost during dev
      if (message.url) {
        await chrome.storage.local.set({ unimatch_api_base: message.url });
        console.log('[IlmSeUrooj] API base set to:', message.url);
      }
      return { ok: true };
    }

    case 'GET_SITE_BASE': {
      const base = await getSiteBase();
      return { url: base };
    }

    default:
      return { error: `Unknown message type: ${message.type}` };
  }
}

// ─── External Messages (from IlmSeUrooj website) ───────────────

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_TOKEN' && message.token) {
    // Extract origin to auto-configure API base
    const siteUrl = sender.origin || sender.url?.split('/').slice(0, 3).join('/');
    storeToken(message.token)
      .then(async () => {
        if (siteUrl) {
          await chrome.storage.local.set({
            unimatch_api_base: siteUrl.replace(/\/$/, '') + '/api',
          });
        }
        return fetchProfile();
      })
      .then((result) => sendResponse({ success: true, profile: result.profile }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === 'LOGOUT') {
    clearToken()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

// ─── Installation ──────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[IlmSeUrooj] Extension installed/updated:', details.reason);
  // On first install, open the local app so the user can sign in
  if (details.reason === 'install') {
    getSiteBase().then(base => {
      chrome.tabs.create({ url: `${base}/profile` });
    });
  }
});
