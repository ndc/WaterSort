// Pour animation.
//
// Adds/removes CSS classes to animate layers leaving the source tube
// and entering the destination tube. Returns a Promise that resolves
// when the animation finishes so the main loop can await it.

const POUR_DURATION_MS = 320;

/**
 * Animate a pour: the top layer leaves `fromEl` and appears in `toEl`.
 * Call this AFTER the state has already been updated (the renderer has
 * already moved the layer data), so we animate the visual transition.
 *
 * Strategy:
 *   1. On fromEl, briefly flash the tube (scale down slightly).
 *   2. On toEl, animate the top layer in (entering class).
 *
 * @param {HTMLElement} fromEl - source tube element
 * @param {HTMLElement} toEl   - destination tube element
 * @returns {Promise<void>}
 */
export function animatePour(fromEl, toEl) {
    return new Promise((resolve) => {
        // Animate source: quick "draining" lift
        fromEl.style.transition = `transform ${POUR_DURATION_MS * 0.4}ms ease`;
        fromEl.style.transform = "translateY(-6px) scale(0.97)";

        // Animate destination top layer: entering
        // The renderer already placed the new layer; find the topmost non-empty one
        const dstLayers = [...toEl.querySelectorAll(".layer:not(.empty)")];
        const topLayer = dstLayers[dstLayers.length - 1];
        if (topLayer) {
            topLayer.classList.add("entering");
            setTimeout(
                () => topLayer.classList.remove("entering"),
                POUR_DURATION_MS,
            );
        }

        setTimeout(() => {
            fromEl.style.transform = "";
            fromEl.style.transition = "";
            resolve();
        }, POUR_DURATION_MS);
    });
}

/**
 * Animate a selection: brief upward nudge on the tube.
 * @param {HTMLElement} tubeEl
 */
export function animateSelect(tubeEl) {
    tubeEl.style.transition = "transform 100ms ease";
    tubeEl.style.transform = "translateY(-10px)";
    // CSS .selected class also applies translateY(-8px), so this is additive briefly
    setTimeout(() => {
        tubeEl.style.transform = "";
        tubeEl.style.transition = "";
    }, 150);
}

/**
 * Shake a tube to indicate an invalid move.
 * @param {HTMLElement} tubeEl
 */
export function animateInvalid(tubeEl) {
    tubeEl.style.animation = "none";
    // Force reflow
    void tubeEl.offsetWidth;
    tubeEl.style.animation = `shake 300ms ease`;
    setTimeout(() => {
        tubeEl.style.animation = "";
    }, 300);
}
