// Shared storage, so several people edit one trip and each can see the others'
// changes.
//
// ── HOW TO TURN IT ON ────────────────────────────────────────────────────────
// 1. Go to https://console.firebase.google.com and create a project (free).
// 2. Build → Realtime Database → Create Database. Pick any region.
//    Choose "Start in test mode" for now; step 4 tightens it.
// 3. Copy the database URL it shows you — it looks like
//      https://your-project-default-rtdb.firebaseio.com
//    Paste it into DATABASE_URL below and change MODE to 'firebase'.
// 4. Rules tab → paste the ruleset from README.md → Publish.
// 5. Commit and push. Everyone on the site now shares one plan.
//
// The database URL is not a secret — it identifies the project and is meant to
// be public. All access control lives in the Firebase rules, so step 4 is the
// one that actually matters. Skip it and anyone who finds the URL can rewrite
// your trip.
//
// Until you do this, MODE stays 'local': the app works fine, but each browser
// keeps its own copy and the only way to share is the Export / Import buttons.
// ─────────────────────────────────────────────────────────────────────────────

const MODE = 'local'; // 'local' | 'firebase'

const DATABASE_URL = ''; // e.g. 'https://hawaii-trip-default-rtdb.firebaseio.com'

const TRIP_ID = 'hawaii-2026';

/** How often to check whether someone else has saved, in milliseconds. */
export const POLL_MS = 12000;

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
 * Firebase Realtime Database over plain REST — append .json to any path.
 * No SDK, no bundler, nothing to install.
 *
 * Polling reads only /rev.json (a single number, a few bytes) and pulls the
 * whole trip only when that number has moved. That keeps the free tier happy
 * even with a 12-second interval.
 */
function firebaseAdapter() {
  const base = DATABASE_URL.replace(/\/+$/, '') + '/trips/' + TRIP_ID;

  async function req(path, init) {
    const res = await fetch(base + path, init);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Firebase denied the request — check your database rules');
      }
      throw new Error('Firebase ' + res.status);
    }
    return res.json();
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
      console.warn('firebase init failed, falling back to local', e);
    }
  }
  return localAdapter();
}

/**
 * Poll for other people's saves.
 *
 * Calls onRemote(snapshot) only when the remote revision is higher than the
 * local one, so a quiet trip costs one tiny request per interval and nothing
 * else. Returns a stop function.
 */
export function startPolling(adapter, getLocalRev, onRemote, onStatus) {
  if (!adapter || adapter.mode === 'local') return () => {};

  let stopped = false;

  async function tick() {
    if (stopped || document.hidden) return; // don't poll a background tab
    try {
      const remoteRev = await adapter.revision();
      if (remoteRev != null && remoteRev > getLocalRev()) {
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
