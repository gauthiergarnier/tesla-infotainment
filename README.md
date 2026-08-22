# Tesla Infotainment Simulator (WIP)

> **This is a fork.** Upstream: [jamesalmeida/tesla-infotainment](https://github.com/jamesalmeida/tesla-infotainment).
> It adds an in-dash **web browser** so you can film a web app running on the car's
> screen, a **record mode** for clean captures, and a set of fidelity fixes derived
> from a teardown of Tesla's own MCU firmware. See [Fork additions](#fork-additions).

Experience a simulated Tesla infotainment system in your browser!

[Live Demo](https://jamesalmeida.github.io/tesla-infotainment/)

![App Preview](public/app-preview.png)

## Fork additions

### Web browser app

The car has a real browser, and the firmware makes clear how it is put together:
every Chromium instance in the image is launched with `--disable-toolbar
--disable-location-bar --disable-tab-strip`, so the back/forward buttons, the
address field and the favourites folder you see on screen are **Tesla's own Qt
chrome**, not Chrome's. The recreation here follows the asset set the car ships
in `/usr/tesla/UI/assets/day/web/` — 60x60 icon buttons, a 44px address field
that doubles as the loading bar (the car has a dedicated
`text_field_loading_background.png` for exactly that), an outline star for
"add to favourites" and a folder-with-star for "open favourites". The glyphs are
redrawn as SVG rather than copied.

Open it from the dock, from the app shelf, or with **Shift+B**.

Sizes are authored at the car's native pixel dimensions and scaled by a
`--wb-scale` custom property recalculated from the panel width, so the chrome
keeps its proportions whether it is sharing the screen with the car card or
expanded to fill it.

**Two content modes**, switched from the control that appears on hover:

- **Live** renders the site in an iframe. Works for any origin that permits framing.
- **Demo screens** plays a scripted sequence of stills or video from `public/demo/`,
  stepped with the on-screen arrows or the ← / → keys. Use this for anything that
  cannot be framed or needs a logged-in session.

> **Framing caveat.** Most sites refuse to be embedded. At the time of writing
> `codriver.io` responds with `x-frame-options: DENY` and
> `frame-ancestors 'none'`, so live mode will show a blank frame until the
> simulator's origin is allow-listed:
>
> ```
> Content-Security-Policy: frame-ancestors 'self' http://localhost:3000 https://<your-pages-domain>;
> ```
>
> and the `x-frame-options: DENY` header is dropped for those paths — XFO has no
> allow-list syntax, and `XFO: DENY` still wins wherever both headers are present.
> Pointing at a local dev server is usually the fastest path, since you control
> its headers.

Home URL, favourites and the demo script live in `src/config/browserConfig.js`.

### Record mode

**Shift+R**, or `?record=1`. Strips the desk background, the bezel and every
authoring affordance, then sizes the display to fill the window at exactly 8:5 —
so a plain window capture is nothing but the centre display, no cropping.

Deep links make a take repeatable:

```
?app=browser&url=https://codriver.io&expanded=1&record=1
```

| Key | Action |
| --- | --- |
| Shift+B | Open the browser |
| Shift+E | Expand / restore the browser to the full screen |
| Shift+R | Toggle record mode |

### Fidelity fixes

- **Screen geometry.** The Model 3/Y centre display is **1920x1200 — 8:5, not
  16:9**. The bezel was 16:9, which stretched every element in the UI. (For
  reference, the S/X portrait screen is 1200x1920; the firmware's
  `/etc/RunQtCar.env` sets `QCSIZE="1200x1920"`.)
- **Typography.** The car's `/usr/tesla/UI/assets/fonts.conf` maps every text role
  onto one family — `Universal Sans Text` at grades 330 (light), 530 (normal) and
  630 (bold), with a mono-numerals cut for anything numeric. The repo already
  shipped `Universal-Sans.ttf` but never declared an `@font-face` for it; it is now
  wired up as the primary family. Universal Sans is a commercial face, so the three
  grades are approximated from the single shipped weight — drop in licensed copies
  of `UniversalSans-Text-330/530/630` for an exact match.
- **App shelf.** Shelf icons were decorative; they now launch their app.

### Optional: the car's own 3D model

The bundled model is a 22 MB marketplace 2018 Model 3. The MCU renders its own
Model 3 — `Ego/3_High/Model3_High` inside `ap_visualization.zip` — which is
**~3 MB**, because it is built for an in-car GPU, and is the genuine article.

If you have the [tesla-3d-renders](https://github.com/gauthiergarnier/tesla-3d-renders)
firmware pipeline checked out and built:

```bash
npm run import:firmware-model -- /path/to/tesla-3d-renders-fw
echo 'REACT_APP_CAR_MODEL=firmware' >> .env
npm start
```

Part names are mapped in `src/config/vehicleConfig.js` (Tesla calls them `Hood`,
`Trunk`, `Door_LF`…, not `bonnet_dummy`/`boot_dummy`). The two models do not share
a scale or resting orientation, so expect to tune the transform.

The imported model is Tesla's asset and is gitignored. Whether to publish it from
a public fork is your call.

## Features to try out
- Realistic 3D model of Tesla Model Y. Try opening the trunk and frunk!
- Interactive infotainment system simulation. Play a podcast, adjust the volume, etc.
- Put the car in reverse (Click the R) and see what's behind you!
- Try searching on the map. Turn on traffic or different map styles.
- Check out the keyboard shortcuts below for more controls.
- Working on more responsive design for various screen sizes. Works best on desktop but you can try it out on your phone in landscape mode too. 
- Adding features periodically. Leave a feature request in the issues section ^_^

## Keyboard Shortcuts
- Shift + Left Arrow: Toggle left turn signal
- Shift + Right Arrow: Toggle right turn signal
- Shift + H: Toggle hazard lights
- Shift + F: Toggle frunk (front trunk)
- Shift + T: Toggle trunk
- Shift + M: Focus on Navigate Input
- Shift + C: Backup Camera

### Gear Selection
- P: Park
- R: Reverse
- N: Neutral
- D: Drive

### Music Controls
- Space: Play/Pause
- Shift + <: Previous track
- Shift + >: Next track

## Quick Start
To run the project locally:

1. Clone the repository:
   ```
   git clone https://github.com/jamesalmeida/tesla-infotainment.git
   cd tesla-infotainment
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Use the `.env.template` to create your own `.env` file. Add your API key for [Google Maps](https://cloud.google.com/maps-platform) and also a mapID for the maps styles to match Tesla's car maps. You can use mine (it's in the template) or create your own.


4. Start the development server:
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production
To create a production-ready build:

```
npm run build
```

This command builds the app for production to the `build` folder, optimizing the build for the best performance.

### `npm run deploy`
To make this project work as a Github Page, I added this command to deploy to a Github Page. You'll want to add the `PUBLIC_URL` to your `.env` file to point to your Github Pages URL.


This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Thanks
- Want to thank Ameer Studio for sharing the [3D model of the Tesla Model 3](https://sketchfab.com/3d-models/tesla-2018-model-3-5ef9b845aaf44203b6d04e2c677e444f) I'm using in the simulator.
- Also thanks to Vasilj Miloevi for the [loading screen circle animations](https://codepen.io/eboye/pen/ANPxVX) that I used for the loading screen.
- Thanks to Patrick Stillhart for sharing the [OutRun video game on Codepen](https://codepen.io/arcs/pen/aGzNKY) that I refactored to work inside of the Arcade in this project.

