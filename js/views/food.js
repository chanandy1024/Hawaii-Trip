// Food: grouped fancy / normal / local, each with town and drive time.

import { FOOD, FOOD_CATS } from '../../data/food.js';
import { state, addFood, removeRecord, toggleConfirm, isConfirmed } from '../state.js';
import { esc, mapsUrl } from '../util.js';
import { thumb, confirmBtn } from './shared.js';

export function allFood() {
  return FOOD.concat(state.addFood).filter((f) => !state.hidden[f.id]);
}

export function findFood(id) {
  return allFood().find((f) => f.id === id);
}

function row(f) {
  const conf = isConfirmed(f.id);
  return '<div class="erow' + (conf ? ' is-conf' : '') + '" data-id="' + esc(f.id) + '">' +
    thumb('f_' + f.id, f.e || '🍽', f.t, 't62', (f.q || f.name) + ' food dish') +
    '<div class="ebody">' +
      '<p class="n"><a href="' + esc(mapsUrl(f.q || f.name)) + '" target="_blank" rel="noopener">' +
        esc(f.name) + ' ↗</a></p>' +
      '<p class="eloc">' + esc(f.loc || '') + '</p>' +
      '<p class="d">' + esc(f.desc || '') + '</p>' +
    '</div>' +
    '<div class="eright">' +
      '<span class="cash">' + esc(f.cash || '') + '</span>' +
      confirmBtn(f.id) +
      '<button class="kill">remove</button>' +
    '</div>' +
    '</div>';
}

export function render() {
  const list = allFood();
  let out = '<p class="lede">Split by how dressed-up it is rather than by island — each one ' +
    'carries its town and the drive from your base, and every name opens directions in Maps. ' +
    'Confirm the ones you book a table at.</p>';

  let first = true;
  FOOD_CATS.forEach((c) => {
    const rows = list.filter((f) => f.cat === c.k);
    if (!rows.length) return;
    out += '<h3' + (first ? ' class="first"' : '') + '>' + esc(c.h) + '</h3>' +
      '<div class="eat">' + rows.map(row).join('') + '</div>';
    first = false;
  });

  out += '<button class="toggleAdd" data-toggle="addFood" data-label="Add a place">＋ Add a place</button>' +
    '<div class="adder" id="addFood" hidden>' +
      '<h4>Add a place</h4>' +
      '<div class="fields">' +
        '<input id="fName" placeholder="Name">' +
        '<input id="fLoc" placeholder="Town + drive — e.g. Kīhei · 10 min">' +
        '<select id="fCat">' +
          FOOD_CATS.map((c) => '<option value="' + c.k + '">' + c.h + '</option>').join('') +
        '</select>' +
        '<select id="fCash"><option>$</option><option>$$</option><option>$$$</option>' +
          '<option>$$$$</option></select>' +
      '</div>' +
      '<textarea id="fDesc" placeholder="What to order, why go"></textarea>' +
      '<button class="go" id="fGo">Add it</button>' +
    '</div>';

  return out;
}

export function bind(repaint) {
  const panel = document.getElementById('food');
  if (!panel) return;

  panel.addEventListener('click', (ev) => {
    const t = ev.target;

    const cb = t.closest('[data-confirm]');
    if (cb) {
      const f = findFood(cb.dataset.confirm);
      toggleConfirm(cb.dataset.confirm, 'food', {}, f && f.name);
      repaint();
      return;
    }

    const kb = t.closest('.kill');
    if (kb) {
      const id = kb.closest('.erow').dataset.id;
      const f = findFood(id);
      removeRecord(id, f && f.name);
      repaint();
      return;
    }

    const tg = t.closest('[data-toggle]');
    if (tg) {
      const box = document.getElementById(tg.dataset.toggle);
      box.hidden = !box.hidden;
      tg.textContent = (box.hidden ? '＋ ' : '× ') + tg.dataset.label;
      return;
    }

    if (t.id === 'fGo') {
      const name = document.getElementById('fName').value.trim();
      if (!name) { document.getElementById('fName').focus(); return; }
      addFood({
        name,
        loc: document.getElementById('fLoc').value.trim(),
        cat: document.getElementById('fCat').value,
        cash: document.getElementById('fCash').value,
        desc: document.getElementById('fDesc').value.trim(),
        q: name
      });
      repaint();
    }
  });
}
