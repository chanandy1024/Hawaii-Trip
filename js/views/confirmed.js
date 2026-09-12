// Confirmed: everything actually booked, grouped by type, with a running total.
//
// A record lands here when Confirm is pressed on the Stay, Activities or Food
// tab. The entry carries editable fields for the reservation reference, the
// date/time and the real cost, so this tab becomes the thing you travel with.

import { state, patchConfirm, toggleConfirm } from '../state.js';
import { esc, money, parseMoney } from '../util.js';
import { thumb } from './shared.js';
import { findHotel } from './stay.js';
import { findActivity } from './activities.js';
import { findFood } from './food.js';

const GROUPS = [
  { kind: 'stay', head: 'Stay', blurb: 'Where you sleep. Keep the confirmation number here.' },
  { kind: 'activity', head: 'Activities', blurb: 'Booked and paid for. Times matter on these.' },
  { kind: 'food', head: 'Tables', blurb: 'Reservations held. Most need a card on file.' }
];

/** Look up the source record for a confirmed id, whatever type it is. */
function resolve(id, kind) {
  if (kind === 'stay') {
    const h = findHotel(id);
    if (h) return { title: h.name, sub: h.hood, emoji: h.e, tone: h.t, q: h.q, key: 'h_' + id };
  }
  if (kind === 'activity') {
    const a = findActivity(id);
    if (a) return { title: a.title, sub: a.where, emoji: a.e, tone: a.t, q: a.q, key: 'a_' + id };
  }
  if (kind === 'food') {
    const f = findFood(id);
    if (f) return { title: f.name, sub: f.loc, emoji: f.e, tone: f.t, q: f.q, key: 'f_' + id };
  }
  return null;
}

/** Sum of the cost fields on every confirmed record. */
export function confirmedTotal() {
  return Object.values(state.confirmed).reduce((sum, c) => {
    const n = parseMoney(c.cost);
    return sum + (n || 0);
  }, 0);
}

function field(id, name, label, value, placeholder) {
  return '<div><label>' + esc(label) + '</label>' +
    '<input data-cid="' + esc(id) + '" data-field="' + esc(name) + '"' +
    ' value="' + esc(value || '') + '" placeholder="' + esc(placeholder || '') + '"></div>';
}

function row(id, rec) {
  const src = resolve(id, rec.kind);
  const title = src ? src.title : id;

  return '<div class="crow" data-id="' + esc(id) + '">' +
    (src ? thumb(src.key, src.emoji || '📍', src.tone, 't44', src.q || title) : '') +
    '<div class="cbody">' +
      '<p class="n">' + esc(title) + '</p>' +
      '<p class="eloc">' + esc(src ? (src.sub || '') : '') +
        (rec.by ? ' · confirmed by ' + esc(rec.by) : '') +
        (rec.at ? ' on ' + esc(rec.at) : '') + '</p>' +
      '<div class="cfields">' +
        field(id, 'when', 'When', rec.when, 'Mon 21, 7:00 am') +
        field(id, 'ref', 'Reference', rec.ref, 'Booking code') +
        field(id, 'cost', 'Cost paid', rec.cost, '$0') +
        field(id, 'note', 'Note', rec.note, 'Meet at…') +
      '</div>' +
    '</div>' +
    '<button class="btn ghost sm" data-unconfirm="' + esc(id) + '">Unconfirm</button>' +
    '</div>';
}

export function render() {
  const ids = Object.keys(state.confirmed);

  if (!ids.length) {
    return '<h2>Nothing confirmed yet</h2>' +
      '<p class="lede">Press <b>Confirm</b> on anything in Stay, Activities or Food and it ' +
      'appears here with space for the reservation reference and what you actually paid. ' +
      'This tab is meant to be the one you open at the airport.</p>' +
      '<div class="empty">No bookings yet. Start with the Maui bed — it is the one with a ' +
      'real deadline.</div>';
  }

  const byKind = {};
  ids.forEach((id) => {
    const k = state.confirmed[id].kind || 'activity';
    (byKind[k] = byKind[k] || []).push(id);
  });

  const total = confirmedTotal();
  const counted = ids.filter((id) => parseMoney(state.confirmed[id].cost) != null).length;

  let out = '<div class="tally">' +
    '<div class="cell"><span class="lbl">Confirmed</span><span class="big">' + ids.length +
      '</span></div>' +
    '<div class="cell"><span class="lbl">Committed</span><span class="big">' + money(total) +
      '</span></div>' +
    '<div class="cell"><span class="lbl">Per person</span><span class="big">' + money(total / 2) +
      '</span></div>' +
    '<p class="note">Totals add up the <b>Cost paid</b> fields below, so they are only as ' +
    'accurate as what you type in. ' + counted + ' of ' + ids.length +
    ' have a cost filled in. Taxes and parking are not inferred.</p>' +
    '</div>';

  let first = true;
  GROUPS.forEach((g) => {
    const rows = byKind[g.kind];
    if (!rows || !rows.length) return;
    out += '<h3' + (first ? ' class="first"' : '') + '>' + g.head +
      ' <span class="src">' + rows.length + '</span></h3>' +
      '<p class="lede">' + g.blurb + '</p>' +
      rows.map((id) => row(id, state.confirmed[id])).join('');
    first = false;
  });

  out += '<p class="foot">Unconfirming something leaves it on its original tab — nothing is ' +
    'deleted, and the reference you typed is kept until you remove the item outright.</p>';

  return out;
}

export function bind(repaint) {
  const panel = document.getElementById('confirmed');
  if (!panel) return;

  panel.addEventListener('click', (ev) => {
    const un = ev.target.closest('[data-unconfirm]');
    if (!un) return;
    const id = un.dataset.unconfirm;
    const src = resolve(id, state.confirmed[id].kind);
    toggleConfirm(id, state.confirmed[id].kind, null, src && src.title);
    repaint();
  });

  // Field edits save on the way out, not on every keypress.
  panel.addEventListener('change', (ev) => {
    const el = ev.target;
    if (!el.dataset || !el.dataset.cid) return;
    const src = resolve(el.dataset.cid, (state.confirmed[el.dataset.cid] || {}).kind);
    patchConfirm(el.dataset.cid, el.dataset.field, el.value, src && src.title);
    if (el.dataset.field === 'cost') repaint();
  });
}
