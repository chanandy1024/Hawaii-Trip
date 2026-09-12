// Single source of truth. Everything the user changes lives here, gets written
// to localStorage, pushed to the remote (if one is configured), and recorded in
// the change log so other people can see it happened.

import { DEFAULT_DAYS } from '../data/days.js';
import { uid, isImageUrl } from './util.js';
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
    logClearedAt: '',   // watermark: events at or before this are gone for good
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

/**
 * Empty the change feed for everyone.
 *
 * Merging is a union, and a union cannot express a deletion — dropping the
 * entries here would just pull them back from the next person who syncs. So the
 * clear is recorded as a watermark instead: every copy drops what predates it,
 * and the latest watermark wins.
 */
export function clearLog(label) {
  const now = Date.now();
  // A hair before the entry we are about to write, so that one survives.
  state.logClearedAt = new Date(now - 1).toISOString();
  state.log = [];
  note('clear', label || '');
  save();
}

/** Drop anything the watermark has swept away. */
function afterClear(log) {
  const mark = state.logClearedAt || '';
  return mark ? (log || []).filter((e) => e && e.at > mark) : (log || []);
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
    pushRemote();
  } else {
    emit();
  }
}

/**
 * Push the current state to the remote, one request at a time.
 *
 * Each save PUTs the whole trip, so two of them in flight together can land in
 * either order and the older one wins — an edit made a moment ago then vanishes
 * from the shared copy. Saves during a push are collapsed into a single follow-up
 * that carries the latest state, which is all anyone wanted anyway.
 */
let pushing = false;
let pushAgain = false;

function pushRemote() {
  if (pushing) { pushAgain = true; return; }
  pushing = true;
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
    .finally(() => {
      pushing = false;
      emit();
      if (pushAgain) { pushAgain = false; pushRemote(); }
    });
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
  if (!Array.isArray(state.addActs)) state.addActs = [];
  if (!Array.isArray(state.addFood)) state.addFood = [];
  state.votes = asVoteMap(state.votes, obj.editor);
}

/**
 * Votes used to be one value per item — votes[id] = 'up' — which meant the
 * second person to vote silently replaced the first. Older copies are read
 * forward into the per-person shape, crediting whoever owned that copy.
 */
function asVoteMap(votes, owner) {
  const out = {};
  Object.keys(votes || {}).forEach((id) => {
    const v = votes[id];
    if (!v) return;
    if (typeof v === 'string') {
      out[id] = { [owner || 'someone']: { dir: v, at: '' } };
      return;
    }
    if (typeof v !== 'object') return;
    const box = {};
    Object.keys(v).forEach((who) => {
      const cell = v[who];
      if (typeof cell === 'string') box[who] = { dir: cell, at: '' };
      else if (cell && typeof cell === 'object') box[who] = { dir: cell.dir || null, at: cell.at || '' };
    });
    if (Object.keys(box).length) out[id] = box;
  });
  return out;
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

  // Per item, take the union of both sides' voters, and for anyone who appears
  // on both sides keep whichever vote they cast later.
  const theirVotes = asVoteMap(incoming.votes, incoming.editor);
  Object.keys(theirVotes).forEach((id) => {
    const merged = Object.assign({}, state.votes[id]);
    Object.keys(theirVotes[id]).forEach((who) => {
      const mine = merged[who];
      const theirs = theirVotes[id][who];
      if (!mine || (theirs.at || '') > (mine.at || '')) merged[who] = theirs;
    });
    state.votes[id] = merged;
  });
  state.confirmed = Object.assign({}, state.confirmed, incoming.confirmed || {});
  state.imgs = Object.assign({}, state.imgs, incoming.imgs || {});
  state.hidden = Object.assign({}, state.hidden, incoming.hidden || {});
  state.seenBy = Object.assign({}, state.seenBy, incoming.seenBy || {});

  const haveA = new Set(state.addActs.map((a) => a.id));
  (incoming.addActs || []).forEach((a) => { if (a && !haveA.has(a.id)) state.addActs.push(a); });

  const haveF = new Set(state.addFood.map((f) => f.id));
  (incoming.addFood || []).forEach((f) => { if (f && !haveF.has(f.id)) state.addFood.push(f); });

  // Strictly greater: on a tie keep the itinerary in front of whoever is typing.
  if (incoming.days && (incoming.rev || 0) > (state.rev || 0)) state.days = incoming.days;

  if ((incoming.logClearedAt || '') > (state.logClearedAt || '')) {
    state.logClearedAt = incoming.logClearedAt;
  }
  state.log = afterClear(mergeLogs(state.log, incoming.log));
  state.rev = Math.max(state.rev || 0, incoming.rev || 0);

  // Don't announce entries the clear has already swept away.
  return afterClear(fresh);
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

/**
 * Votes are per person: votes[id] is { name: { dir, at } }, so two people
 * voting on the same thing add up instead of overwriting each other.
 *
 * Clearing a vote records { dir: null } rather than dropping the key. A merge
 * is a union, and a union cannot express a deletion — without the tombstone,
 * the vote you just cleared comes back the next time anyone syncs.
 */
export function setVote(id, dir, label) {
  const me = state.editor || 'someone';
  const box = state.votes[id] || (state.votes[id] = {});
  const next = (box[me] && box[me].dir) === dir ? null : dir;

  box[me] = { dir: next, at: new Date().toISOString() };

  note(next ? 'vote_' + next : 'vote_clear', label || id);
  save();
}

/** Who voted which way on one item, and what this user picked. */
export function voteTally(id) {
  const box = state.votes[id] || {};
  const up = [];
  const down = [];
  Object.keys(box).forEach((who) => {
    const dir = box[who] && box[who].dir;
    if (dir === 'up') up.push(who);
    else if (dir === 'down') down.push(who);
  });
  up.sort();
  down.sort();
  return { up, down, mine: (box[state.editor || 'someone'] || {}).dir || null };
}

/**
 * Photos for one slot. Takes one URL or several (an array, or a blob of text
 * with them separated by whitespace or commas) so a whole listing's worth can
 * be pasted at once. Stored as a string for one, an array for several.
 */
export function setImage(key, url, label) {
  const list = (Array.isArray(url) ? url : String(url == null ? '' : url).split(/[\s,]+/))
    .map((u) => String(u).trim())
    .filter(isImageUrl);

  if (!list.length) delete state.imgs[key];
  else state.imgs[key] = list.length === 1 ? list[0] : list;

  note('photo', label || key, list.length > 1 ? list.length + ' photos' : '');
  save();
  return list.length;
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
