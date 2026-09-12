// Fragments reused across more than one tab.

import { PHOTOS } from '../../data/photos.js';
import { state, setImage, isConfirmed } from '../state.js';
import { esc, picsUrl, isImageUrl } from '../util.js';

/**
 * Every photo for a slot: the ones that ship with the site first, then anything
 * anyone has pasted in. Bundled photos carry their credit; pasted ones don't,
 * which is how the credit line knows what to name.
 */
export function photosFor(key) {
  const added = state.imgs[key];
  // Checked again on the way out, not just on the way in: these can also arrive
  // from the shared copy, which has not been through setImage().
  const mine = (Array.isArray(added) ? added : added ? [added] : [])
    .filter(isImageUrl)
    .map((url) => ({ url, by: '', lic: '' }));
  return (PHOTOS[key] || []).concat(mine);
}

/**
 * Thumbnail with an edit affordance.
 * key must be stable — it is how the photos for this slot are looked up.
 */
export function thumb(key, emoji, tone, size, query) {
  const pics = photosFor(key);
  const first = pics[0];
  return '<div class="thumb ' + esc(tone || 'bg') + ' ' + esc(size) + '"' +
    ' data-k="' + esc(key) + '" data-q="' + esc(query || '') + '">' +
    (first
      ? '<img src="' + esc(first.url) + '" alt="" loading="lazy">'
      : '<span class="ph">' + esc(emoji) + '</span>') +
    '<button class="setimg" title="Add or change photo">' + (first ? '✎' : '＋') + '</button>' +
    '</div>';
}

/**
 * Wide scrolling strip of every photo for a slot — what the Stay cards lead
 * with. Falls back to a single prompt panel when there is nothing yet.
 */
export function gallery(key, emoji, tone, query) {
  const pics = photosFor(key);

  if (!pics.length) {
    return '<div class="gal empty ' + esc(tone || 'bg') + '"' +
      ' data-k="' + esc(key) + '" data-q="' + esc(query || '') + '">' +
      '<span class="ph">' + esc(emoji || '📷') + '</span>' +
      '<button class="setimg" title="Add photos">＋ Add photos</button>' +
      '</div>';
  }

  // Say what the picture is when it is not the property itself. A stock beach
  // presented as the place you are booking would be a lie.
  const first = pics[0];
  const note = first.area
    ? first.area + ' — the setting, not the property'
    : (first.note || '');

  return '<div class="gal" data-k="' + esc(key) + '" data-q="' + esc(query || '') + '">' +
    '<div class="gal-strip">' +
      pics.map((p) =>
        '<img src="' + esc(p.url) + '" alt="' + esc(query || '') + '" loading="lazy">'
      ).join('') +
    '</div>' +
    (note ? '<span class="gal-note">' + esc(note) + '</span>' : '') +
    '<button class="setimg" title="Add or change photos">✎</button>' +
    '</div>';
}

/**
 * "Photos: Bossfrog, CC BY-SA 4.0 · NPS, public domain".
 * These licences all require credit, so this is not optional furniture — it is
 * the condition on which the photos are here at all.
 */
export function credits(keys) {
  const seen = new Set();
  const parts = [];

  keys.forEach((key) => {
    (PHOTOS[key] || []).forEach((p) => {
      if (!p.by) return;
      const line = p.by + ', ' + (p.lic || '').replace(/^Public domain$/i, 'public domain');
      if (seen.has(line)) return;
      seen.add(line);
      parts.push(p.page
        ? '<a href="' + esc(p.page) + '" target="_blank" rel="noopener">' + esc(line) + '</a>'
        : esc(line));
    });
  });

  if (!parts.length) return '';
  return '<p class="credits photo-credits">Photos: ' + parts.join(' · ') +
    ' — via Wikimedia Commons.</p>';
}

/* ---------------- photo bar ---------------- */

let activeKey = null;
let activeLabel = '';

/** Friendly name for the log entry, taken from the slot's search hint. */
function labelFor() {
  return activeLabel || 'a photo slot';
}

export function initPhotoBar(repaint) {
  const bar = document.getElementById('imgbar');
  const input = document.getElementById('imgbarUrl');
  const findBtn = document.getElementById('imgbarFind');

  function close() { bar.hidden = true; activeKey = null; activeLabel = ''; }

  function currentUrls(key) {
    const v = state.imgs[key];
    return Array.isArray(v) ? v.join('\n') : (v || '');
  }

  document.addEventListener('click', (ev) => {
    const hit = ev.target.closest('.setimg');
    if (!hit) return;
    const slot = hit.closest('.thumb, .gal');
    if (!slot) return;
    activeKey = slot.dataset.k;
    activeLabel = slot.dataset.q || '';
    input.value = currentUrls(activeKey);
    findBtn.dataset.q = slot.dataset.q || '';
    bar.hidden = false;
    input.focus();
  });

  document.getElementById('imgbarSave').addEventListener('click', () => {
    if (!activeKey) return;
    setImage(activeKey, input.value, labelFor());
    close();
    repaint();
  });

  document.getElementById('imgbarClear').addEventListener('click', () => {
    if (activeKey) setImage(activeKey, '', labelFor());
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

/* ---------------- confirm toggle ---------------- */

/** Confirm / confirmed toggle. Reads its own state so callers stay simple. */
export function confirmBtn(id) {
  const on = isConfirmed(id);
  return '<button class="conf" data-confirm="' + esc(id) + '" aria-pressed="' + on + '">' +
    (on ? '✓ Confirmed' : 'Confirm') + '</button>';
}
