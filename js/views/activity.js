// Changes: the feed of who touched what. This is the answer to "has anyone
// edited the plan?" — everything anyone does shows up here, newest first,
// with the entries you haven't read yet marked.

import { state, markSeen, unseenEvents, status } from '../state.js';
import { verbFor, ago } from '../changelog.js';
import { esc } from '../util.js';
import { syncConfigured, POLL_MS } from '../sync.js';

const ICONS = {
  confirm: '✓',
  unconfirm: '↺',
  add: '＋',
  remove: '×',
  day: '📅',
  photo: '🖼',
  vote_up: '👍',
  vote_down: '👎',
  vote_clear: '·',
  cost: '$',
  ref: '#',
  reset: '⚠',
  import: '⇄'
};

/** Group events under "Today", "Yesterday", or a date. */
function bucketOf(iso) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'Today';
  const y = new Date(today.getTime() - 86400000);
  if (sameDay(d, y)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function eventRow(e, isNew) {
  const detail = e.detail ? ' <span class="edetail">' + esc(e.detail) + '</span>' : '';
  return '<li class="ev' + (isNew ? ' is-new' : '') + '">' +
    '<span class="eicon">' + (ICONS[e.kind] || '·') + '</span>' +
    '<span class="etext">' +
      '<b>' + esc(e.who || 'someone') + '</b> ' + verbFor(e.kind) +
      (e.what ? ' <b>' + esc(e.what) + '</b>' : '') + detail +
    '</span>' +
    '<span class="ewhen">' + esc(ago(e.at)) + '</span>' +
    (isNew ? '<span class="enew">new</span>' : '') +
    '</li>';
}

function statusBlock() {
  if (!syncConfigured) {
    return '<div class="sync-off">' +
      '<h4>Sharing is not switched on yet</h4>' +
      '<p>Right now this browser keeps its own copy, so nobody else\u2019s edits can reach ' +
      'you and yours can\u2019t reach them. The feed below still records everything <b>you</b> ' +
      'do, and <b>Export</b> will hand the whole thing to someone else.</p>' +
      '<p>To make it live for everyone, follow the five steps at the top of ' +
      '<code>js/sync.js</code> — a Firebase database URL and a rules paste, about ten minutes. ' +
      'After that this box turns green and the page checks for other people\u2019s changes ' +
      'every ' + Math.round(POLL_MS / 1000) + ' seconds.</p>' +
      '</div>';
  }

  const err = status.state === 'error';
  return '<div class="sync-on' + (err ? ' bad' : '') + '">' +
    '<h4>' + (err ? 'Sharing is on, but the last sync failed' : 'Sharing is on') + '</h4>' +
    '<p>' + (err
      ? esc(status.error) + ' — your edits are still saved in this browser and will push once ' +
        'the connection recovers.'
      : 'Checking for other people\u2019s changes every ' + Math.round(POLL_MS / 1000) +
        ' seconds. Last synced ' + (status.lastSync ? ago(status.lastSync) : 'not yet') + '.') +
    '</p></div>';
}

export function render() {
  const log = (state.log || []).slice().reverse(); // newest first
  const news = unseenEvents();
  const newIds = new Set(news.map((e) => e.id));

  let out = '<h2>Changes</h2>' +
    '<p class="lede">Every edit anyone makes lands here — confirmations, votes, added places, ' +
    'itinerary rewrites, photos. Entries from other people that you haven\u2019t seen are marked ' +
    '<b>new</b>.</p>' +
    statusBlock();

  if (!log.length) {
    out += '<div class="empty">Nothing has changed yet. Confirm something or edit a day and it ' +
      'will show up here.</div>';
    return out;
  }

  let bucket = null;
  out += '<ul class="feed">';
  log.forEach((e) => {
    const b = bucketOf(e.at);
    if (b !== bucket) {
      out += '<li class="ebucket">' + esc(b) + '</li>';
      bucket = b;
    }
    out += eventRow(e, newIds.has(e.id));
  });
  out += '</ul>';

  out += '<p class="foot">The feed keeps the most recent 120 changes and travels with the trip, ' +
    'so it survives an Export / Import and is visible to everyone when sharing is on.</p>';

  return out;
}

/** Opening this tab counts as reading the feed. */
export function bind() {
  if (unseenEvents().length) {
    // Let the paint finish first so the "new" markers are actually seen.
    setTimeout(markSeen, 1200);
  }
}
