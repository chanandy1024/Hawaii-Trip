// Front-door gate for the trip page.
//
// This runs in the visitor's browser, so it is a courtesy check rather than an
// access control boundary: it keeps a shared link from being opened by whoever
// happens across it. Treat everything this page can reach as readable, and keep
// anything actually private out of the trip.
//
// The credential is kept as a salted SHA-256 digest, never as plaintext.
// Operational notes — rotating it, adding a person — are kept out of the repo.

const SALT = 'hawaii26:8f3a91';

/**
 * One entry per person. `name` is the spelling that has to be typed — exactly,
 * capital included — and is also the name their edits are signed with, so the
 * change feed and the vote tallies never split across "Andy" and "andy".
 *
 * The digest itself is still taken over the lower-cased name, so an existing
 * credential keeps working; the spelling is checked separately.
 */
const ACCOUNTS = [
  { name: 'Xinyu', digest: '885b755c1e2f55372c4ddb29aebe5f6f8563e3b5a53d751cb1f5ce015d82324d' },
  { name: 'Andy', digest: '3d28d67e6bf9db20edfc12625dff5330cd69d23159a7bc15598ca8e0892b2106' }
];

const SESSION_KEY = 'hawaii26:session';

const INSECURE = 'This page can only check a passphrase over https, or on localhost. ' +
  'Open the published site rather than a file or a local IP address.';

/**
 * WebCrypto only exists in a secure context. Served over https or from
 * localhost it is there; over http://192.168.x.x, or from a file:// path, it
 * is not — and every sign-in attempt would throw with nothing on screen.
 */
function canHash() {
  return !!(globalThis.crypto && globalThis.crypto.subtle);
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Digest for a credential pair. See the operational notes for how it is used. */
export async function hashFor(user, pass) {
  return sha256(SALT + ':' + String(user).toLowerCase().trim() + ':' + pass);
}

/**
 * Returns the account's canonical name on success, or '' on failure.
 * The name must be typed as it is spelled in ACCOUNTS — "Xinyu", not "xinyu".
 */
export async function check(user, pass) {
  if (!user || !pass) return '';

  const typed = String(user).trim();
  const account = ACCOUNTS.find((a) => a.name === typed);
  if (!account) return '';

  const got = await hashFor(typed, pass);
  // Constant-time-ish compare. Cosmetic here, but costs nothing.
  if (got.length !== account.digest.length) return '';
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ account.digest.charCodeAt(i);
  return diff === 0 ? account.name : '';
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

    function fail(msg, keepPass) {
      errEl.textContent = msg;
      errEl.hidden = false;
      if (!keepPass) passEl.value = '';
      passEl.focus();
    }

    // Say so up front rather than letting the button appear dead.
    if (!canHash()) fail(INSECURE, true);

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const user = userEl.value.trim();

      let name = '';
      try {
        name = await check(user, passEl.value);
      } catch (e) {
        // Without this the rejection is swallowed and the form just sits there.
        console.error('sign-in check failed', e);
        fail(canHash() ? 'Something went wrong checking that — see the browser console.' : INSECURE,
          true);
        return;
      }

      if (!name) {
        fail('That pair does not match. The name is case-sensitive too.');
        return;
      }
      // Sign in under the canonical spelling, whatever case was typed around it.
      remember(name);
      gate.hidden = true;
      resolve(name);
    });
  });
}
