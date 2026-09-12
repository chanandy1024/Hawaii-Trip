// Single source of truth. Everything the user changes lives here, gets written
// to localStorage, pushed to the remote (if one is configured), and recorded in
// the change log so other people can see it happened.

import { DEFAULT_DAYS } from '../data/days.js';
import { uid } from './util.js';
import { makeEvent, append, mergeLogs, unseen } from './changelog.js';

const KEY = 'hawaii26:v5';

function blank() {
  return {
    tab: 'overview',
    unit: 'f',
    votes: {},          // id -> 'up' | 'down' | null
    confirmed: {},      // id -> { kind, when, ref, cost, note, by, at }
    addActs: [],        // user-added activities
    addFood: [],        // user-added restaurants
    hidden: {},         // id -> 1 for removed built-ins
    imgs: {},           // thumbnail key -> image URL
    days: null,         // itinerary, seeded from DEFAULT_DAYS
    log: [],            // change feed, see changelog.js
    seenBy: {},         // user -> ISO of the last time they read the feed
    editor: '',         // who is editing right now (not synced)
    rev: 0              // bumped on every write; drives conflict resolution
  };
}

export const state = blank();

/* ---------------- change notifications ---------------- */

const listeners = [];

export function onChange(fn) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i > -1) listeners.splice(i, 1);
  };
}

function emit() {
  listeners.forEach((fn) => {
    try { fn(state); } catch (e) { console.error('listener failed', e); }
  });
}

/* ---------------- logging ---------------- */

/** Record a change. Called by every mutator below. */
function note(kind, what, detail) {
  append(state.log, makeEvent(state.editor, kind, what, detail));
}

/** Events from other people this user has not read yet. */
export function unseenEvents() {
  return unseen(state.log, state.editor, state.seenBy[state.editor]);
}

export function markSeen() {
  state.seenBy[state.editor] = new Date().toISOString();
  save({ silent: true });
}

/* ---------------- persistence ---------------- */

let remote = null;
export const status = { mode: 'local', state: 'idle', lastSync: null, error: '' };

export function useRemote(adapter) {
  remote = adapter;
  status.mode = adapter.mode;
}

/**
 * Persist. Pass { silent: true } to skip bumping the revision — used for
 * bookkeeping like "I read the feed", which should not look like a trip edit.
 */
export function save(opts) {
  const silent = opts && opts.silent;
  if (!silent) state.rev = (state.rev || 0) + 1;

  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('local save failed', e);
  }

  if (remote && remote.save) {
    status.state = 'saving';
    emit();
    Promise.resolve(remote.save(snapshot()))
      .then(() => {
        status.state = 'ok';
        status.lastSync = new Date().toISOString();
        status.error = '';
      })
      .catch((e) => {
        status.state = 'error';
        status.error = String(e.message || e);
        console.warn('remote save failed', e);
      })
      .finally(emit);
  } else {
    emit();
  }
}

export function snapshot() {
  const out = JSON.parse(JSON.stringify(state));
  delete out.editor; // whose browser this is, not part of the shared trip
  delete out.tab;    // local view preferences
  delete out.unit;
  return out;
}

export function hydrate(obj) {
  if (!obj || typeof obj !== 'object') return;
  const fresh = blank();
  Object.keys(fresh).forEach((k) => {
    state[k] = obj[k] !== undefined && obj[k] !== null ? obj[k] : fresh[k];
  });
  if (!Array.isArray(state.days) || !state.days.length) {
    state.days = JSON.parse(JSON.stringify(DEFAULT_DAYS));
  }
  if (!Array.isArray(state.log)) state.log = [];
}

/**
 * Fold a remote or imported copy into the current one.
 * Additive for everything except the itinerary, which is a single document and
 * so goes to whichever side has the higher revision.
 * Returns the events that were new to us.
 */
export function mergeIn(incoming) {
  if (!incoming || typeof incoming !== 'object') return [];

  const known = new Set((state.log || []).map((e) => e.id));
  const fresh = (incoming.log || []).filter((e) => e && e.id && !known.has(e.id));

  state.votes = Object.assign({}, state.votes, incoming.votes || {});
  state.confirmed = Object.assign({}, state.confirmed, incoming.confirmed || {});
  state.imgs = Object.assign({}, state.imgs, incoming.imgs || {});
  state.hidden = Object.assign({}, state.hidden, incoming.hidden || {});
  state.seenBy = Object.assign({}, state.seenBy, incoming.seenBy || {});

  const haveA = new Set(state.addActs.map((a) => a.id));
  (incoming.addActs || []).forEach((a) => { if (a && !haveA.has(a.id)) state.addActs.push(a); });

  const haveF = new Set(state.addFood.map((f) => f.id));
  (incoming.addFood || []).forEach((f) => { if (f && !haveF.has(f.id)) state.addFood.push(f); });

  if (incoming.days && (incoming.rev || 0) >= (state.rev || 0)) state.days = incoming.days;

  state.log = mergeLogs(state.log, incoming.log);
  state.rev = Math.max(state.rev || 0, incoming.rev || 0);

  return fresh;
}

export async function boot() {
  let local = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) local = JSON.parse(raw);
  } catch (e) {
    console.warn('local read failed', e);
  }

  hydrate(local || blank());

  if (remote && remote.load) {
    try {
      const far = await remote.load();
      if (far) {
        mergeIn(far);
        status.state = 'ok';
        status.lastSync = new Date().toISOString();
      }
    } catch (e) {
      status.state = 'error';
      status.error = String(e.message || e);
      console.warn('remote read failed', e);
    }
  }

  emit();
}

/* ---------------- confirmations ---------------- */

export function toggleConfirm(id, kind, seed, label) {
  if (state.confirmed[id]) {
    delete state.confirmed[id];
    note('unconfirm', label || id);
    save();
    return false;
  }
  state.confirmed[id] = {
    kind,
    when: (seed && seed.when) || '',
    ref: '',
    cost: seed && seed.cost != null ? String(seed.cost) : '',
    note: '',
    by: state.editor || '',
    at: new Date().toISOString().slice(0, 10)
  };
  note('confirm', label || id);
  save();
  return true;
}

export function isConfirmed(id) {
  return !!state.confirmed[id];
}

export function confirmedCount() {
  return Object.keys(state.confirmed).length;
}

export function patchConfirm(id, field, value, label) {
  if (!state.confirmed[id]) return;
  state.confirmed[id][field] = value;
  if (field === 'cost') note('cost', label || id, value);
  else if (field === 'ref') note('ref', label || id, value);
  else note('confirm', label || id, field + ': ' + value);
  save();
}

/* ---------------- votes and photos ---------------- */

export function setVote(id, dir, label) {
  const next = state.votes[id] === dir ? null : dir;
  state.votes[id] = next;
  note(next ? 'vote_' + next : 'vote_clear', label || id);
  save();
}

export function setImage(key, url, label) {
  if (url) state.imgs[key] = url;
  else delete state.imgs[key];
  note('photo', label || key);
  save();
}

/* ---------------- user-added records ---------------- */

export function addActivity(fields) {
  state.addActs.push(Object.assign({
    id: uid('a'), grp: 'yours', e: '📍', t: 'p', isle: 'maui'
  }, fields));
  note('add', fields.title, 'activity');
  save();
}

export function addFood(fields) {
  state.addFood.push(Object.assign({
    id: uid('f'), e: '🍽', t: 'p', cat: 'normal'
  }, fields));
  note('add', fields.name, 'restaurant');
  save();
}

export function removeRecord(id, label) {
  state.hidden[id] = 1;
  delete state.confirmed[id];
  state.addActs = state.addActs.filter((a) => a.id !== id);
  state.addFood = state.addFood.filter((f) => f.id !== id);
  note('remove', label || id);
  save();
}

/* ---------------- itinerary ---------------- */

/** Days are edited in place by the view; this records and persists the result. */
export function touchDays(what) {
  note('day', what || '');
  save();
}

/* ---------------- import / export ---------------- */

export function exportJson() {
  return JSON.stringify(snapshot(), null, 2);
}

export function importJson(text) {
  const incoming = JSON.parse(text);
  if (!incoming || typeof incoming !== 'object') throw new Error('Not a trip file');
  const fresh = mergeIn(incoming);
  note('import', fresh.length + ' change' + (fresh.length === 1 ? '' : 's'));
  save();
  return fresh;
}

export function resetAll() {
  const keepLog = state.log.slice();
  const me = state.editor;
  hydrate(blank());
  state.editor = me;
  state.log = keepLog;
  note('reset', '');
  save();
}
