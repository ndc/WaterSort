// Keyboard input stream.
//
// ArrowLeft / ArrowRight / Tab / Shift+Tab — move focus between tubes
// Enter / Space                            — activate focused tube
// Ctrl+Z / Meta+Z                          — undo

import { fromEvent, merge } from "rxjs";
import { filter, map, tap } from "rxjs/operators";

/**
 * @param {HTMLElement[]} tubeEls
 * @returns {Observable<Action>}
 */
export function createKeyboardStream(tubeEls) {
    let focusedIndex = -1;

    function setFocus(index) {
        tubeEls.forEach((el) => el.classList.remove("focused"));
        focusedIndex = index;
        if (index >= 0 && index < tubeEls.length) {
            tubeEls[index].classList.add("focused");
            tubeEls[index].focus({ preventScroll: true });
        }
    }

    // Arrow key navigation on the document
    const nav$ = fromEvent(document, "keydown").pipe(
        filter((e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") return true;
            // Tab is handled by browser natively; we intercept to sync focusedIndex
            return false;
        }),
        tap((e) => {
            e.preventDefault();
            const dir = e.key === "ArrowRight" ? 1 : -1;
            const next = Math.max(
                0,
                Math.min(
                    tubeEls.length - 1,
                    (focusedIndex < 0 ? 0 : focusedIndex) + dir,
                ),
            );
            setFocus(next);
        }),
        // nav keys don't emit actions — they only move focus
        filter(() => false),
    );

    // Track focus when user Tabs naturally
    tubeEls.forEach((el, i) => {
        el.addEventListener("focus", () => {
            focusedIndex = i;
        });
    });

    // Enter / Space → activate focused tube
    const activate$ = fromEvent(document, "keydown").pipe(
        filter(
            (e) =>
                (e.key === "Enter" || e.key === " ") &&
                focusedIndex >= 0 &&
                document.activeElement === tubeEls[focusedIndex],
        ),
        tap((e) => e.preventDefault()),
        map(() => ({
            type: "TUBE_ACTIVATED",
            index: focusedIndex,
            source: "keyboard",
        })),
    );

    // Ctrl+Z / Cmd+Z → undo
    const undo$ = fromEvent(document, "keydown").pipe(
        filter((e) => (e.ctrlKey || e.metaKey) && e.key === "z"),
        tap((e) => e.preventDefault()),
        map(() => ({ type: "UNDO", source: "keyboard" })),
    );

    return merge(nav$, activate$, undo$);
}
