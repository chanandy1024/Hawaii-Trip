// Shared storage, so several people edit one trip and each can see the others'
// changes.
//
// The endpoint below is not a secret — a static site has to name it somewhere,
// and the browser has to be able to reach it. That is exactly why access is
// governed at the database, not here. Setup and rule notes are kept out of the
// repo; see the operational notes.
//
// With MODE 'local' the app still works, but each browser keeps its own copy and
// the only way to share is Export / Import.

const MODE = 'firebase'; // 'local' | 'firebase'

const DATABASE_URL = 'https://trips-3e742-default-rtdb.firebaseio.com/';

const TRIP_ID = 'hawaii-2026';

/**
 * Web API key for anonymous sign-in. Like the database URL this is public by
 * design — it identifies the project, it is not a credential. Leave it empty
 * and the app talks to the database unauthenticated, which only works while the
 * rules allow it.
 */
const WEB_API_KEY = '';

/** How often to check whether someone else has saved, in milliseconds. */
export const POLL_MS = 12000;

/* ---------------- anonymous sign-in ---------------- */

// Every visitor gets an anonymous account, so the database can require
// "auth != null" instead of standing open to anyone holding the URL. It is not
// per-person identity — anyone who loads the page gets an account on request —
// but it stops a passer-by with the URL from reading or wiping the trip.
//
// The refresh token is kept so a returning visitor keeps the same anonymous
// identity rather than minting a new account on every load.

const TOKEN_KEY = 'hawaii26:anon';

let session = null;      // { idToken, refreshToken, expiresAt }
let pending = null;      // in-flight sign-in, so a burst of calls waits on one

function readStoredRefresh() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
}

function storeRefresh(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (e) { /* private mode; we just sign in again next time */ }
}

function keep(idToken, refreshToken, expiresIn) {
  // Renew a minute early rather than racing the expiry.
  session = {
    idToken,
    refreshToken,
    expiresAt: Date.now() + (Number(expiresIn || 3600) - 60) * 1000
  };
  storeRefresh(refreshToken);
  return idToken;
}

async function post(url, body, form) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' },
    body: form ? new URLSearchParams(body).toString() : JSON.stringify(body)
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const why = (data && data.error && data.error.message) || res.status;
    throw new Error('Anonymous sign-in refused: ' + why);
  }
  return data;
}

async function signIn() {
  const stored = readStoredRefresh();

  if (stored) {
    try {
      const r = await post('https://securetoken.googleapis.com/v1/token?key=' + WEB_API_KEY,
        { grant_type: 'refresh_token', refresh_token: stored }, true);
      return keep(r.id_token, r.refresh_token, r.expires_in);
    } catch (e) {
      // Revoked, or the project changed. Fall through and take a new account.
      storeRefresh('');
    }
  }

  const r = await post('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + WEB_API_KEY,
    { returnSecureToken: true });
  return keep(r.idToken, r.refreshToken, r.expiresIn);
}

/** A usable ID token, or '' when anonymous auth is not configured. */
async function authToken() {
  if (!WEB_API_KEY) return '';
  if (session && Date.now() < session.expiresAt) return session.idToken;
  if (!pending) pending = signIn().finally(() => { pending = null; });
  return pending;
}

/** Forget the current token so the next call signs in again. */
function dropToken() {
  session = null;
}

/* ------------------------------------------------------------------------- */

function localAdapter() {
  return {
    mode: 'local',
    async load() { return null; },
    async save() { },
    async revision() { return null; }
  };
}

/**
 * Realtime Database over plain REST — append .json to any path. No SDK, no
 * bundler, nothing to install.
 *
 * Polling reads only the revision number — a few bytes — and pulls the whole
 * trip only when that number differs from ours, so a quiet trip is nearly free.
 */
function firebaseAdapter() {
  const base = DATABASE_URL.replace(/\/+$/, '') + '/trips/' + TRIP_ID;

  async function once(path, init) {
    const token = await authToken();
    const url = base + path +
      (token ? (path.indexOf('?') > -1 ? '&' : '?') + 'auth=' + encodeURIComponent(token) : '');

    const res = await fetch(url, init);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        const err = new Error(WEB_API_KEY
          ? 'The database refused the request — check the rules, and that anonymous sign-in is on'
          : 'The database refused the request — check the rules');
        err.denied = true;
        throw err;
      }
      throw new Error('Database error ' + res.status);
    }
    // A PUT with ?print=silent answers 204 with an empty body, and res.json()
    // throws on that. Anything empty means "no content", not a failure.
    const body = await res.text();
    return body ? JSON.parse(body) : null;
  }

  async function req(path, init) {
    try {
      return await once(path, init);
    } catch (e) {
      // A token can expire mid-session, or be rejected after a rules change.
      // Take a fresh one and try once more before calling it a failure.
      if (!e.denied || !WEB_API_KEY) throw e;
      dropToken();
      return once(path, init);
    }
  }

  return {
    mode: 'firebase',

    /** Cheap check: just the revision number. */
    async revision() {
      return await req('/rev.json');
    },

    async load() {
      return await req('.json');
    },

    async save(snap) {
      await req('.json?print=silent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snap)
      });
    }
  };
}

export function makeAdapter() {
  if (MODE === 'firebase' && DATABASE_URL) {
    try {
      return firebaseAdapter();
    } catch (e) {
      console.warn('remote init failed, falling back to local', e);
    }
  }
  return localAdapter();
}

/**
 * Poll for other people's saves.
 *
 * Calls onRemote(snapshot) only when the shared revision differs from ours, so a
 * quiet trip costs one tiny request per interval and nothing else. Returns a
 * stop function.
 */
export function startPolling(adapter, getLocalRev, onRemote, onStatus) {
  if (!adapter || adapter.mode === 'local') return () => {};

  let stopped = false;

  async function tick() {
    if (stopped || document.hidden) return; // don't poll a background tab
    try {
      const remoteRev = await adapter.revision();
      // Not ">" — revisions are per-device counters, so a browser that has made
      // more edits than everyone else would never pull. Any number other than
      // our own means the shared copy came from somebody else; merging is
      // additive, so pulling one we have already seen costs nothing.
      if (remoteRev != null && remoteRev !== getLocalRev()) {
        const snap = await adapter.load();
        if (snap) onRemote(snap);
      }
      if (onStatus) onStatus({ state: 'ok', at: new Date().toISOString() });
    } catch (e) {
      if (onStatus) onStatus({ state: 'error', error: String(e.message || e) });
    }
  }

  const handle = setInterval(tick, POLL_MS);

  // Catch up immediately when the tab comes back to the foreground.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tick();
  });

  tick();

  return () => { stopped = true; clearInterval(handle); };
}

export const syncMode = MODE;
export const syncConfigured = !!(MODE === 'firebase' && DATABASE_URL);
