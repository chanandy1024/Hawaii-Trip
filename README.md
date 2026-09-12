# Hawai‘i '26

Trip plan for Maui and Honolulu, 20–27 September 2026.
Static site — vanilla ES modules, no build step, no dependencies.

**Live at:** https://chanandy1024.github.io/Hawaii-Trip/

---

## Making a change

`main` is protected: **nothing lands without a review from the repository owner.** So the
loop is a branch and a pull request, not a push to main.

```bash
git switch -c what-im-changing
# ...edit...
git add -A && git commit -m "what changed"
git push -u origin what-im-changing
```

GitHub then offers to open the pull request. Once it is approved and merged, Pages
redeploys from `main` in about a minute. `.github/CODEOWNERS` makes the owner a required
reviewer on every file.

`./deploy.sh "what changed"` still exists for the owner's own direct pushes, which the
protection lets through by bypass. Everyone else goes through a pull request. The files
must stay at the repo root — `index.html` at the top level — and `.nojekyll` must stay
put so the folders are served as-is. All paths are relative, so the project subpath works
unchanged.

---

## Seeing when someone changes something

There is a **Changes** tab. Every edit anyone makes is recorded there — confirmations,
votes, added places, itinerary rewrites, photos, cost entries — with who did it and
when, newest first.

On top of that:

- The tab shows a **red count** of changes from other people you haven't read.
- A **“3 new changes”** button appears next to your name in the header; clicking it jumps to the feed.
- A **toast** pops up the moment someone else's edit arrives: *“Andy made 2 changes”*.
- A **status pill** in the header shows `Synced 2 minutes ago`, `Saving…`, `Sync failed`,
  or `Not shared — this device only`.
- Entries you haven't seen are highlighted and tagged **new** until you open the tab.

The feed keeps the most recent 120 changes and travels with the trip data, so it
survives an Export/Import and is visible to everyone.

**Clear the feed** at the top of the tab empties it for everyone, not just on your device
— it takes two clicks, because it reaches the other person's copy too. Nothing that was
confirmed, voted on or written down is touched; only the record of who did it. New
activity after a clear records normally.

---

## Sharing

Everyone on the site edits one trip. Your edits push as you make them; other people's
arrive within about twelve seconds, or the moment you switch back to the tab.

- Saving sends the whole trip, one request at a time. Saves made while one is in flight
  collapse into a single follow-up carrying the latest state — two overlapping writes can
  land in either order, and the older one winning is how an edit quietly disappears.
- Polling reads only the revision number — a few bytes — and pulls the whole document
  only when that number *differs* from ours. Not "is higher": the revision is a per-device
  counter, so whoever has made the most edits would otherwise never pull anyone else's.
  After a pull that leaves the two sides out of step, the merged result is pushed back so
  both land on the same number.
- Background tabs don't poll; a tab catches up when you switch back to it.
- Merging is additive for confirmations, photos and added items. Votes merge per person,
  keeping whichever vote each individual cast most recently. The itinerary is one document
  so the higher revision wins, and on a tie the copy in front of whoever is typing stays.
  The change feed is a union by event id, so nothing is lost to a merge.

**Export / Import** is the offline path: Export downloads the whole trip including the
change feed, Import merges one back in and reports how many changes arrived.

---

## The sign-in gate

The page asks for a name and passphrase; there are two people on it. **The name is
case-sensitive** — it has to be typed the way it is spelled — and whatever spelling is
registered is the name your edits are signed with, so the change feed and the vote counts
never split one person in two.

That check runs in the visitor's browser, which makes it a courtesy rather than a lock — it keeps the link from being opened by whoever
happens across it, and nothing more. **Anything on this page should be treated as
readable.** Don't put anything private in the trip, and don't reuse the passphrase
anywhere that matters.

---

## Running it locally

ES modules are blocked over `file://`, so **double-clicking `index.html` won't work.**

```bash
./serve.sh          # then open http://localhost:8000
```

or `python3 -m http.server` / `npx serve .`

---

## Structure

```
Hawaii-Trip/
├── index.html              # shell only: gate, tab host, photo bar. No content.
├── css/
│   ├── base.css            # tokens, reset, typography
│   ├── layout.css          # page shell, tab bar, grids, gate
│   └── components.css      # cards, rows, feed, status pill
├── js/
│   ├── app.js              # entry point, tab registry, sync wiring
│   ├── state.js            # the only mutable store; persistence and merge
│   ├── changelog.js        # change events, merge, relative time
│   ├── sync.js             # remote adapter + revision polling
│   ├── auth.js             # sign-in gate
│   ├── util.js             # escaping, sanitising, money parsing, links, toast
│   └── views/
│       ├── shared.js       # thumbnails, confirm button, photo bar
│       ├── overview.js     # highlights, conditions, driving
│       ├── activities.js   # voting, confirm, add
│       ├── stay.js         # hotels with live Booking rates
│       ├── food.js         # fancy / normal / local
│       ├── confirmed.js    # everything booked, refs and totals
│       ├── days.js         # editable itinerary
│       ├── activity.js     # the Changes feed
│       └── book.js         # deadline stack
├── data/                   # pure data — edit these, not the views
│   ├── highlights.js
│   ├── activities.js
│   ├── hotels.js
│   ├── food.js
│   ├── days.js
│   └── photos.js           # photo files + their credits, keyed by card
└── assets/
    └── photos/             # the photos themselves, and CREDITS.md
```

### How a view works

Each view exports `render()` returning an HTML string, and optionally `bind(repaint)`
to attach listeners. `app.js` writes `render()` into the panel, then calls `bind()`.
Nothing keeps DOM references across repaints, so any change is `mutate(); repaint();`.

To add a tab: write the module, add one line to `TABS` in `app.js`, add one empty
`<div role="tabpanel" id="…">` to `index.html`.

**Mutate state only through the exported functions in `state.js`** — `toggleConfirm`,
`setVote`, `setImage`, `addActivity`, `removeRecord`, `touchDays`. They log the change
and push it to the remote. Writing `state.x = y` directly skips the feed, so nobody
else will see it.

**Anything that arrives from the shared copy is untrusted.** Escape it with `esc()`, or
if it genuinely needs to keep its bold, run it through `sanitizeInline()`. The two places
that render stored markup rather than text are itinerary lines and activity notes, and
both are sanitised on the way in and on the way out.

---

## Data notes

- Rates marked **live rate** are Booking.com totals pulled for 20–24 Sep (Maui) and
  24–27 Sep (Honolulu) for two adults, with Booking's review scores.
- Rates marked **estimate** are not quotes. The Four Seasons, Andaz and Ka La‘i are not
  in Booking's inventory — price those direct.
- Totals exclude tax and parking. O‘ahu adds roughly 18.7% to the room and resort fee;
  Hawai‘i's accommodations tax rose to 11% in January 2026.
- Photos ship with the site, in `assets/photos`, listed in `data/photos.js` against the
  card they belong to. They came from Wikimedia Commons under licences that allow reuse
  **with credit**, which is what the credit line under each section is doing — it is
  generated from the `by` and `lic` fields, so if you swap a photo, swap its credit too.
  `assets/photos/CREDITS.md` is the long form. Files are resized to 1000px wide.
- The three Wailea places you found yourself, and the Waikīkī hotels Commons had no
  usable photo of, have empty photo strips. Paste image URLs into them — several at once,
  separated by spaces, and the Stay card turns them into a gallery. Anything pasted is
  stored per slot and syncs with everyone else.
- Photos are only used where the file genuinely shows the subject. Where no photograph of
  a property exists under a reusable licence — the two condos, the Airbnb, and a few of
  the resorts — the card shows the setting instead and **says so on the picture**:
  *“Wailea — the setting, not the property.”* A stock beach passed off as the room you are
  booking would be worse than an empty frame. Same for the two cards captioned with what
  they actually show: Spago inside the Four Seasons, and the Twin Fin under its former
  name.
- Reservation windows (Diamond Head 30 days, Hanauma Bay 48 hours, Haleakalā sunrise
  60 days) change. Verify directly.
