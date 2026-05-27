// DOM renderer — stateless. Given game state, updates the DOM.

/**
 * Build tube DOM elements and append them to #game.
 * Returns the array of tube elements (index matches state.tubes).
 */
export function buildDOM(config, gameEl) {
    gameEl.innerHTML = "";
    const tubeEls = config.tubes.map((_, i) => {
        const tube = document.createElement("div");
        tube.className = "tube";
        tube.dataset.index = i;
        tube.setAttribute("tabindex", "0");
        tube.setAttribute("role", "button");
        tube.setAttribute("aria-label", `Tube ${i + 1}`);

        // Pre-fill with empty layer placeholders up to capacity
        for (let s = 0; s < config.tubeCapacity; s++) {
            const slot = document.createElement("div");
            slot.className = "layer empty";
            tube.appendChild(slot);
        }

        gameEl.appendChild(tube);
        return tube;
    });
    return tubeEls;
}

/**
 * Re-render tube contents and selection state from current game state.
 * Does not create or remove tube elements — only updates their children.
 */
export function render(state, tubeEls) {
    tubeEls.forEach((tubeEl, i) => {
        const tube = state.tubes[i];

        // Rebuild layer children
        tubeEl.innerHTML = "";
        // Render empty slots from bottom (column-reverse CSS, so visual top = DOM last)
        for (let s = 0; s < state.capacity; s++) {
            const div = document.createElement("div");
            if (s < tube.length) {
                div.className = "layer";
                div.dataset.color = tube[s];
            } else {
                div.className = "layer empty";
            }
            tubeEl.appendChild(div);
        }

        // Selection / focus classes
        tubeEl.classList.toggle("selected", state.selected === i);
    });

    // Win overlay
    const overlay = document.getElementById("win-overlay");
    if (overlay) {
        overlay.classList.toggle("hidden", !state.won);
        if (state.won) {
            const movesEl = document.getElementById("win-moves");
            if (movesEl)
                movesEl.textContent = `Solved in ${state.moves} move${state.moves !== 1 ? "s" : ""}`;
        }
    }

    // Undo button — disable when nothing to undo or undo disabled
    const undoBtn = document.getElementById("btn-undo");
    if (undoBtn) {
        const canUndo =
            state.undoMode !== "disabled" && state.history.length > 0;
        undoBtn.disabled = !canUndo;
        undoBtn.style.opacity = canUndo ? "1" : "0.4";
    }
}
