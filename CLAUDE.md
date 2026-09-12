# CLAUDE.md

Trip planner for Maui and Honolulu, 20–27 September 2026. Static site on GitHub Pages:
vanilla ES modules, no build step, no dependencies, no framework.

**This file is committed, and the repo is public.** Never write endpoints, database rules,
credentials or digests here, in the README, or in code comments. Those live in
`OPERATIONS.local.md`, which `.gitignore` excludes. If you find yourself documenting how
the app is configured, put it there instead.

## Running it

```bash
./serve.sh          # http://localhost:8000
```

ES modules do not load over `file://`, so opening `index.html` directly will not work.
Deploy with `./deploy.sh "message"`; Pages redeploys in about a minute.

## Shape of it

- `index.html` — shell only: gate, eight empty tab panels, photo bar. No content.
- `data/*.js` — plain arrays and objects. **Edit these, not the views**, for anything
  about hotels, activities, food, highlights, the default itinerary, or photos.
- `js/views/*.js` — one module per tab. Each exports `render()` returning an HTML string
  and optionally `bind(repaint)`. `app.js` writes the string into the panel, then binds.
- `js/state.js` — the only mutable store, plus persistence and merge.
- `js/sync.js` — remote adapter and revision polling.

Nothing holds DOM references across repaints. Every change is `mutate(); repaint();`.
To add a tab: write the module, add one line to `TABS` in `app.js`, add one empty
`<div role="tabpanel" id="…">` to `index.html`.

## Rules that are easy to break

**Mutate state only through the exported functions in `state.js`** — `toggleConfirm`,
`setVote`, `setImage`, `addActivity`, `addFood`, `removeRecord`, `touchDays`, `clearLog`. They log the
change to the feed and push it. `state.x = y` skips both, so nobody else ever sees it.

**Treat everything from the shared copy as untrusted input.** It is a shared document that
anyone who can reach the database can write. Escape with `esc()`. Only two places render
stored markup rather than text — itinerary lines and activity notes — and both go through
`sanitizeInline()`, which keeps `<b>/<i>/<em>/<strong>/<br>` and flattens the rest. If you
add a third such place, sanitise it on write *and* on render, and extend
`scratch/hostile` coverage (see Testing).

**Photo credits are a licence condition, not decoration.** `data/photos.js` pairs every
file with `by`, `lic` and `page`, and the credit lines are generated from those fields.
Swap a photo, swap its credit. Never put a generic stock photo on a specific hotel card.

**Don't let a merge silently drop things.** `mergeIn()` is additive. A union cannot express
a deletion, which is why a cleared vote is stored as `{ dir: null, at }` rather than by
removing the key — without the tombstone it comes back on the next sync. Clearing the
change feed has the same problem and the same shape of answer: `logClearedAt` is a
watermark every copy applies, not a delete. Any future "remove this" needs to be expressed
as state that survives a union, or it will come back.

**A photo that is not of the thing must say so.** Entries in `data/photos.js` carry an
optional `area` (the setting — the card captions it) or `note`. Never drop a generic photo
into a card to fill the frame without one.

## Sync, and the ways it has bitten

- Saves send the whole document. Only one request is in flight at a time and saves made
  during a push collapse into one follow-up — two overlapping writes can land in either
  order, and the older one winning is how an edit disappears.
- `rev` is a **per-device counter, not a shared sequence.** Polling pulls when the remote
  number *differs* from ours, never when it is merely higher; after a mismatched pull the
  merged result is pushed back so both sides converge.
- The REST endpoint answers `204` with an empty body on a silent write. `res.json()`
  throws on that, which once made every successful save report "Sync failed".
- Votes are `votes[id] = { person: { dir, at } }` and merge per person, latest wins.
  Anything that assumes one vote per item is stale.
- Sign-in names are case-sensitive and canonical: `check()` returns the spelling from
  `ACCOUNTS`, and that is what edits are signed with. Don't reintroduce a path that stores
  whatever case was typed — it splits one person across two names in the feed and tallies.

## Security model

There is no server. The sign-in gate runs in the visitor's browser and is a courtesy, not
a boundary; everything the page can reach is readable. Real access control lives in the
database rules. Assume `data/`, the change feed (which carries the names people sign in
with) and any pasted photo URL are world-readable, and keep anything private out.

## Testing

There is no test runner in the repo. Drive the real modules from a scratch directory
outside it: copy `js/` and `data/` somewhere with a `{"type":"module"}` package.json, stub
`document`/`localStorage`, and import. That has been enough to catch every real bug so
far. Worth re-running after touching state, sync, or anything that renders stored text:

- boot the real `app.js` against the real `index.html` in jsdom, switch tabs a few times,
  then click each control **once** and assert exactly one feed entry per click. Views bind
  delegated listeners to the panel on every paint, so anything that lets the panel node
  survive a repaint makes listeners stack — one click fires two handlers, then four, and a
  vote toggled twice looks like a dead button. `paintPanel()` swaps in a fresh node to
  prevent it;
- render all eight tabs and assert no `undefined` leaks into the markup;
- merge a deliberately poisoned snapshot (script tags, `onerror`, `javascript:` URLs) and
  assert nothing executable survives into the DOM;
- two simulated clients against a scratch document, checking they converge;
- vote merges: two people, disagreement, a clear surviving a merge, one person on two
  devices counting once.

If you test against the live database, use the real trip document (rules are scoped to it,
so side paths are refused), and **clear what you wrote afterwards** — Export first if it
holds anything real.
