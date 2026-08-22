import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './Browser.css';
import {
  BOOKMARKS,
  DEMO_SCREENS,
  HOME_URL,
  LOAD_TIME_MS,
  displayUrl,
  normaliseInput,
} from '../../../config/browserConfig';
import {
  AddFavoriteIcon,
  AddedFavoriteIcon,
  BackIcon,
  CloseIcon,
  CollapseIcon,
  ExpandIcon,
  FavoritesIcon,
  ForwardIcon,
  LockIcon,
  RefreshIcon,
  StopIcon,
} from './BrowserIcons';

/**
 * The car's web browser.
 *
 * Chrome layout follows the asset set the firmware ships in
 * /usr/tesla/UI/assets/day/web/: 60x60 icon buttons for back / forward /
 * reload / stop / add-favourite / favourites, and a 44px-tall address field
 * that doubles as the loading indicator (the car has a dedicated
 * `text_field_loading_background.png` for exactly that).
 *
 * Everything is authored at those native pixel sizes and scaled by
 * `--wb-scale`, which is recalculated from the panel width, so the chrome
 * keeps the right proportions whether it is sharing the screen with the car
 * card or expanded to fill it for a recording.
 */

const isVideo = (src) => /\.(mp4|webm|mov)$/i.test(src || '');

export const Browser = ({ expanded = false, onToggleExpand, onClose, initialUrl }) => {
  const startUrl = initialUrl || HOME_URL;

  const [history, setHistory] = useState([startUrl]);
  const [cursor, setCursor] = useState(0);
  const [draft, setDraft] = useState(displayUrl(startUrl));
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [saved, setSaved] = useState([]);
  const [mode, setMode] = useState('live'); // 'live' | 'screens'
  const [step, setStep] = useState(0);
  const [hint, setHint] = useState(true);

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const loadTimer = useRef(null);

  const url = history[cursor];
  const canGoBack = cursor > 0;
  const canGoForward = cursor < history.length - 1;
  const isSaved = saved.includes(url);

  /* Keep the Tesla-native pixel sizes correct at any panel width. The real
     browser panel is ~1180px wide on a 1920x1200 centre display. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) el.style.setProperty('--wb-scale', String(w / 1180));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => clearTimeout(loadTimer.current), []);

  const beginLoad = useCallback(() => {
    clearTimeout(loadTimer.current);
    setLoading(true);
    loadTimer.current = setTimeout(() => setLoading(false), LOAD_TIME_MS);
  }, []);

  const go = useCallback(
    (next) => {
      if (!next) return;
      setHistory((prev) => [...prev.slice(0, cursor + 1), next]);
      setCursor((c) => c + 1);
      setDraft(displayUrl(next));
      setEditing(false);
      setShowFavorites(false);
      beginLoad();
    },
    [cursor, beginLoad]
  );

  const back = () => {
    if (!canGoBack) return;
    const next = cursor - 1;
    setCursor(next);
    setDraft(displayUrl(history[next]));
    beginLoad();
  };

  const forward = () => {
    if (!canGoForward) return;
    const next = cursor + 1;
    setCursor(next);
    setDraft(displayUrl(history[next]));
    beginLoad();
  };

  const reload = () => {
    if (loading) {
      clearTimeout(loadTimer.current);
      setLoading(false);
      return;
    }
    beginLoad();
  };

  const submit = (event) => {
    event.preventDefault();
    const next = normaliseInput(draft);
    if (next === url) {
      setEditing(false);
      inputRef.current?.blur();
      beginLoad();
      return;
    }
    go(next);
    inputRef.current?.blur();
  };

  const toggleSaved = () => {
    setSaved((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
  };

  const screens = DEMO_SCREENS.length ? DEMO_SCREENS : [];
  const current = screens[Math.min(step, Math.max(screens.length - 1, 0))];

  /* In screens mode the address bar tracks the scripted step. */
  useEffect(() => {
    if (mode === 'screens' && current?.url) setDraft(displayUrl(current.url));
  }, [mode, step, current]);

  const stepBy = useCallback(
    (delta) => {
      setStep((s) => Math.min(Math.max(s + delta, 0), Math.max(screens.length - 1, 0)));
      beginLoad();
    },
    [screens.length, beginLoad]
  );

  useEffect(() => {
    if (mode !== 'screens') return undefined;
    const onKey = (e) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') stepBy(1);
      if (e.key === 'ArrowLeft') stepBy(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, stepBy]);

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 9000);
    return () => clearTimeout(t);
  }, []);

  const favoriteTiles = useMemo(
    () => [...BOOKMARKS, ...saved.filter((u) => !BOOKMARKS.some((b) => b.url === u)).map((u) => ({ label: displayUrl(u), url: u }))],
    [saved]
  );

  return (
    <div className={`teslaBrowser${expanded ? ' expanded' : ''}`} ref={rootRef}>
      <div className="wbToolbar">
        <button className="wbIcon" onClick={back} disabled={!canGoBack} aria-label="Back">
          <BackIcon />
        </button>
        <button className="wbIcon" onClick={forward} disabled={!canGoForward} aria-label="Forward">
          <ForwardIcon />
        </button>
        <button className="wbIcon" onClick={reload} aria-label={loading ? 'Stop' : 'Reload'}>
          {loading ? <StopIcon /> : <RefreshIcon />}
        </button>

        <form className={`wbAddress${editing ? ' editing' : ''}`} onSubmit={submit}>
          <div className={`wbProgress${loading ? ' running' : ''}`} />
          {!editing && url.startsWith('https://') && (
            <span className="wbLock">
              <LockIcon />
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            value={draft}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => {
              setEditing(true);
              e.target.select();
            }}
            onBlur={() => {
              setEditing(false);
              setDraft(displayUrl(url));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setDraft(displayUrl(url));
                inputRef.current?.blur();
              }
            }}
            aria-label="Address"
          />
        </form>

        <button
          className={`wbIcon${isSaved ? ' on' : ''}`}
          onClick={toggleSaved}
          aria-label="Add to favourites"
        >
          {isSaved ? <AddedFavoriteIcon /> : <AddFavoriteIcon />}
        </button>
        <button
          className={`wbIcon${showFavorites ? ' on' : ''}`}
          onClick={() => setShowFavorites((v) => !v)}
          aria-label="Favourites"
        >
          <FavoritesIcon />
        </button>
        {onToggleExpand && (
          <button className="wbIcon" onClick={onToggleExpand} aria-label={expanded ? 'Restore' : 'Expand'}>
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
          </button>
        )}
        {onClose && (
          <button className="wbIcon" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        )}
      </div>

      {showFavorites && (
        <div className="wbFavorites">
          {favoriteTiles.map((b) => (
            <button key={b.url} className="wbFavorite" onClick={() => go(b.url)}>
              <span className="wbFavoriteGlyph">{b.label.slice(0, 1).toUpperCase()}</span>
              <span className="wbFavoriteLabel">{b.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="wbViewport">
        {mode === 'live' ? (
          <iframe
            key={`${url}-${cursor}-${loading ? 'l' : 'd'}`}
            className="wbFrame"
            src={url}
            title="Tesla browser"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="wbScreens">
            {current?.src ? (
              isVideo(current.src) ? (
                <video className="wbScreenMedia" src={current.src} autoPlay muted loop playsInline />
              ) : (
                <img className="wbScreenMedia" src={current.src} alt={current.title || ''} />
              )
            ) : (
              <div className="wbScreenPlaceholder">
                <strong>{current?.title || 'Demo screens'}</strong>
                <span>{current?.caption || 'Add entries to DEMO_SCREENS in src/config/browserConfig.js'}</span>
              </div>
            )}
            {screens.length > 1 && (
              <div className="wbScreenNav">
                <button onClick={() => stepBy(-1)} disabled={step === 0}>
                  ‹
                </button>
                <span>
                  {step + 1} / {screens.length}
                </span>
                <button onClick={() => stepBy(1)} disabled={step >= screens.length - 1}>
                  ›
                </button>
              </div>
            )}
          </div>
        )}

        {hint && mode === 'live' && (
          <div className="wbHint" onClick={() => setHint(false)}>
            Blank frame? The site is refusing to be embedded — switch to Demo screens,
            or allow this origin in its <code>frame-ancestors</code>.
          </div>
        )}
      </div>

      <div className="wbModeSwitch" data-record-hide="true">
        <button className={mode === 'live' ? 'on' : ''} onClick={() => setMode('live')}>
          Live
        </button>
        <button className={mode === 'screens' ? 'on' : ''} onClick={() => setMode('screens')}>
          Demo screens
        </button>
      </div>
    </div>
  );
};

export default Browser;
