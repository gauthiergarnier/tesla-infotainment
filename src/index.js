import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

/*
 * No <React.StrictMode>.
 *
 * In dev, React 18 StrictMode mounts every component, unmounts it, then mounts
 * it again. react-three-fiber's <Canvas> disposes its WebGL renderer on that
 * unmount, and what is left is a dead canvas: render loop stopped,
 * gl.info.memory.geometries back to 0, nothing drawn. The car card renders
 * empty even though the scene graph is perfectly correct.
 *
 * This only ever bit the dev server - production builds do not double-mount -
 * but the dev server is exactly where demos get recorded.
 */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

reportWebVitals();
