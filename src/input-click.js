// Two-click input stream.
// Emits { type: 'TUBE_ACTIVATED', index } on every tube click.

import { fromEvent, merge } from "rxjs";
import { filter, map } from "rxjs/operators";

/**
 * @param {HTMLElement[]} tubeEls
 * @returns {Observable<{type:'TUBE_ACTIVATED', index:number}>}
 */
export function createClickStream(tubeEls) {
    const clicks = tubeEls.map((el, i) =>
        fromEvent(el, "click").pipe(
            // Ignore clicks that originated from a drag (drag module sets this flag)
            filter((e) => !e._fromDrag),
            map(() => ({ type: "TUBE_ACTIVATED", index: i, source: "click" })),
        ),
    );
    return merge(...clicks);
}
