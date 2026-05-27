// Pure game state — no DOM, no side effects.
//
// State shape:
// {
//   tubes:    string[][]   — current tube contents (index 0 = bottom)
//   capacity: number       — max layers per tube
//   selected: number|null  — currently selected tube index
//   history:  string[][][]  — stack of past tubes snapshots (for undo)
//   moves:    number        — total pours made
//   won:      boolean
//   undoMode: 'unlimited'|'once'|'disabled'
// }

/** Build initial state from config. */
export function initialState(config) {
    return {
        tubes: config.tubes.map((t) => [...t]),
        capacity: config.tubeCapacity,
        selected: null,
        history: [],
        moves: 0,
        won: false,
        undoMode: config.undo,
    };
}

/** Clone tubes (deep). */
function cloneTubes(tubes) {
    return tubes.map((t) => [...t]);
}

/** Top color of a tube (last element), or null if empty. */
function topColor(tube) {
    return tube.length > 0 ? tube[tube.length - 1] : null;
}

/** How many of the top color are stacked consecutively at the top. */
function topCount(tube) {
    if (tube.length === 0) return 0;
    const color = topColor(tube);
    let n = 0;
    for (let i = tube.length - 1; i >= 0 && tube[i] === color; i--) n++;
    return n;
}

/** True if a pour from `from` into `to` is legal. */
export function isValidPour(state, from, to) {
    if (from === to) return false;
    const src = state.tubes[from];
    const dst = state.tubes[to];
    if (src.length === 0) return false; // nothing to pour
    if (dst.length === state.capacity) return false; // destination full
    const srcTop = topColor(src);
    const dstTop = topColor(dst);
    if (dstTop !== null && dstTop !== srcTop) return false; // colour mismatch
    return true;
}

/**
 * Apply a pour from `from` to `to`. Returns new state.
 * Caller must verify validity first.
 */
function applyPour(state, from, to) {
    const tubes = cloneTubes(state.tubes);
    const src = tubes[from];
    const dst = tubes[to];
    const color = topColor(src);
    const space = state.capacity - dst.length;
    const avail = topCount(src);
    const move = Math.min(space, avail);

    for (let i = 0; i < move; i++) {
        src.pop();
        dst.push(color);
    }

    const won = isWon({ ...state, tubes });
    return { ...state, tubes, selected: null, moves: state.moves + 1, won };
}

/** True when every non-empty tube is a single-colour full tube. */
export function isWon(state) {
    return state.tubes.every((tube) => {
        if (tube.length === 0) return true;
        if (tube.length !== state.capacity) return false;
        return tube.every((c) => c === tube[0]);
    });
}

// ── Actions ──────────────────────────────────────────────────────────────────
//   { type: 'TUBE_ACTIVATED', index: number }
//   { type: 'UNDO' }

/** Reduce state by one action. Always returns a new state object. */
export function reduce(state, action) {
    if (state.won && action.type !== "RESTART") return state;

    switch (action.type) {
        case "TUBE_ACTIVATED": {
            const { index } = action;
            const { selected } = state;

            // Nothing selected → select this tube (if non-empty)
            if (selected === null) {
                if (state.tubes[index].length === 0) return state; // can't select empty
                return { ...state, selected: index };
            }

            // Same tube → deselect
            if (selected === index) {
                return { ...state, selected: null };
            }

            // Different tube → attempt pour
            if (isValidPour(state, selected, index)) {
                const next = applyPour(pushHistory(state), selected, index);
                return next;
            }

            // Invalid pour → reselect new tube (if non-empty) or deselect
            if (state.tubes[index].length > 0) {
                return { ...state, selected: index };
            }
            return { ...state, selected: null };
        }

        case "UNDO": {
            if (state.undoMode === "disabled") return state;
            if (state.history.length === 0) return state;
            const history = [...state.history];
            const tubes = history.pop();
            const newState = {
                ...state,
                tubes,
                history,
                selected: null,
                moves: Math.max(0, state.moves - 1),
                won: false,
            };
            // For 'once' mode, clear history after one undo so it can't be used again
            if (state.undoMode === "once") newState.history = [];
            return newState;
        }

        case "RESTART":
            return state; // handled externally (re-initialise from config)

        default:
            return state;
    }
}

/** Push current tubes onto history stack (respecting undo mode). */
function pushHistory(state) {
    if (state.undoMode === "disabled") return state;
    const snapshot = cloneTubes(state.tubes);
    const history = [...state.history, snapshot];
    return { ...state, history };
}
