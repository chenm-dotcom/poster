// Pony Ketamine sound: a dark goth "ta-da" for the reveal, then a soft
// Berlin-style hard-techno loop underneath. Everything is synthesized with
// the Web Audio API — no audio files, nothing to license or download.

const BPM = 136;
const BEAT_LEVEL = 0.22;     // "soft in the background"
const MUTE_KEY = 'pk-muted';

let ctx = null;
let master, revSend, beatBus, noiseBuf, grit;
let muted = localStorage.getItem(MUTE_KEY) === '1';
let timer = null, nextTime = 0, step = 0, wantBeat = false;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(comp).connect(ctx.destination);

    // big, dark cathedral reverb
    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(4.2, 2.6);
    const revTone = ctx.createBiquadFilter();
    revTone.type = 'lowpass';
    revTone.frequency.value = 3200;
    revSend = ctx.createGain();
    revSend.connect(reverb).connect(revTone).connect(master);

    beatBus = ctx.createGain();
    beatBus.gain.value = 0;
    beatBus.connect(master);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    grit = makeDistortion(18);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function impulse(seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function makeDistortion(k) {
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i * 2) / curve.length - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

function noise(t, dur) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.start(t, Math.random() * 0.5, dur + 0.05);
  return src;
}

function env(g, t, peak, attack, decay) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/* ───────────────────────── the goth ta-da ───────────────────────── */

function tada() {
  if (!ensure()) return;
  const t0 = ctx.currentTime + 0.05;

  // sub boom
  const boom = ctx.createOscillator();
  const bg = ctx.createGain();
  boom.frequency.setValueAtTime(120, t0);
  boom.frequency.exponentialRampToValueAtTime(32, t0 + 0.9);
  env(bg, t0, 0.9, 0.005, 1.8);
  boom.connect(bg).connect(master);
  bg.connect(revSend);
  boom.start(t0); boom.stop(t0 + 2);

  // "ta" — short, low D-minor stab
  chord([50, 53, 57, 62], t0, { peak: 0.13, attack: 0.008, decay: 0.22, cutoff: 1100, send: 0.5 });

  // "DAAA" — D minor with a major seventh: haunting, a bit vampire
  const t1 = t0 + 0.26;
  chord([38, 45, 50, 53, 57, 61, 69], t1, { peak: 0.11, attack: 0.03, decay: 3.2, cutoff: 500, sweep: 2600, send: 1.1 });

  // funeral bell on top
  for (const [m, ratio, lvl] of [[74, 1, 0.12], [74, 2.76, 0.05], [74, 5.4, 0.025], [81, 1, 0.05]]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = hz(m) * ratio;
    env(g, t1, lvl, 0.004, 3.4);
    o.connect(g).connect(master);
    g.connect(revSend);
    o.start(t1); o.stop(t1 + 3.6);
  }

  // dark reversed-cymbal-ish swell into the hit
  const sw = noise(t0 - 0.0, 0.3);
  const sf = ctx.createBiquadFilter();
  sf.type = 'bandpass'; sf.frequency.value = 900; sf.Q.value = 0.8;
  const sg = ctx.createGain();
  sg.gain.setValueAtTime(0.0001, t0);
  sg.gain.exponentialRampToValueAtTime(0.12, t1);
  sg.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.05);
  sw.connect(sf).connect(sg).connect(revSend);
}

function chord(notes, t, { peak, attack, decay, cutoff, sweep, send }) {
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.Q.value = 6;
  filt.frequency.setValueAtTime(cutoff, t);
  if (sweep) {
    filt.frequency.exponentialRampToValueAtTime(sweep, t + 0.5);
    filt.frequency.exponentialRampToValueAtTime(cutoff * 0.8, t + decay);
  }
  const g = ctx.createGain();
  env(g, t, peak, attack, decay);
  filt.connect(g).connect(master);
  const s = ctx.createGain();
  s.gain.value = send;
  g.connect(s).connect(revSend);
  for (const m of notes) {
    for (const det of [-9, 9]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(m);
      o.detune.value = det;
      o.connect(filt);
      o.start(t); o.stop(t + attack + decay + 0.1);
    }
  }
}

/* ───────────────────────── the techno loop ───────────────────────── */

const STEP = 60 / BPM / 4; // 16th note
// 2-bar rolling bassline in D (semitones above D1), null = rest
const BASS = [null, null, 0, 0, null, null, 0, 12, null, null, 0, 0, null, null, 3, 0,
  null, null, 0, 0, null, null, 0, 12, null, null, 0, 0, null, 1, 0, null];

function kick(t) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const sh = ctx.createWaveShaper();
  sh.curve = grit;
  o.frequency.setValueAtTime(170, t);
  o.frequency.exponentialRampToValueAtTime(46, t + 0.11);
  env(g, t, 0.9, 0.002, 0.42);
  o.connect(sh).connect(g).connect(beatBus);
  o.start(t); o.stop(t + 0.5);

  // Berlin "rumble": the kick smeared into the reverb, low-passed
  const rf = ctx.createBiquadFilter();
  rf.type = 'lowpass'; rf.frequency.value = 160;
  const rg = ctx.createGain();
  rg.gain.value = 0.5;
  g.connect(rf).connect(rg).connect(revSend);
}

function hat(t, open, lvl) {
  const n = noise(t, open ? 0.25 : 0.05);
  const f = ctx.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = open ? 7000 : 9000;
  const g = ctx.createGain();
  env(g, t, lvl, 0.001, open ? 0.22 : 0.04);
  n.connect(f).connect(g).connect(beatBus);
}

function clap(t) {
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  for (const dt of [0, 0.011, 0.022]) {
    g.gain.setValueAtTime(0.35, t + dt);
    g.gain.exponentialRampToValueAtTime(0.05, t + dt + 0.01);
  }
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  noise(t, 0.25).connect(f).connect(g).connect(beatBus);
  const s = ctx.createGain(); s.gain.value = 0.4;
  g.connect(s).connect(revSend);
}

function bass(t, semis) {
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = hz(38 + semis);
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.Q.value = 9;
  f.frequency.setValueAtTime(900, t);
  f.frequency.exponentialRampToValueAtTime(140, t + STEP * 1.6);
  const g = ctx.createGain();
  env(g, t, 0.16, 0.004, STEP * 1.8);
  o.connect(f).connect(g).connect(beatBus);
  o.start(t); o.stop(t + STEP * 2.2);
}

function stab(t) {
  const o = [];
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 3;
  const g = ctx.createGain();
  env(g, t, 0.05, 0.003, 0.18);
  f.connect(g).connect(beatBus);
  const s = ctx.createGain(); s.gain.value = 1.2;
  g.connect(s).connect(revSend);
  for (const m of [62, 65, 69]) {
    const x = ctx.createOscillator();
    x.type = 'square';
    x.frequency.value = hz(m);
    x.connect(f); x.start(t); x.stop(t + 0.25);
    o.push(x);
  }
}

function scheduleStep(s, t) {
  const i = s % 16;
  if (i % 4 === 0) kick(t);
  if (i % 4 === 2) hat(t, true, 0.07);
  else hat(t, false, i % 2 ? 0.025 : 0.04);
  if (i === 4 || i === 12) clap(t);
  if (BASS[s] != null) bass(t, BASS[s]);
  if (s === 14 || s === 27) stab(t);
}

function tick() {
  while (nextTime < ctx.currentTime + 0.12) {
    scheduleStep(step, nextTime);
    nextTime += STEP;
    step = (step + 1) % 32;
  }
}

function runLoop() {
  if (timer || !ctx) return;
  nextTime = Math.max(nextTime, ctx.currentTime + 0.06);
  timer = setInterval(tick, 25);
}

function haltLoop() {
  clearInterval(timer);
  timer = null;
}

function startBeat(delay = 0) {
  if (!ensure()) return;
  wantBeat = true;
  const t = ctx.currentTime + delay;
  nextTime = t;
  step = 0;
  beatBus.gain.cancelScheduledValues(ctx.currentTime);
  beatBus.gain.setValueAtTime(beatBus.gain.value, ctx.currentTime);
  beatBus.gain.setValueAtTime(0.0001, t);
  beatBus.gain.exponentialRampToValueAtTime(BEAT_LEVEL, t + 4);
  haltLoop();
  runLoop();
}

function stopBeat() {
  wantBeat = false;
  if (!ctx) return;
  const now = ctx.currentTime;
  beatBus.gain.cancelScheduledValues(now);
  beatBus.gain.setValueAtTime(beatBus.gain.value, now);
  beatBus.gain.linearRampToValueAtTime(0, now + 0.5);
  setTimeout(() => { if (!wantBeat) haltLoop(); }, 600);
}

/* ───────────────────────── controls ───────────────────────── */

// Call from a tap/click: browsers only allow audio after a user gesture.
function unlock() {
  if (!ensure()) return;
  // iOS: play one silent sample inside the gesture
  const b = ctx.createBufferSource();
  b.buffer = ctx.createBuffer(1, 1, 22050);
  b.connect(ctx.destination);
  b.start(0);
}

function setMuted(m) {
  muted = m;
  localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  if (ctx) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
  }
}

// Don't keep thumping in a background tab.
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) { haltLoop(); ctx.suspend(); }
  else { ctx.resume(); if (wantBeat) runLoop(); }
});

export const sound = {
  unlock,
  tada,
  startBeat,
  stopBeat,
  setMuted,
  get muted() { return muted; },
};
