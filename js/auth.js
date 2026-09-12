// A front-door gate for the trip page.
//
// ── READ THIS BEFORE YOU TRUST IT ────────────────────────────────────────────
// GitHub Pages serves static files. There is no server, so this check runs
// entirely in the visitor's browser. That means it is a DOORMAT, NOT A LOCK:
//
//   * Anyone can open DevTools and skip the gate in about ten seconds.
//   * Anyone can read this file at
//     https://<you>.github.io/hawaii-26/js/auth.js
//   * The trip data itself is in data/*.js and is readable without logging in.
//
// It is stored as a salted SHA-256 digest rather than plaintext, so the
// passphrase is not sitting in the repo in readable form. That stops casual
// shoulder-surfing. It does NOT stop anyone who actually wants in: a short
// dictionary word falls to a wordlist in seconds, and in any case the check
// itself can simply be bypassed in the console.
//
// So: fine for keeping a link from being idly poked at. Do not put anything
// private behind it, and do not reuse this passphrase anywhere that matters.
// If you need real access control, see the "Real logins" section of README.md.
// ─────────────────────────────────────────────────────────────────────────────

const SALT = 'hawaii26:8f3a91';

// sha256(SALT + ":" + username.toLowerCase().trim() + ":" + passphrase)
const DIGEST = '885b755c1e2f55372c4ddb29aebe5f6f8563e3b5a53d751cb1f5ce015d82324d';

const SESSION_KEY = 'hawaii26:session';

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Recompute the digest for a new credential pair.
 * Run this in the browser console, then paste the result over DIGEST above:
 *   await window.__hawaiiHash('someone', 'their-password')
 */
export async function hashFor(user, pass) {
  return sha256(SALT + ':' + String(user).toLowerCase().trim() + ':' + pass);
}

export async function check(user, pass) {
  if (!user || !pass) return false;
  const got = await hashFor(user, pass);
  // Constant-time-ish compare. Cosmetic here, but costs nothing.
  if (got.length !== DIGEST.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ DIGEST.charCodeAt(i);
  return diff === 0;
}

export function remember(user) {
  try { sessionStorage.setItem(SESSION_KEY, user); } catch (e) { /* private mode */ }
}

export function currentUser() {
  try { return sessionStorage.getItem(SESSION_KEY) || ''; } catch (e) { return ''; }
}

export function signOut() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  location.reload();
}

/**
 * Show the gate and resolve with the username once it is passed.
 * Skips straight through if this tab already signed in.
 */
export function requireSignIn() {
  return new Promise((resolve) => {
    const existing = currentUser();
    const gate = document.getElementById('gate');

    if (existing) {
      gate.hidden = true;
      resolve(existing);
      return;
    }

    const form = document.getElementById('gateForm');
    const userEl = document.getElementById('gateUser');
    const passEl = document.getElementById('gatePass');
    const errEl = document.getElementById('gateErr');

    gate.hidden = false;
    userEl.focus();

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const user = userEl.value.trim();
      const ok = await check(user, passEl.value);
      if (!ok) {
        errEl.textContent = 'That pair does not match. Check the capital letters.';
        errEl.hidden = false;
        passEl.value = '';
        passEl.focus();
        return;
      }
      remember(user);
      gate.hidden = true;
      resolve(user);
    });

    // Exposed so you can generate a digest for a new person without tooling.
    window.__hawaiiHash = hashFor;
  });
}
