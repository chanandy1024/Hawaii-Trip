// Fragments reused across more than one tab.

import { state, setImage, isConfirmed } from '../state.js';
import { esc, picsUrl } from '../util.js';

/**
 * Thumbnail with an edit affordance.
 * key must be stable — it is how the saved image URL is looked up.
 */
export function thumb(key, emoji, tone, size, query) {
  const url = state.imgs[key];
  return '<div class="thumb ' + esc(tone || 'bg') + ' ' + esc(size) + '"' +
    ' data-k="' + esc(key) + '" data-q="' + esc(query || '') + '">' +
    (url
      ? '<img src="' + esc(url) + '" alt="" loading="lazy">'
      : '<span class="ph">' + esc(emoji) + '</span>') +
    '<button class="setimg" title="Add or change photo">' + (url ? '✎' : '＋') + '</button>' +
    '</div>';
}

/** Confirm / confirmed toggle. Reads its own state so callers stay simple. */
export function confirmBtn(id) {
  const on = isConfirmed(id);
  return '<button class="conf" data-confirm="' + esc(id) + '" aria-pressed="' + on + '">' +
    (on ? '✓ Confirmed' : 'Confirm') + '</button>';
}

/* ---------------- photo bar ---------------- */

let activeKey = null;
let activeLabel = '';

/** Friendly name for the log entry, taken from the thumbnail's search hint. */
function labelFor() {
  return activeLabel || 'a photo slot';
}

export function initPhotoBar(repaint) {
  const bar = document.getElementById('imgbar');
  const input = document.getElementById('imgbarUrl');
  const findBtn = document.getElementById('imgbarFind');

  function close() { bar.hidden = true; activeKey = null; activeLabel = ''; }

  document.addEventListener('click', (ev) => {
    const hit = ev.target.closest('.setimg');
    if (!hit) return;
    const th = hit.closest('.thumb');
    activeKey = th.dataset.k;
    activeLabel = th.dataset.q || '';
    input.value = state.imgs[activeKey] || '';
    findBtn.dataset.q = th.dataset.q || '';
    bar.hidden = false;
    input.focus();
  });

  document.getElementById('imgbarSave').addEventListener('click', () => {
    if (!activeKey) return;
    const url = input.value.trim();
    setImage(activeKey, url, labelFor(activeKey));
    close();
    repaint();
  });

  document.getElementById('imgbarClear').addEventListener('click', () => {
    if (activeKey) setImage(activeKey, '', labelFor(activeKey));
    close();
    repaint();
  });

  document.getElementById('imgbarCancel').addEventListener('click', close);

  findBtn.addEventListener('click', function () {
    window.open(picsUrl(this.dataset.q || 'hawaii'), '_blank', 'noopener');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('imgbarSave').click();
    if (e.key === 'Escape') close();
  });
}
