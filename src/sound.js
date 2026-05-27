// Sound effects via Web Audio API — no external files.
// AudioContext must be created (or resumed) after a user gesture.

let ctx = null;

function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
}

/**
 * Play a simple synthesised tone.
 * @param {number}   freq      - frequency in Hz
 * @param {number}   duration  - duration in seconds
 * @param {'sine'|'square'|'sawtooth'|'triangle'} type
 * @param {number}   gain      - peak gain (0–1)
 * @param {number}   [startFreq] - if set, glide from startFreq to freq
 */
function tone(freq, duration, type = "sine", gain = 0.3, startFreq = null) {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const env = ac.createGain();

    osc.connect(env);
    env.connect(ac.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq ?? freq, ac.currentTime);
    if (startFreq !== null) {
        osc.frequency.linearRampToValueAtTime(
            freq,
            ac.currentTime + duration * 0.9,
        );
    }

    env.gain.setValueAtTime(0, ac.currentTime);
    env.gain.linearRampToValueAtTime(gain, ac.currentTime + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
}

/** Short tick on tube selection. */
export function playSelect() {
    tone(660, 0.08, "sine", 0.25);
}

/** Descending glide to simulate liquid pouring. */
export function playPour() {
    tone(320, 0.35, "sine", 0.3, 560);
}

/** Low blip for invalid move. */
export function playInvalid() {
    tone(140, 0.15, "square", 0.2);
}

/** Ascending triad for win. */
export function playWin() {
    const ac = getCtx();
    const now = ac.currentTime;
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        setTimeout(() => tone(freq, 0.4, "sine", 0.3), i * 120);
    });
}
