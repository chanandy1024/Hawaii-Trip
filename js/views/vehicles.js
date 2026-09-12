// Vehicles: the rental cars, with every field editable in place.
//
// Two cars are seeded from the itinerary because the trip already fixes the
// islands and the dates. Everything that comes out of an actual booking —
// company, confirmation, what you paid — is typed in here and syncs like the
// rest of the trip.

import { DEFAULT_VEHICLES, VEHICLE_FIELDS } from '../../data/vehicles.js';
import { liveVehicles, addVehicle, patchVehicle, removeVehicle } from '../state.js';
import { esc, money, parseMoney, mapsUrl } from '../util.js';

const ISLE = { maui: 'Maui', oahu: 'Oʻahu' };

function field(v, f) {
  return '<div><label for="veh_' + esc(v.id + '_' + f.k) + '">' + esc(f.label) + '</label>' +
    '<input id="veh_' + esc(v.id + '_' + f.k) + '" data-vid="' + esc(v.id) + '"' +
    ' data-field="' + esc(f.k) + '" value="' + esc(v[f.k] || '') + '"' +
    ' placeholder="' + esc(f.hint || '') + '"></div>';
}

function card(v) {
  const booked = !!(v.company || v.ref);
  return '<div class="veh' + (booked ? ' is-conf' : '') + '" data-id="' + esc(v.id) + '">' +
    '<div class="veh-head">' +
      '<div>' +
        '<p class="hood">' + esc(ISLE[v.isle] || v.isle || '') +
          (v.pickupAt ? ' · ' + esc(v.pickupAt) : '') + '</p>' +
        '<h4>' + esc(v.label || 'Car') + '</h4>' +
      '</div>' +
      '<div class="veh-side">' +
        (v.cost ? '<span class="cash">' + esc(v.cost) + '</span>' : '') +
        (v.pickup
          ? '<a class="btn ghost sm" href="' + esc(mapsUrl(v.pickup)) +
            '" target="_blank" rel="noopener">Map ↗</a>'
          : '') +
        '<button class="btn ghost sm kill" data-kill="' + esc(v.id) + '">Remove</button>' +
      '</div>' +
    '</div>' +
    '<div class="cfields">' + VEHICLE_FIELDS.map((f) => field(v, f)).join('') + '</div>' +
    '<label class="veh-note-label" for="veh_' + esc(v.id) + '_note">Notes</label>' +
    '<textarea id="veh_' + esc(v.id) + '_note" class="veh-note" data-vid="' + esc(v.id) + '"' +
      ' data-field="note" placeholder="Insurance, second driver, where to leave the keys…">' +
      esc(v.note || '') + '</textarea>' +
    '</div>';
}

export function render() {
  const list = liveVehicles();

  const spend = list.reduce((sum, v) => sum + (parseMoney(v.cost) || 0), 0);
  const booked = list.filter((v) => v.company || v.ref).length;

  let out = '<p class="lede">Both islands need a car, and they are usually two separate ' +
    'bookings rather than one interisland rental. Fill in whatever the confirmation email ' +
    'says — it saves as you tab out of each box, and the other person sees it.</p>';

  if (!list.length) {
    out += '<div class="empty">No cars on the plan. Add one below, or press Reset to bring ' +
      'back the two the trip starts with.</div>';
  } else {
    out += '<div class="tally">' +
      '<div class="cell"><span class="lbl">Cars</span><span class="big">' + list.length +
        '</span></div>' +
      '<div class="cell"><span class="lbl">Booked</span><span class="big">' + booked + ' of ' +
        list.length + '</span></div>' +
      '<div class="cell"><span class="lbl">Cost</span><span class="big">' +
        (spend ? money(spend) : '—') + '</span></div>' +
      '<p class="note">Adds up the <b>Cost</b> boxes below, so it is only as accurate as what ' +
      'you type. Parking is not in here — O‘ahu hotels charge $55–80 a night on top, and it is ' +
      'billed by the hotel, not the rental company.</p>' +
      '</div>' +
      list.map(card).join('');
  }

  out += '<button class="toggleAdd" id="addVeh">＋ Add a vehicle</button>' +
    '<p class="foot">Removing a car hides it for everyone rather than deleting the record, so ' +
    'two people removing and re-adding cannot end up with one copy each. The two the trip ' +
    'starts with — ' + DEFAULT_VEHICLES.map((v) => esc(v.label)).join(' and ') +
    ' — come back on Reset.</p>';

  return out;
}

export function bind(repaint) {
  const panel = document.getElementById('vehicles');
  if (!panel) return;

  panel.addEventListener('click', (ev) => {
    const kill = ev.target.closest('[data-kill]');
    if (kill) {
      removeVehicle(kill.dataset.kill);
      repaint();
      return;
    }

    if (ev.target.id === 'addVeh') {
      const v = addVehicle({ label: 'Another car' });
      repaint();
      const first = document.getElementById('veh_' + v.id + '_company');
      if (first) first.focus();
    }
  });

  // Save on the way out of a box, not on every keystroke.
  panel.addEventListener('change', (ev) => {
    const el = ev.target;
    if (!el.dataset || !el.dataset.vid) return;
    patchVehicle(el.dataset.vid, el.dataset.field, el.value.trim());
    if (el.dataset.field === 'cost') repaint();
  });
}
