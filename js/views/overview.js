// Overview: highlight cards, climate stats, driving notes.

import { HIGHLIGHTS } from '../../data/highlights.js';
import { state, save } from '../state.js';
import { thumb, credits } from './shared.js';

const STATS = [
  { k: 'Ocean', f: '80–81°F', c: '27°C', s: 'Warmest water of the year', cls: 'hero' },
  { k: 'Day high', f: '86–89°F', c: '30–32°C', s: 'Wailea is the sunniest' },
  { k: 'Night low', f: '72–75°F', c: '22–24°C', s: 'Never needs a jacket' },
  { k: 'Sunset', v: '~6:25 PM', s: 'Earlier daily — book dinner early', cls: 'tint' },
  { k: 'Rain', v: '20–30%', s: 'Brief, mostly windward' },
  { k: 'Summit at dawn', f: '40°F', c: '4°C', s: 'Haleakalā — pack real layers' },
  { k: 'UV', v: 'High', s: 'Reef-safe sunscreen only, by law' },
  { k: 'Hurricane risk', v: 'Elevated', s: 'September is the statistical peak', cls: 'tint' }
];

const DRIVING = [
  { k: 'Maui', v: 'Essential', s: 'Hāna, Haleakalā and Waiheʻe are unreachable without one' },
  { k: 'Oʻahu parking', v: '$55–80', s: 'Per night at the Waikīkī hotels, on top of the room' },
  { k: 'Park entry', v: '$30', s: 'Per car, covers Haleakalā summit and Kīpahulu for 3 days' }
];

function statCard(s) {
  const val = s.f
    ? '<span data-f="' + s.f + '" data-c="' + s.c + '">' + (state.unit === 'c' ? s.c : s.f) + '</span>'
    : s.v;
  return '<div class="stat' + (s.cls ? ' ' + s.cls : '') + '">' +
    '<p class="k">' + s.k + '</p><p class="v">' + val + '</p><p class="s">' + s.s + '</p></div>';
}

export function render() {
  const hl = HIGHLIGHTS.map((x) =>
    '<div class="hl' + (x.wide ? ' wide' : '') + '">' +
    thumb(x.k, x.e, x.t, 't62', x.q) +
    '<p>' + x.h + '</p></div>'
  ).join('');

  return '<h2>Highlights</h2><div class="hl-grid">' + hl + '</div>' +
    credits(HIGHLIGHTS.map((x) => x.k)) +

    '<div class="cond-head"><h2>Conditions, late September</h2>' +
    '<div class="seg" id="unitSeg">' +
    '<button data-u="f" aria-pressed="' + (state.unit !== 'c') + '">°F</button>' +
    '<button data-u="c" aria-pressed="' + (state.unit === 'c') + '">°C</button>' +
    '</div></div>' +
    '<div class="stats">' + STATS.map(statCard).join('') + '</div>' +
    '<p class="credits">Climate normals, not a forecast. Hurricane Lowell passed just west of ' +
    'Kauaʻi on 8 September and the 2026 Central Pacific season was forecast above normal — ' +
    'nothing is currently threatening your dates, but book refundable where you can.</p>' +

    '<h3>Driving both islands</h3>' +
    '<div class="stats">' + DRIVING.map(statCard).join('') + '</div>' +
    '<p class="credits">Collect at Kahului (OGG) on arrival. On Oʻahu the car earns its keep for ' +
    'Lanikai, Kualoa and the North Shore but costs $55–80 a night parked at the hotel, so price a ' +
    'two-day rental against the full three. New for 2026: Kamaʻole Beach Parks I–III in South Maui ' +
    'charge $10 a day for non-resident parking. Hanauma Bay parking is $3 cash and the lot fills ' +
    'before your entry slot; Diamond Head is $10 a vehicle; and the Lanikai trailhead is a ' +
    'residential street where illegal parking gets ticketed — take a rideshare for that one.</p>';
}

/** Wire the °F/°C toggle. Called after each paint. */
export function bind(repaint) {
  const seg = document.getElementById('unitSeg');
  if (!seg) return;
  seg.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-u]');
    if (!btn) return;
    state.unit = btn.dataset.u;
    save({ silent: true }); // a local display preference, not a trip edit
    repaint();
  });
}
