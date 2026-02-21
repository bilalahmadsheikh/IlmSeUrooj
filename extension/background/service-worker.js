/**
 * UniMatch Service Worker
 * Handles auth token storage, message routing, and API communication.
 */

const API_BASE = 'http://localhost:3000/api';

// ─── Token Management ─────────────────────────────────────────

/**
 * Store the auth token from the UniMatch website.
 */
async function storeToken(token) {
    await chrome.storage.local.set({
        unimatch_token: token,
        token_stored_at: Date.now(),
    });
    console.log('[UniMatch] Auth token stored');
}

/**
 * Get the stored auth token.
 * Returns null if no token or expired.
 */
async function getToken() {
    const result = await chrome.storage.local.get(['unimatch_token', 'token_stored_at']);
    if (!result.unimatch_token) return null;

    // JWT tokens from Supabase expire after 1 hour by default
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - result.token_stored_at > ONE_HOUR) {
        console.log('[UniMatch] Token expired, clearing');
        await chrome.storage.local.remove(['unimatch_token', 'token_stored_at']);
        return null;
    }

    return result.unimatch_token;
}

/**
 * Clear stored auth data (logout).
 */
async function clearToken() {
    await chrome.storage.local.remove(['unimatch_token', 'token_stored_at', 'unimatch_profile']);
    console.log('[UniMatch] Auth data cleared');
}

// ─── API Helpers ───────────────────────────────────────────────

/**
 * Make an authenticated API request to the UniMatch backend.
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = await getToken();
    if (!token) {
        return { error: 'Not authenticated', status: 401 };
    }

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
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
        const res = await fetch(url, options);
        const data = await res.json();
        return { ...data, status: res.status };
    } catch (err) {
        console.error('[UniMatch] API error:', err);
        return { error: err.message, status: 0 };
    }
}

/**
 * Fetch and cache the student profile.
 */
async function fetchProfile() {
    const result = await apiRequest('/profile');
    if (result.profile) {
        await chrome.storage.local.set({ unimatch_profile: result.profile });
    }
    return result;
}

// ─── Message Handler ───────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender).then(sendResponse);
    return true; // Keep the message channel open for async response
});

async function handleMessage(message, sender) {
    switch (message.type) {
        case 'AUTH_TOKEN':
            await storeToken(message.token);
            const profileResult = await fetchProfile();
            return { success: true, profile: profileResult.profile };

        case 'CHECK_AUTH':
            const token = await getToken();
            if (!token) return { authenticated: false };
            const cached = await chrome.storage.local.get('unimatch_profile');
            return { authenticated: true, profile: cached.unimatch_profile || null };

        case 'GET_PROFILE':
            return await fetchProfile();

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
            // Field maps are public — no auth needed for GET
            const mapUrl = `${API_BASE}/fieldmap?domain=${encodeURIComponent(message.domain)}`;
            try {
                const res = await fetch(mapUrl);
                return await res.json();
            } catch (err) {
                return { error: err.message };
            }
        }

        case 'POST_FIELD_MAP': {
            // AI mapping — no auth needed
            try {
                const res = await fetch(`${API_BASE}/fieldmap`, {
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

        default:
            return { error: `Unknown message type: ${message.type}` };
    }
}

// ─── External Messages (from UniMatch website) ─────────────────

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUTH_TOKEN' && message.token) {
        storeToken(message.token)
            .then(() => fetchProfile())
            .then((result) => sendResponse({ success: true, profile: result.profile }))
            .catch((err) => sendResponse({ error: err.message }));
        return true;
    }
});

// ─── Installation ──────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
    console.log('[UniMatch] Extension installed:', details.reason);
});
