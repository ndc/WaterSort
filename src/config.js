// Puzzle configuration — edit this to change the puzzle.
//
// tubes:     array of tubes; each tube is an array of color strings,
//            index 0 = bottom layer, index (capacity-1) = top layer.
// tubeCapacity: max layers per tube (all tubes share this capacity).
// undo:      'unlimited' | 'once' | 'disabled'

export const config = {
    tubeCapacity: 4,
    tubes: [
        ["red", "blue", "green", "red"],
        ["blue", "green", "red", "blue"],
        ["green", "red", "blue", "green"],
        ["yellow", "orange", "yellow", "orange"],
        ["orange", "yellow", "orange", "yellow"],
        [],
        [],
    ],
    undo: "unlimited", // 'unlimited' | 'once' | 'disabled'
};
