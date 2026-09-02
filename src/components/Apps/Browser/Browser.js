import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getImagePath } from '../../../utils/assetPaths';
import { codriverDemoUrl, codriverEnv, isCodriverDemoUrl } from '../../../config/codriver';
import './Browser.css';

// The web view of the car's Browser app.
//
// It opens on codriver's demo mode (ALL-25) rather than a blank page: the whole
// point of a browser inside a simulated Tesla is to show what a driver would
// actually run in the car's browser.
//
// Two things a real browser does that a cross-origin iframe cannot:
//
//   - **Report where it is.** Reading `iframe.contentWindow.location` across
//     origins throws, so the address bar shows the URL we asked for, not the
//     one the page ended up on after its own redirects.
//   - **Go back.** `contentWindow.history` is cross-origin too. Back/forward
//     therefore walk OUR stack of addresses — the ones typed here or opened
//     from a shortcut — which is honest about what it can promise.
//
// No `sandbox` attribute: codriver needs scripts, its own origin and its own
// storage, and `allow-scripts allow-same-origin` together are worth exactly as
// much as no sandbox at all. The isolation that matters is the origin boundary.

// How long the codriver demo gets to say hello before the web view concludes it
// was never allowed to load. Generous: it covers a cold start and a slow link.
const HANDSHAKE_MS = 12000;

// Nothing in the page can tell a loaded cross-origin frame from one the browser
// REFUSED to frame. Chrome fires `load` for both and throws SecurityError on
// `contentWindow.location` for both; the refusal is written to the browser's
// own console and nowhere a script can reach. (Both halves verified against a
// live X-Frame-Options: DENY, after an earlier cut of this file guessed wrong
// on each in turn.)
//
// So the demo page announces itself instead — `postMessage({codriverDemo:'ready'})`
// from public/demo.js — and silence is the answer. That only works for a page
// that agreed to answer, so the timer is armed for the codriver demo alone; any
// other site is left to render however it renders.
function isDemoReady(event, frame) {
  return event.source === frame?.contentWindow && event.data?.codriverDemo === 'ready';
}

const SHORTCUTS = [
  { label: 'codriver demo', url: codriverDemoUrl() },
  { label: 'Wikipedia', url: 'https://en.m.wikipedia.org/' },
];

/** Turn whatever was typed into the address bar into something loadable. */
function normalizeUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function Browser() {
  const home = codriverDemoUrl();
  // `history` is the addresses this web view has been sent to; `cursor` is
  // where back/forward currently sit inside it.
  const [history, setHistory] = useState([home]);
  const [cursor, setCursor] = useState(0);
  const [draft, setDraft] = useState(home);
  const [isLoading, setIsLoading] = useState(true);
  // Bumped to force a remount of the iframe — the only way to reload a
  // cross-origin frame, since `contentWindow.location.reload()` throws.
  const [loadToken, setLoadToken] = useState(0);
  const [isRefused, setIsRefused] = useState(false);
  const hintTimer = useRef(null);
  const frameRef = useRef(null);

  const url = history[cursor];

  const navigate = useCallback((next) => {
    setHistory((prev) => [...prev.slice(0, cursor + 1), next]);
    setCursor((prev) => prev + 1);
  }, [cursor]);

  // One handshake window per navigation, armed only where a handshake is owed.
  useEffect(() => {
    setIsLoading(true);
    setIsRefused(false);
    setDraft(url);
    if (!isCodriverDemoUrl(url)) return undefined;

    const onMessage = (event) => {
      if (!isDemoReady(event, frameRef.current)) return;
      clearTimeout(hintTimer.current);
      setIsRefused(false);
    };
    window.addEventListener('message', onMessage);
    hintTimer.current = setTimeout(() => setIsRefused(true), HANDSHAKE_MS);
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(hintTimer.current);
    };
  }, [url, loadToken]);

  // `load` fires on a refused frame too, so this only stops the spinner.
  const handleFrameLoad = () => setIsLoading(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = normalizeUrl(draft);
    if (next && next !== url) navigate(next);
    else setLoadToken((n) => n + 1);
    event.target.querySelector('input')?.blur();
  };

  const goBack = () => cursor > 0 && setCursor(cursor - 1);
  const goForward = () => cursor < history.length - 1 && setCursor(cursor + 1);
  const goHome = () => (url === home ? setLoadToken((n) => n + 1) : navigate(home));

  return (
    <div className="browser">
      <div className="browserChrome">
        <div className="browserNavButtons no-select">
          <button
            type="button"
            className="browserBtn"
            onClick={goBack}
            disabled={cursor === 0}
            aria-label="Back"
          >
            &#8249;
          </button>
          <button
            type="button"
            className="browserBtn"
            onClick={goForward}
            disabled={cursor === history.length - 1}
            aria-label="Forward"
          >
            &#8250;
          </button>
          <button
            type="button"
            className="browserBtn"
            onClick={() => setLoadToken((n) => n + 1)}
            aria-label="Reload"
          >
            &#8635;
          </button>
          <button type="button" className="browserBtn" onClick={goHome} aria-label="Home">
            &#8962;
          </button>
        </div>
        <form className="browserAddressForm" onSubmit={handleSubmit}>
          <input
            className="browserAddress"
            type="text"
            value={draft}
            spellCheck="false"
            autoComplete="off"
            aria-label="Address"
            onChange={(event) => setDraft(event.target.value)}
            onFocus={(event) => event.target.select()}
          />
          {isLoading && <span className="browserSpinner" aria-label="Loading" />}
        </form>
        <div className="browserShortcuts no-select">
          {SHORTCUTS.map((shortcut) => (
            <button
              type="button"
              key={shortcut.url}
              className={`browserShortcut ${url === shortcut.url ? 'active' : ''}`}
              onClick={() => (url === shortcut.url ? setLoadToken((n) => n + 1) : navigate(shortcut.url))}
            >
              {shortcut.label}
            </button>
          ))}
        </div>
      </div>

      <div className="browserViewport">
        <iframe
          ref={frameRef}
          // Remounts on reload; `src` alone would not re-fetch a same URL.
          key={`${url}#${loadToken}`}
          className="browserFrame"
          title="Browser"
          src={url}
          onLoad={handleFrameLoad}
          allow="geolocation; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {isRefused && (
          <div className="browserBlankHint">
            <img src={getImagePath('app-browser.svg')} alt="" />
            <h3>This page refused to be framed</h3>
            <p>
              The demo at <code>{url}</code> never reported in. A site that sends
              <code>X-Frame-Options: DENY</code> or <code>frame-ancestors 'none'</code>
              renders blank in a web view, and says why in the browser console only.
            </p>
            <p className="browserBlankHintFix">
              For codriver ({codriverEnv()}), set <code>DEMO_FRAME_ANCESTORS</code> on the
              server to an allowlist containing <code>{window.location.origin}</code>.
            </p>
            <div className="browserBlankHintActions">
              <button type="button" className="browserBtn wide" onClick={() => setIsRefused(false)}>
                Dismiss
              </button>
              <a className="browserBtn wide" href={url} target="_blank" rel="noreferrer">
                Open in a new tab
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
