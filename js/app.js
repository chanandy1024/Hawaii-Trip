// Entry point. Gate → boot → paint, then poll for other people's changes.

import { requireSignIn, signOut } from './auth.js';
import {
  state, save, boot, useRemote, exportJson, importJson, resetAll,
  confirmedCount, unseenEvents, mergeIn, status, onChange
} from './state.js';
import { makeAdapter, startPolling, syncMode, syncConfigured, POLL_MS } from './sync.js';
import { ago } from './changelog.js';
import { toast, download } from './util.js';
import { initPhotoBar } from './views/shared.js';

import * as overview from './views/overview.js';
import * as activities from './views/activities.js';
import * as stay from './views/stay.js';
import * as food from './views/food.js';
import * as days from './views/days.js';
import * as confirmed from './views/confirmed.js';
import * as activity from './views/activity.js';
import * as book from './views/book.js';

const TABS = [
  { id: 'overview', label: 'Overview', view: overview },
  { id: 'activities', label: 'Activities', view: activities },
  { id: 'stay', label: 'Stay', view: stay },
  { id: 'food', label: 'Food', view: food },
  { id: 'confirmed', label: 'Confirmed', view: confirmed, badge: 'confirmed' },
  { id: 'days', label: 'Days', view: days },
  { id: 'changes', label: 'Changes', view: activity, badge: 'unseen' },
  { id: 'book', label: 'Book', view: book }
];

let adapter = null;

/* ---------------- tab bar ---------------- */

function badgeCount(kind) {
  if (kind === 'confirmed') return confirmedCount();
  if (kind === 'unseen') return unseenEvents().length;
  return 0;
}

function paintNav() {
  document.getElementById('tabs').innerHTML = TABS.map((t) => {
    const n = t.badge ? badgeCount(t.badge) : 0;
    const cls = t.badge === 'unseen' && n ? ' class="count alert"' : ' class="count"';
    return '<button role="tab" data-p="' + t.id + '" aria-selected="' + (state.tab === t.id) + '">' +
      t.label +
      (t.badge ? '<span' + cls + (n ? '' : ' hidden') + '>' + n + '</span>' : '') +
      '</button>';
  }).join('');
}

/* ---------------- sync indicator ---------------- */

function paintStatus() {
  const pill = document.getElementById('syncPill');
  if (!pill) return;

  let cls = 'pill';
  let text;

  if (!syncConfigured) {
    cls += ' off';
    text = 'Not shared — this device only';
  } else if (status.state === 'error') {
    cls += ' bad';
    text = 'Sync failed';
  } else if (status.state === 'saving') {
    cls += ' busy';
    text = 'Saving…';
  } else {
    cls += ' ok';
    text = status.lastSync ? 'Synced ' + ago(status.lastSync) : 'Shared';
  }

  pill.className = cls;
  pill.textContent = text;
  pill.title = syncConfigured
    ? 'Checks for other people\u2019s changes every ' + Math.round(POLL_MS / 1000) + ' seconds'
    : 'Turn on sharing in js/sync.js to sync with other people';

  const n = unseenEvents().length;
  const alertEl = document.getElementById('newAlert');
  alertEl.hidden = !n;
  if (n) {
    alertEl.textContent = n + (n === 1 ? ' new change' : ' new changes');
  }
}

/* ---------------- painting ---------------- */

function paintPanel() {
  const tab = TABS.find((t) => t.id === state.tab) || TABS[0];

  TABS.forEach((t) => {
    const el = document.getElementById(t.id);
    if (el) el.hidden = t.id !== tab.id;
  });

  const host = document.getElementById(tab.id);
  host.innerHTML = tab.view.render();
  if (tab.view.bind) tab.view.bind(repaint);
}

export function repaint() {
  paintNav();
  paintStatus();
  paintPanel();
}

function go(id) {
  state.tab = id;
  save({ silent: true });
  repaint();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------------- toolbar ---------------- */

function bindToolbar() {
  document.getElementById('tabs').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-p]');
    if (b) go(b.dataset.p);
  });

  document.getElementById('newAlert').addEventListener('click', () => go('changes'));

  document.getElementById('btnExport').addEventListener('click', () => {
    download('hawaii-2026-trip.json', exportJson());
    toast('Trip exported');
  });

  const fileInput = document.getElementById('importFile');
  document.getElementById('btnImport').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    try {
      const fresh = importJson(await f.text());
      repaint();
      toast(fresh.length ? 'Merged ' + fresh.length + ' change(s)' : 'Nothing new in that file');
    } catch (e) {
      toast('That file did not parse');
      console.error(e);
    }
    fileInput.value = '';
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    // Two-step on purpose: this clears confirmations and the itinerary.
    const btn = document.getElementById('btnReset');
    if (btn.dataset.armed !== '1') {
      btn.dataset.armed = '1';
      btn.textContent = 'Really reset?';
      setTimeout(() => { btn.dataset.armed = '0'; btn.textContent = 'Reset'; }, 4000);
      return;
    }
    resetAll();
    repaint();
    toast('Back to the original plan');
  });

  document.getElementById('btnOut').addEventListener('click', signOut);
}

/* ---------------- start ---------------- */

async function start() {
  const user = await requireSignIn();
  state.editor = user;
  document.getElementById('who').textContent = user;

  adapter = makeAdapter();
  useRemote(adapter);

  await boot();
  state.editor = user; // boot may have hydrated over it

  bindToolbar();
  initPhotoBar(repaint);

  // Keep the status pill honest as saves resolve.
  onChange(() => {
    paintStatus();
    paintNav();
  });

  repaint();

  // Watch for other people's saves. No-op when sharing is off.
  startPolling(
    adapter,
    () => state.rev || 0,
    (snap) => {
      const fresh = mergeIn(snap);

      // We just merged a copy that did not match ours. Push the union back so
      // the shared document ends up holding both sides and everyone converges
      // on one revision — otherwise whatever we hold that they lack stays
      // stranded in this browser until the next edit.
      if ((snap.rev || 0) !== state.rev) save();

      repaint();
      if (fresh.length) {
        const who = [...new Set(fresh.map((e) => e.who))].filter(Boolean);
        toast(
          (who.length === 1 ? who[0] : who.length + ' people') +
          ' made ' + fresh.length + ' change' + (fresh.length === 1 ? '' : 's')
        );
      }
    },
    (s) => {
      status.state = s.state;
      if (s.at) status.lastSync = s.at;
      if (s.error) status.error = s.error;
      paintStatus();
    }
  );

  // Refresh relative timestamps ("synced 2 minutes ago") without a full repaint.
  setInterval(paintStatus, 30000);

  if (syncMode === 'local') {
    console.info('Sharing is off — this browser keeps its own copy.');
  }
}

start().catch((e) => {
  console.error(e);
  const gate = document.getElementById('gate');
  if (gate) gate.hidden = true;
  document.querySelector('.wrap').insertAdjacentHTML('afterbegin',
    '<div class="empty">Something failed to start — open the browser console for the error. ' +
    'If you opened this file straight from disk, ES modules will not load: run a local server ' +
    'instead, with <code>./serve.sh</code> or <code>python3 -m http.server</code>.</div>');
});
