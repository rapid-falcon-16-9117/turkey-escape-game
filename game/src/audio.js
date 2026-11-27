// Gobble Dash — sound: tiny WebAudio synth, no audio files, no network.
// Every effect is one short oscillator burst so the game stays fully offline.

export function createSoundBank() {
  let context = null;
  let enabled = true;

  function ensureContext() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') context.resume();
    return context;
  }

  function blip({ from, to, duration, type, gain }) {
    if (!enabled) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const amp = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), ctx.currentTime + duration);
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(amp);
    amp.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }

  return {
    unlock() { ensureContext(); },
    setEnabled(value) { enabled = value; },
    isEnabled() { return enabled; },
    jump() { blip({ from: 320, to: 640, duration: 0.16, type: 'sine', gain: 0.12 }); },
    dash() { blip({ from: 180, to: 720, duration: 0.22, type: 'sawtooth', gain: 0.08 }); },
    pickup() { blip({ from: 880, to: 1320, duration: 0.12, type: 'triangle', gain: 0.14 }); },
    feather() {
      blip({ from: 660, to: 990, duration: 0.1, type: 'triangle', gain: 0.14 });
      setTimeout(() => blip({ from: 990, to: 1480, duration: 0.14, type: 'triangle', gain: 0.12 }), 90);
    },
    hit() { blip({ from: 220, to: 60, duration: 0.28, type: 'square', gain: 0.16 }); },
    hide() { blip({ from: 520, to: 260, duration: 0.2, type: 'sine', gain: 0.1 }); },
    caught() {
      blip({ from: 392, to: 370, duration: 0.22, type: 'triangle', gain: 0.16 });
      setTimeout(() => blip({ from: 330, to: 311, duration: 0.22, type: 'triangle', gain: 0.16 }), 200);
      setTimeout(() => blip({ from: 262, to: 196, duration: 0.4, type: 'triangle', gain: 0.16 }), 400);
    },
    escaped() {
      [523, 659, 784, 1047].forEach((note, i) =>
        setTimeout(() => blip({ from: note, to: note, duration: 0.18, type: 'triangle', gain: 0.14 }), i * 130));
    },
  };
}
