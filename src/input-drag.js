// Drag-and-drop input stream.
//
// Pointerdown on tube A → pointermove (visual drag) → pointerup on tube B
// → emits TUBE_ACTIVATED(A) then TUBE_ACTIVATED(B).
//
// If released outside a tube, emits only TUBE_ACTIVATED(A) (selection toggles off).
// A distance threshold distinguishes accidental clicks from intentional drags.

import { fromEvent, merge, EMPTY, from } from "rxjs";
import { filter, switchMap, take, tap, takeUntil } from "rxjs/operators";

const DRAG_THRESHOLD_PX = 6;

/**
 * @param {HTMLElement[]} tubeEls
 * @returns {Observable<Action>}
 */
export function createDragStream(tubeEls) {
    const streams = tubeEls.map((el, fromIndex) => {
        return fromEvent(el, "pointerdown").pipe(
            filter((e) => e.button === 0 || e.pointerType === "touch"),
            switchMap((startEvt) => {
                startEvt.preventDefault();
                el.setPointerCapture(startEvt.pointerId);

                let dragging = false;
                const startX = startEvt.clientX;
                const startY = startEvt.clientY;

                const move$ = fromEvent(el, "pointermove").pipe(
                    tap((e) => {
                        const dx = e.clientX - startX;
                        const dy = e.clientY - startY;
                        if (
                            !dragging &&
                            Math.hypot(dx, dy) > DRAG_THRESHOLD_PX
                        ) {
                            dragging = true;
                            el.classList.add("dragging");
                        }
                    }),
                    takeUntil(fromEvent(el, "pointerup")),
                );

                const up$ = fromEvent(el, "pointerup").pipe(
                    take(1),
                    switchMap((upEvt) => {
                        el.classList.remove("dragging");
                        el.releasePointerCapture(upEvt.pointerId);

                        if (!dragging) return EMPTY; // pure click — let click stream handle it

                        // Mark so the click stream ignores the synthetic click that follows
                        // Find which tube is under the pointer
                        const target = document.elementFromPoint(
                            upEvt.clientX,
                            upEvt.clientY,
                        );
                        const toTube = tubeEls.findIndex(
                            (t) => t === target || t.contains(target),
                        );

                        const actions = [
                            {
                                type: "TUBE_ACTIVATED",
                                index: fromIndex,
                                source: "drag",
                            },
                        ];
                        if (toTube >= 0 && toTube !== fromIndex) {
                            actions.push({
                                type: "TUBE_ACTIVATED",
                                index: toTube,
                                source: "drag",
                            });
                        }
                        // Suppress the synthetic click that fires after pointerup on the source element
                        el.addEventListener(
                            "click",
                            (e) => {
                                e._fromDrag = true;
                            },
                            { once: true },
                        );

                        return from(actions);
                    }),
                );

                return merge(move$.pipe(filter(() => false)), up$);
            }),
        );
    });

    return merge(...streams);
}
