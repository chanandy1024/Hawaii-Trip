// Days: the itinerary. Every line is editable in place.

import { state, touchDays } from '../state.js';
import { esc, sanitizeInline } from '../util.js';

export function render() {
  const days = state.days || [];

  const body = days.map((d, di) =>
    '<div class="day" data-di="' + di + '">' +
      '<div class="dt">' +
        '<span class="ed" contenteditable="plaintext-only" data-fld="date">' + esc(d.date) + '</span>' +
        '<span class="pl"><span class="ed" contenteditable="plaintext-only" data-fld="place">' +
          esc(d.place) + '</span></span>' +
      '</div>' +
      '<div>' +
        '<ul class="ditems">' +
          d.items.map((it, ii) =>
            '<li><span class="ed" contenteditable="plaintext-only" data-fld="item" data-ii="' +
              ii + '">' + sanitizeInline(it) + '</span>' +
            '<button class="x" data-ii="' + ii + '" title="Delete line">×</button></li>'
          ).join('') +
        '</ul>' +
        '<button class="addi" data-add="1">＋ add a line</button>' +
        '<button class="addi killday" data-killday="1">× delete day</button>' +
      '</div>' +
    '</div>'
  ).join('');

  return '<p class="lede">All of this is editable — click any line to rewrite it, × to drop it, ' +
    'and add lines or whole days as the plan firms up. The one hard constraint is the flight home: ' +
    'the nonstop to New York leaves Honolulu mid-afternoon and lands the next morning, so the 27th ' +
    'is a travel day.</p>' +
    '<div id="dayList">' + body + '</div>' +
    '<button class="toggleAdd" id="addDay">＋ Add a day</button>';
}

export function bind(repaint) {
  const panel = document.getElementById('days');
  if (!panel) return;

  panel.addEventListener('click', (ev) => {
    const t = ev.target;

    if (t.id === 'addDay') {
      state.days.push({ date: 'New day', place: 'Where', items: [''] });
      touchDays('added a day');
      repaint();
      return;
    }

    const xb = t.closest('.x');
    if (xb) {
      const di = +xb.closest('.day').dataset.di;
      state.days[di].items.splice(+xb.dataset.ii, 1);
      touchDays('removed a line from ' + (state.days[di].date || 'a day'));
      repaint();
      return;
    }

    const ai = t.closest('.addi');
    if (ai) {
      const di = +ai.closest('.day').dataset.di;
      if (ai.dataset.killday) {
        const label = state.days[di].date || 'a day';
        state.days.splice(di, 1);
        touchDays('deleted ' + label);
        repaint();
        return;
      }
      state.days[di].items.push('');
      touchDays('added a line to ' + (state.days[di].date || 'a day'));
      repaint();
      const lines = document.querySelectorAll('.day[data-di="' + di + '"] .ed[data-fld="item"]');
      if (lines.length) lines[lines.length - 1].focus();
    }
  });

  // Save on blur rather than on every keystroke, so the caret is never disturbed.
  panel.addEventListener('blur', (ev) => {
    const el = ev.target;
    if (!el.classList || !el.classList.contains('ed')) return;
    const day = el.closest('.day');
    if (!day) return;
    const di = +day.dataset.di;
    if (!state.days[di]) return;

    const before = el.dataset.fld === 'item'
      ? state.days[di].items[+el.dataset.ii]
      : state.days[di][el.dataset.fld];
    const after = el.dataset.fld === 'item' ? sanitizeInline(el.innerHTML) : el.textContent;
    if (before === after) return; // focus passed through without an edit

    if (el.dataset.fld === 'item') state.days[di].items[+el.dataset.ii] = after;
    else state.days[di][el.dataset.fld] = after;
    touchDays(state.days[di].date || '');
  }, true);
}
