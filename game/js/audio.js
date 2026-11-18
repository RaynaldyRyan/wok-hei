// WOK HEI — synthesized sound: no audio files, everything is WebAudio.
let ctx = null;
let muted = false;

function ac() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setMuted(m) {
  muted = m;
}
export function isMuted() {
  return muted;
}
// Call on the first user gesture so the context is allowed to start.
export function unlockAudio() {
  ac();
}

function tone(freq, dur, type, vol, when, slideTo) {
  const c = ac();
  if (!c || muted) return;
  const t0 = c.currentTime + (when || 0);
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(dur, vol, when, low) {
  const c = ac();
  if (!c || muted) return;
  const t0 = c.currentTime + (when || 0);
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = low || 2400;
  const g = c.createGain();
  g.gain.value = vol || 0.12;
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0);
}

export const sfx = {
  click() {
    tone(720, 0.06, 'square', 0.06);
  },
  toss() {
    noise(0.18, 0.14, 0, 3200);
    tone(320, 0.1, 'triangle', 0.08, 0, 520);
  },
  serve() {
    tone(660, 0.12, 'sine', 0.16);
    tone(880, 0.18, 'sine', 0.16, 0.09);
  },
  perfect() {
    tone(880, 0.12, 'sine', 0.16);
    tone(1174, 0.14, 'sine', 0.16, 0.08);
    tone(1568, 0.22, 'sine', 0.15, 0.16);
  },
  burn() {
    tone(180, 0.3, 'sawtooth', 0.12, 0, 90);
    noise(0.3, 0.1, 0, 900);
  },
  lost() {
    tone(392, 0.18, 'triangle', 0.14, 0, 300);
    tone(311, 0.24, 'triangle', 0.14, 0.16, 233);
  },
  rush() {
    tone(523, 0.12, 'square', 0.1);
    tone(659, 0.12, 'square', 0.1, 0.1);
    tone(784, 0.2, 'square', 0.1, 0.2);
  },
  critic() {
    tone(1046, 0.16, 'sine', 0.16);
    tone(784, 0.16, 'sine', 0.14, 0.14);
    tone(1046, 0.28, 'sine', 0.16, 0.28);
  },
  fanfare() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.24, 'triangle', 0.16, i * 0.13));
    tone(1318, 0.5, 'sine', 0.15, 0.55);
  },
  coin() {
    tone(1320, 0.08, 'sine', 0.1);
    tone(1760, 0.14, 'sine', 0.1, 0.06);
  },
};
