// The change log. Every edit anyone makes appends an entry here, which is what
// the Changes tab reads and what tells you someone else has touched the plan.
//
// The log rides inside the trip snapshot rather than living in its own table.
// That keeps sync to a single document and makes merging trivial: union by
// event id, sort by time, keep the newest CAP entries.

import { uid } from './util.js';

const CAP = 120;

/** Human labels for each kind of change, used by the feed. */
const VERBS = {
  confirm: 'confirmed',
  unconfirm: 'un-confirmed',
  add: 'added',
  remove: 'removed',
  day: 'edited the itinerary',
  photo: 'added a photo to',
  vote_up: 'voted yes on',
  vote_down: 'voted no on',
  vote_clear: 'cleared a vote on',
  cost: 'updated the cost for',
  ref: 'added a reference for',
  reset: 'reset the whole plan',
  import: 'merged in changes',
  clear: 'cleared the change feed',
  vehicle: 'updated'
};

export function verbFor(kind) {
  return VERBS[kind] || 'changed';
}

/** Build an event. Does not touch state — callers append it. */
export function makeEvent(who, kind, what, detail) {
  return {
    id: uid('e'),
    who: who || 'someone',
    kind,
    what: what || '',
    detail: detail || '',
    at: new Date().toISOString()
  };
}

/** Append to a log array in place, trimming to CAP. Returns the array. */
export function append(log, evt) {
  log.push(evt);
  if (log.length > CAP) log.splice(0, log.length - CAP);
  return log;
}

/**
 * Union two logs by event id, oldest first.
 * Used when a remote copy arrives or a file is imported.
 */
export function mergeLogs(mine, theirs) {
  const seen = new Set();
  const all = [];
  (mine || []).concat(theirs || []).forEach((e) => {
    if (!e || !e.id || seen.has(e.id)) return;
    seen.add(e.id);
    all.push(e);
  });
  all.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  return all.slice(-CAP);
}

/** Events from other people that this user has not looked at yet. */
export function unseen(log, me, lastSeenIso) {
  const since = lastSeenIso || '';
  return (log || []).filter((e) => e.who !== me && e.at > since);
}

/** "4 minutes ago", "yesterday", "on 3 Sep". */
export function ago(iso) {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const secs = Math.round((Date.now() - then) / 1000);

  if (secs < 45) return 'just now';
  if (secs < 90) return 'a minute ago';
  const mins = Math.round(secs / 60);
  if (mins < 60) return mins + ' minutes ago';
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs === 1 ? 'an hour ago' : hrs + ' hours ago';
  const days = Math.round(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return days + ' days ago';

  return 'on ' + new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
