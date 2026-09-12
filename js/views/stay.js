// Stay: hotel cards with live Booking.com rates where available.

import { HOTELS } from '../../data/hotels.js';
import { toggleConfirm, isConfirmed } from '../state.js';
import { esc, tagOf, mapsUrl, picsUrl, parseMoney } from '../util.js';
import { thumb, confirmBtn } from './shared.js';

/** Just the property records, skipping the section-heading entries. */
export function allHotels() {
  return HOTELS.filter((h) => !h.sec);
}

export function findHotel(id) {
  return allHotels().find((h) => h.id === id);
}

const SRC_LABEL = { live: 'live rate', est: 'estimate', yours: 'your figure' };

function card(h) {
  const conf = isConfirmed(h.id);
  const srcTxt = SRC_LABEL[h.src] || 'estimate';
  const srcCls = h.src === 'live' ? 'src live' : 'src';

  const rev = h.score
    ? '<p class="rev"><span class="sc">' + esc(h.score) + '</span> Booking.com · ' +
      esc(h.reviews) + ' reviews</p>'
    : '';

  return '<div class="stay' + (conf ? ' is-conf' : '') + '" data-id="' + esc(h.id) + '">' +
    '<div class="stay-head">' +
      thumb('h_' + h.id, h.e, h.t, 't120', h.q) +
      '<div class="stay-rest">' +
        '<div class="stay-top"><h4>' + esc(h.name) + tagOf(h.tag) + '</h4>' +
        '<p class="specs">' + esc(h.specs) + '</p></div>' +
        '<p class="hood">' + esc(h.hood) + '</p>' +
        rev +
        '<p class="money"><b>' + esc(h.total) + '</b> total · <i>' + esc(h.night) +
          '</i>/night · <i>' + esc(h.pp) + '</i>/person at 2' +
          '<span class="' + srcCls + '">' + srcTxt + '</span></p>' +
      '</div>' +
    '</div>' +
    '<ul class="bul">' + h.bul.map((b) => '<li>' + b + '</li>').join('') + '</ul>' +
    '<a class="btn" href="' + esc(h.link || mapsUrl(h.q)) + '" target="_blank" rel="noopener">' +
      esc(h.linkTxt) + '</a>' +
    '<a class="btn ghost" href="' + esc(mapsUrl(h.q)) + '" target="_blank" rel="noopener">Map ↗</a>' +
    '<a class="btn ghost" href="' + esc(picsUrl(h.q)) + '" target="_blank" rel="noopener">Photos ↗</a>' +
    confirmBtn(h.id) +
    '</div>';
}

export function render() {
  let out = '<p class="lede">Confirm the one you book and it moves to the Confirmed tab with a ' +
    'field for the reservation reference.</p>';
  let first = true;

  HOTELS.forEach((h) => {
    if (h.sec) {
      out += '<h3' + (first ? ' class="first"' : '') + '>' + esc(h.sec) + '</h3>' +
        '<p class="lede">' + h.lede + '</p>';
      first = false;
      return;
    }
    out += card(h);
  });

  return out;
}

export function bind(repaint) {
  const panel = document.getElementById('stay');
  if (!panel) return;

  panel.addEventListener('click', (ev) => {
    const cb = ev.target.closest('[data-confirm]');
    if (!cb) return;
    const id = cb.dataset.confirm;
    const h = findHotel(id);
    toggleConfirm(id, 'stay', { cost: parseMoney(h && h.total) }, h && h.name);
    repaint();
  });
}
