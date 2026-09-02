# Tesla Infotainment Simulator (WIP)
Experience a simulated Tesla infotainment system in your browser!

[Live Demo](https://jamesalmeida.github.io/tesla-infotainment/)

![App Preview](public/app-preview.png)

## Features to try out
- Low-poly 3D Tesla Model Y. Try opening the trunk and frunk, or clicking a door.
- Interactive infotainment system simulation. Play a podcast, adjust the volume, etc.
- Put the car in reverse (Click the R) and see what's behind you!
- Try searching on the map. Turn on traffic or different map styles.
- Open the app shelf and launch **Browser** — its web view runs [codriver](https://app.codriver.io) in demo mode: set a start and a destination and watch a synthetic car drive the route.
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

## Browser app: codriver demo mode

The Browser app's web view opens on codriver's demo mode (`?demo=1`) — a
synthetic driver that routes between two addresses and drives the polyline,
accelerating to the road limit and braking for corners.

Two env vars control it (see `.env.template`):

| Var | Purpose |
|---|---|
| `REACT_APP_CODRIVER_ENV` | `staging` or `production` — which codriver deployment to frame. Defaults to `production` for a production build and `staging` for everything else. |
| `REACT_APP_CODRIVER_DEMO_URL` | Full URL override, used verbatim. For running both apps locally: `http://localhost:4399/?demo=1`. |

**codriver has to agree to be framed.** It sends `X-Frame-Options: DENY` to
every caller by default. Its server relaxes that for demo page loads only, and
only when `DEMO_FRAME_ANCESTORS` names the origins allowed to frame them:

```
DEMO_FRAME_ANCESTORS="https://gauthiergarnier.github.io http://localhost:3000"
```

Without it the web view renders blank — the browser reports the refusal to its
own console and nothing else. The Browser app notices a frame that never loads
and says so, with the fix, after a few seconds.

## Build for Production
To create a production-ready build:

```
npm run build
```

This command builds the app for production to the `build` folder, optimizing the build for the best performance.

### `npm run deploy`
To make this project work as a Github Page, I added this command to deploy to a Github Page. You'll want to add the `PUBLIC_URL` to your `.env` file to point to your Github Pages URL.


This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## License

MIT — see [`LICENSE`](LICENSE). This is a fork of
[jamesalmeida/tesla-infotainment](https://github.com/jamesalmeida/tesla-infotainment);
the copyright is James Almeida's and the notice travels with every copy, this
one included.

The licence covers the code in this repository, and the code only.

**The bundled 3D vehicle models are not ours and are not MIT.** `public/car-models/`
holds `modely.glb` and `wheel-gemini.glb`, extracted from the Tesla Android app
(`com.teslamotors.tesla`) and converted to glTF. They are Tesla's assets, carry
no redistribution grant, and are here because this is an internal demo harness.
Anyone forking, redeploying or otherwise distributing this repository needs to
resolve that themselves — swapping in a model you have the rights to is a
two-line change in `src/components/VehicleModel/VehicleModel.js`.

Two third-party pieces this project used to carry have been removed rather than
relicensed: the CodePen loading animation (replaced with an original one) and
the OutRun arcade game (the Arcade app is gone with it).
