// Small shared helpers. No dependencies.

/** Escape a value for safe insertion into HTML text or an attribute. */
export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Google Maps directions link for a place name. */
export function mapsUrl(q) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}

/** Google Images search, used by the "find a photo" button. */
export function picsUrl(q) {
  return 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(q);
}

/**
 * Pull a number out of a price string.
 * "$1,742" -> 1742, "~$200/pp" -> 200, "Free" -> 0, "" -> null
 */
export function parseMoney(s) {
  if (s == null) return null;
  const txt = String(s);
  if (/free/i.test(txt)) return 0;
  const m = txt.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

/** 1742 -> "$1,742" */
export function money(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}

/** Short unique id for user-added records. */
export function uid(prefix) {
  return (prefix || 'u') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Brief confirmation message at the bottom of the screen. */
let toastTimer = null;
export function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
}

/** Render a tag pill from a ["class", "label"] pair. */
export function tagOf(t) {
  return t ? '<span class="tag ' + esc(t[0]) + '">' + esc(t[1]) + '</span>' : '';
}

/** Trigger a browser download of a text file. */
export function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
