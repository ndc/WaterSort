# WaterSort

## Running the game

No build step. Open `index.html` directly in a browser, or serve it with any static file server:

```sh
npx serve .
# or
python -m http.server
```

RxJS is loaded from `esm.sh` via a native `<script type="importmap">` in `index.html` — no `npm install` required.

## Architecture

Vanilla JS browser game using ES modules. `main.js` is the composition root that wires all layers together:

```
config.js          → puzzle definition (tubes, capacity, undo mode)
state.js           → pure game logic (no DOM, no side-effects)
renderer.js        → stateless DOM updater: state → DOM
animation.js       → CSS animation helpers, return Promises
sound.js           → Web Audio API synthesised sounds (no audio files)
input-click.js  ─┐
input-drag.js   ─┤→ RxJS Observable streams, all emit the same action shapes
input-keys.js   ─┘
main.js            → merges streams, drives the reducer/render/animate loop
```

## State model (`state.js`)

State is a plain object treated as immutable — `reduce(state, action)` always returns a new object.

```js
{
  tubes:    string[][]  // index 0 = bottom layer; top color = last element
  capacity: number      // max layers per tube
  selected: number|null // currently selected tube index
  history:  string[][][] // tube snapshots for undo
  moves:    number
  won:      boolean
  undoMode: 'unlimited'|'once'|'disabled'
}
```

Actions: `{ type: 'TUBE_ACTIVATED', index }` and `{ type: 'UNDO' }`.  
`RESTART` is handled externally in `main.js` by calling `initialState(config)` — it is not a reducer action.

## Key conventions

### Animation lock
`main.js` uses an `animating` boolean (not RxJS `exhaustMap`). The subscriber filters out new `TUBE_ACTIVATED` actions while animating; `UNDO` always passes through. State is committed and the DOM rendered **before** `await animatePour(...)` so the animation reflects the already-updated state.

### Drag vs click disambiguation
`input-drag.js` sets `e._fromDrag = true` on the synthetic `click` event that fires after `pointerup`, and `input-click.js` filters those out. A drag emits two consecutive `TUBE_ACTIVATED` actions (source → target).

### Adding a new color
Two steps are required — both must be done together:
1. Add a CSS variable to `:root` in `style.css`: `--color-<name>: #...;`
2. Add an attribute selector rule: `.layer[data-color="<name>"] { background: var(--color-<name>); }`

Color strings flow as plain strings through state and land on `div.dataset.color`; CSS does the rest.

### Changing the puzzle
Edit `config.js` only. Each tube array uses index 0 = bottom. Empty arrays `[]` are empty tubes (needed as destinations). All tubes share `tubeCapacity`.

### Undo history
`pushHistory` is called inside `reduce` only for valid pours (not selections). In `'once'` mode the history is cleared after one undo so it cannot be used again.
