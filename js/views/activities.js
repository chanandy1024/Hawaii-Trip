// Activities: grouped rows with voting, a confirm toggle, and an add form.

import { ACTIVITIES, ACTIVITY_GROUPS } from '../../data/activities.js';
import { state, addActivity, removeRecord, toggleConfirm, isConfirmed, setVote }
  from '../state.js';
import { esc, tagOf, parseMoney } from '../util.js';
import { thumb, confirmBtn } from './shared.js';

/** Built-ins plus user additions, minus anything removed. */
export function allActivities() {
  return ACTIVITIES.concat(state.addActs).filter((a) => !state.hidden[a.id]);
}

export function findActivity(id) {
  return allActivities().find((a) => a.id === id);
}

function card(a) {
  const vote = state.votes[a.id] || null;
  const conf = isConfirmed(a.id);

  return '<div class="act' + (conf ? ' is-conf' : '') + '" data-id="' + esc(a.id) + '">' +
    '<div class="act-main">' +
      thumb('a_' + a.id, a.e || '📍', a.t, 't84', a.q || a.title) +
      '<div class="act-body">' +
        '<p class="where">' + esc(a.where || '') + '</p>' +
        '<p class="title">' + esc(a.title) + tagOf(a.tag) + '</p>' +
        '<p class="facts">' + esc(a.facts || '') + '</p>' +
      '</div>' +
    '</div>' +
    '<div class="act-side">' +
      '<p class="when">' + esc(a.when || '') + '</p>' +
      '<p class="cost">' + esc(a.cost || '') + '</p>' +
      '<div class="votes">' +
        '<button class="vote" data-v="up" aria-pressed="' + (vote === 'up') + '">👍 <span>' +
          (vote === 'up' ? 1 : 0) + '</span></button>' +
        '<button class="vote" data-v="down" aria-pressed="' + (vote === 'down') + '">👎 <span>' +
          (vote === 'down' ? 1 : 0) + '</span></button>' +
      '</div>' +
      confirmBtn(a.id) +
      '<div class="mini">' +
        (a.more ? '<button class="det">details ▾</button>' : '') +
        '<button class="kill">remove</button>' +
      '</div>' +
    '</div>' +
    (a.more ? '<div class="more" hidden>' + a.more + '</div>' : '') +
    '</div>';
}

export function render() {
  const list = allActivities();
  let out = '<p class="lede">Nothing here is a schedule — vote for what you want, then hit ' +
    'Confirm once it is actually booked and it moves to the Confirmed tab. Click the ＋ on any ' +
    'photo to drop in an image.</p><div id="actList">';

  let first = true;
  ACTIVITY_GROUPS.forEach((g) => {
    const rows = list.filter((a) => a.isle === g.isle && a.grp === g.grp);
    if (!rows.length) return;
    out += '<h3' + (first ? ' class="first"' : '') + '>' + esc(g.h) + '</h3>' + rows.map(card).join('');
    first = false;
  });

  const mine = list.filter((a) => a.grp === 'yours');
  if (mine.length) out += '<h3>Added by you</h3>' + mine.map(card).join('');

  out += '</div>' +
    '<button class="toggleAdd" data-toggle="addAct" data-label="Add an activity">＋ Add an activity</button>' +
    '<div class="adder" id="addAct" hidden>' +
      '<h4>Add an activity</h4>' +
      '<div class="fields">' +
        '<input id="aTitle" placeholder="What is it?">' +
        '<input id="aWhere" placeholder="Where — e.g. Kīhei">' +
        '<input id="aCost" placeholder="Cost — e.g. $90">' +
        '<input id="aWhen" placeholder="When — e.g. Fri morning">' +
        '<select id="aIsle"><option value="maui">Maui</option><option value="oahu">Oʻahu</option></select>' +
        '<input id="aFacts" placeholder="Quick facts line">' +
      '</div>' +
      '<textarea id="aMore" placeholder="Notes (optional)"></textarea>' +
      '<button class="go" id="aGo">Add it</button>' +
    '</div>';

  return out;
}

export function bind(repaint) {
  const panel = document.getElementById('activities');
  if (!panel) return;

  panel.addEventListener('click', (ev) => {
    const t = ev.target;

    const vb = t.closest('.vote');
    if (vb) {
      const id = vb.closest('.act').dataset.id;
      const a = findActivity(id);
      setVote(id, vb.dataset.v, a && a.title);
      repaint();
      return;
    }

    const cb = t.closest('[data-confirm]');
    if (cb) {
      const id = cb.dataset.confirm;
      const a = findActivity(id);
      toggleConfirm(id, 'activity', { when: a && a.when, cost: parseMoney(a && a.cost) },
        a && a.title);
      repaint();
      return;
    }

    const db = t.closest('.det');
    if (db) {
      const more = db.closest('.act').querySelector('.more');
      more.hidden = !more.hidden;
      db.textContent = more.hidden ? 'details ▾' : 'details ▴';
      return;
    }

    const kb = t.closest('.kill');
    if (kb) {
      const id = kb.closest('.act').dataset.id;
      const a = findActivity(id);
      removeRecord(id, a && a.title);
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

    if (t.id === 'aGo') {
      const title = document.getElementById('aTitle').value.trim();
      if (!title) { document.getElementById('aTitle').focus(); return; }
      addActivity({
        title,
        where: document.getElementById('aWhere').value.trim(),
        facts: document.getElementById('aFacts').value.trim(),
        cost: document.getElementById('aCost').value.trim(),
        when: document.getElementById('aWhen').value.trim(),
        isle: document.getElementById('aIsle').value,
        more: esc(document.getElementById('aMore').value.trim()),
        q: title
      });
      repaint();
    }
  });
}
