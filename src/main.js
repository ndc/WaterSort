import { merge } from "rxjs";
import { exhaustMap, filter } from "rxjs/operators";

import { config } from "./config.js";
import { initialState, reduce, isValidPour } from "./state.js";
import { buildDOM, render } from "./renderer.js";
import { animatePour, animateSelect, animateInvalid } from "./animation.js";
import { playSelect, playPour, playInvalid, playWin } from "./sound.js";
import { createClickStream } from "./input-click.js";
import { createKeyboardStream } from "./input-keys.js";
import { createDragStream } from "./input-drag.js";

// ── Bootstrap ────────────────────────────────────────────────────────────────

const gameEl = document.getElementById("game");
const tubeEls = buildDOM(config, gameEl);

let state = initialState(config);
render(state, tubeEls);

// ── Input streams ─────────────────────────────────────────────────────────────

const click$ = createClickStream(tubeEls);
const keyboard$ = createKeyboardStream(tubeEls);
const drag$ = createDragStream(tubeEls);

const actions$ = merge(click$, keyboard$, drag$);

// ── Action handler (with animation lock via exhaustMap) ───────────────────────

let animating = false;

actions$
    .pipe(filter((action) => !animating || action.type === "UNDO"))
    .subscribe(async (action) => {
        if (state.won && action.type !== "RESTART") return;

        if (action.type === "UNDO") {
            const next = reduce(state, action);
            if (next === state) return; // nothing to undo
            state = next;
            render(state, tubeEls);
            return;
        }

        if (action.type !== "TUBE_ACTIVATED") return;

        const { index } = action;
        const prevSelected = state.selected;

        const next = reduce(state, action);

        // Detect what happened
        const poured =
            prevSelected !== null &&
            prevSelected !== index &&
            next.selected === null &&
            (next.moves > state.moves || next.won);

        if (poured) {
            // Valid pour: animate first, then commit render
            animating = true;
            playPour();
            state = next;
            render(state, tubeEls);
            await animatePour(tubeEls[prevSelected], tubeEls[index]);
            animating = false;

            if (state.won) {
                playWin();
            }
        } else if (next.selected !== null && next.selected !== prevSelected) {
            // Newly selected
            playSelect();
            state = next;
            animateSelect(tubeEls[index]);
            render(state, tubeEls);
        } else if (
            next.selected === null &&
            prevSelected !== null &&
            prevSelected === index
        ) {
            // Deselected (same tube clicked again)
            state = next;
            render(state, tubeEls);
        } else if (
            prevSelected !== null &&
            prevSelected !== index &&
            next.selected !== null
        ) {
            // Invalid pour → reselected another tube
            playInvalid();
            animateInvalid(tubeEls[prevSelected]);
            state = next;
            render(state, tubeEls);
        } else {
            state = next;
            render(state, tubeEls);
        }
    });

// ── Button wiring ─────────────────────────────────────────────────────────────

document.getElementById("btn-undo").addEventListener("click", () => {
    const next = reduce(state, { type: "UNDO" });
    if (next !== state) {
        state = next;
        render(state, tubeEls);
    }
});

function restartGame() {
    state = initialState(config);
    render(state, tubeEls);
}

document.getElementById("btn-restart").addEventListener("click", restartGame);
document
    .getElementById("btn-play-again")
    .addEventListener("click", restartGame);
