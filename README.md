# Hawai‘i '26

Trip plan for Maui and Honolulu, 20–27 September 2026.
Static site — vanilla ES modules, no build step, no dependencies.

**Live at:** https://chanandy1024.github.io/Hawaii-Trip/

---

## 1. Put it on GitHub Pages

From inside this folder:

```bash
git init
git add .
git commit -m "Hawai'i '26 trip plan"
git branch -M main
git remote add origin https://github.com/chanandy1024/Hawaii-Trip.git
git push -u origin main
```

Then in the repo on github.com:

**Settings → Pages → Source: “Deploy from a branch” → Branch `main`, folder `/ (root)` → Save**

Give it a minute, then open <https://chanandy1024.github.io/Hawaii-Trip/>.

Notes:
- The files must sit at the **repo root** — `index.html` at the top level, not inside a subfolder.
- `.nojekyll` is included so GitHub doesn't run Jekyll over the folders.
- All paths are relative, so serving from the `/Hawaii-Trip/` subpath works with no changes.
- The URL is case-sensitive: `Hawaii-Trip`, not `hawaii-trip`.

To update later: `git add -A && git commit -m "..." && git push`. Pages redeploys in about a minute.

---

## 2. Seeing when someone changes something

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
survives an Export/Import and is visible to everyone once sharing is on.

**The feed works immediately. Actually receiving other people's changes needs step 3.**

---

## 3. Turning on sharing

GitHub Pages only serves files — there is no server, so there is nowhere for a shared
copy of the trip to live. Until you do this, each browser keeps its own plan and the
status pill reads *“Not shared”*.

### Option A — Firebase Realtime Database (recommended, ~10 minutes, free)

1. Go to <https://console.firebase.google.com> and create a project.
2. **Build → Realtime Database → Create Database.** Pick any region.
   Choose **“Start in test mode”**.
3. Copy the database URL it shows — it looks like
   `https://hawaii-trip-default-rtdb.firebaseio.com`
4. Open `js/sync.js` and set the two values at the top:

   ```js
   const MODE = 'firebase';
   const DATABASE_URL = 'https://hawaii-trip-default-rtdb.firebaseio.com';
   ```

5. Back in Firebase: **Realtime Database → Rules**, paste this, press **Publish**:

   ```json
   {
     "rules": {
       "trips": {
         "hawaii-2026": {
           ".read": true,
           ".write": true
         }
       }
     }
   }
   ```

6. `git add -A && git commit -m "Turn on sharing" && git push`

Everyone on the site now shares one plan. The page checks for changes every 12 seconds.

**Be clear-eyed about those rules.** They let anyone who knows the database URL read
and overwrite the trip, and that URL ships in `js/sync.js` on a public site. For a trip
plan that is usually an acceptable trade; it is not private. To do better, enable
Firebase **Anonymous Authentication** and use `".write": "auth != null"`, which is real
authentication — unlike the sign-in gate described below.

The `DATABASE_URL` itself is not a secret. It identifies the project; Firebase expects
it to be public. All access control lives in those rules, which is why step 5 matters.

#### How the syncing works

- Saving does a `PUT` of the whole trip to `/trips/hawaii-2026.json`.
- Polling does a `GET` of just `/rev.json` — a single number, a few bytes — and only
  pulls the full document when that number has moved. A quiet trip costs almost nothing,
  so the free tier is fine.
- Background tabs don't poll; a tab catches up the moment you switch back to it.
- Merging is additive for confirmations, votes, photos and added items. The itinerary is
  one document, so the higher revision wins. The change feed is a union by event id, so
  nothing is ever lost to a merge.

### Option B — pass a file around (zero setup)

**Export** downloads `hawaii-2026-trip.json` with everything including the change feed.
The other person hits **Import** and it merges, reporting how many changes came in.
Fine for two people who talk to each other.

### Option C — everyone commits

Add collaborators under **Settings → Collaborators**. They edit `data/*.js` and push.
Version-controlled, no runtime service, but not live and everyone needs Git.

---

## 4. The sign-in gate

`js/auth.js` checks a name and passphrase against a salted SHA-256 digest.
The credentials are **Xinyu** / the passphrase you chose.

**This is a doormat, not a lock.** The check runs in the visitor's browser because
there is no server. Anyone can open DevTools and step around it in seconds, `auth.js`
is readable at `/js/auth.js`, and everything in `data/` is served whether or not you
sign in. Storing a digest rather than plaintext means the passphrase isn't sitting in
the repo in readable form — that stops idle curiosity and nothing more.

Fine for keeping a shared link from being poked at. Don't put anything private behind
it, and don't reuse that passphrase anywhere that matters.

### Adding another person

In the browser console on the live site:

```js
await window.__hawaiiHash('andy', 'some-passphrase')
```

Paste the result over `DIGEST` in `js/auth.js`. For several people, make `DIGEST` an
array and check for membership.

### If you want a real login

- **Netlify** or **Cloudflare Pages** — password protection at the edge, free tier.
- **Cloudflare Access** — email-link sign-in in front of the whole site.
- **Firebase Auth** — real accounts, pairs with Option A above.

GitHub Pages has no access control for public repos. Private repos can serve Pages on
paid plans, but the published site is still public.

---

## 5. Running it locally

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
│   ├── sync.js             # Firebase REST adapter + revision polling
│   ├── auth.js             # sign-in gate (read the comment at the top)
│   ├── util.js             # esc, money parsing, links, toast
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
│   └── days.js
└── assets/                 # local photos, if you stop using URLs
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

---

## Data notes

- Rates marked **live rate** are Booking.com totals pulled for 20–24 Sep (Maui) and
  24–27 Sep (Honolulu) for two adults, with Booking's review scores.
- Rates marked **estimate** are not quotes. The Four Seasons, Andaz and Ka La‘i are not
  in Booking's inventory — price those direct.
- Totals exclude tax and parking. O‘ahu adds roughly 18.7% to the room and resort fee;
  Hawai‘i's accommodations tax rose to 11% in January 2026.
- Photo slots take any image URL. Nothing is bundled — no per-property images were
  available under a licence that allowed redistribution.
- Reservation windows (Diamond Head 30 days, Hanauma Bay 48 hours, Haleakalā sunrise
  60 days) change. Verify directly.
