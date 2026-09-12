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
 * Realtime Database over plain REST — append .json to any path. No SDK, no
 * bundler, nothing to install.
 *
 * Polling reads only the revision number — a few bytes — and pulls the whole
 * trip only when that number differs from ours, so a quiet trip is nearly free.
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
    // A PUT with ?print=silent answers 204 with an empty body, and res.json()
    // throws on that. Anything empty means "no content", not a failure.
    const body = await res.text();
    return body ? JSON.parse(body) : null;
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
