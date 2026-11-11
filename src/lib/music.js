/**
 * Une petite boîte à musique générée en direct avec la Web Audio API.
 * Aucun fichier audio n'est nécessaire : la mélodie est jouée note par note.
 *
 * Si tu préfères ta propre chanson, regarde `src/config.js` (MUSIC_SRC).
 */

const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12)

// Progression douce en Fa majeur : F – C – Ré m – Si b
const CHORDS = [
  { bass: 41, notes: [65, 69, 72, 77] }, // Fa
  { bass: 36, notes: [60, 64, 67, 72] }, // Do
  { bass: 38, notes: [62, 65, 69, 74] }, // Ré m
  { bass: 34, notes: [58, 62, 65, 70] }, // Si b
]

// Motif de la boîte à musique (indices dans l'accord, par croche)
const PATTERN = [0, 1, 2, 3, 2, 1, 2, 3]
const SPARKLE_STEPS = new Set([3, 11, 19, 27])

const TEMPO = 64
const EIGHTH = 60 / TEMPO / 2
const BAR = EIGHTH * 8

export class MusicBox {
  constructor() {
    this.ctx = null
    this.master = null
    this.reverb = null
    this.timer = null
    this.playing = false
    this.started = false
    this.starting = false
    this.step = 0
    this.nextNoteTime = 0
  }

  init() {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return false
    const ctx = new Ctx()
    this.ctx = ctx

    const master = ctx.createGain()
    master.gain.value = 0.0
    master.connect(ctx.destination)
    this.master = master

    // Réverbération artisanale (bruit qui s'éteint)
    const convolver = ctx.createConvolver()
    convolver.buffer = this.makeImpulse(ctx, 3.2, 2.6)
    const wet = ctx.createGain()
    wet.gain.value = 0.55
    convolver.connect(wet)
    wet.connect(master)
    this.reverb = convolver

    return true
  }

  makeImpulse(ctx, seconds, decay) {
    const rate = ctx.sampleRate
    const length = Math.floor(rate * seconds)
    const buffer = ctx.createBuffer(2, length, rate)
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch)
      for (let i = 0; i < length; i++) {
        const t = i / length
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay)
      }
    }
    return buffer
  }

  /** Note de boîte à musique : sinus + harmonique cristalline. */
  bell(freq, time, gain = 0.075, dur = 2.6) {
    const ctx = this.ctx
    const out = ctx.createGain()
    out.gain.setValueAtTime(0.0001, time)
    out.gain.exponentialRampToValueAtTime(gain, time + 0.008)
    out.gain.exponentialRampToValueAtTime(0.0001, time + dur)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(5200, time)
    filter.frequency.exponentialRampToValueAtTime(1400, time + dur)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, time)

    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(freq * 2.005, time)
    const hGain = ctx.createGain()
    hGain.gain.value = 0.22
    osc2.connect(hGain)
    hGain.connect(filter)

    osc.connect(filter)
    filter.connect(out)
    out.connect(this.master)
    out.connect(this.reverb)

    osc.start(time)
    osc2.start(time)
    osc.stop(time + dur + 0.1)
    osc2.stop(time + dur + 0.1)
  }

  /** Nappe discrète qui tient l'harmonie. */
  pad(notes, time, dur, gain = 0.016) {
    const ctx = this.ctx
    notes.forEach((midi, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = midiToFreq(midi - 12)
      osc.detune.value = i === 0 ? -4 : 4

      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, time)
      g.gain.linearRampToValueAtTime(gain, time + 1.6)
      g.gain.linearRampToValueAtTime(0.0001, time + dur + 0.4)

      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 900

      osc.connect(g)
      g.connect(lp)
      lp.connect(this.master)
      lp.connect(this.reverb)

      osc.start(time)
      osc.stop(time + dur + 0.5)
    })
  }

  bass(freq, time) {
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, time)

    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, time)
    g.gain.linearRampToValueAtTime(0.05, time + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, time + 2.4)

    osc.connect(g)
    g.connect(this.master)
    g.connect(this.reverb)
    osc.start(time)
    osc.stop(time + 2.5)
  }

  playStep(step, time) {
    const bar = Math.floor(step / 8)
    const chord = CHORDS[bar % CHORDS.length]
    const idx = step % 8
    const note = chord.notes[PATTERN[idx]]

    // Petite variation humaine pour ne pas être trop mécanique
    const human = 1 + (Math.random() - 0.5) * 0.004
    const velocity = idx === 0 ? 0.085 : 0.055 + Math.random() * 0.015
    this.bell(midiToFreq(note) * human, time, velocity, 2.9)

    if (idx === 0) {
      this.bass(midiToFreq(chord.bass), time)
      this.pad(chord.notes, time, BAR * 0.98)
    }

    if (SPARKLE_STEPS.has(step % 32)) {
      this.bell(midiToFreq(chord.notes[3] + 12), time + EIGHTH * 0.5, 0.03, 3.4)
    }
  }

  schedule = () => {
    if (!this.playing) return
    while (this.nextNoteTime < this.ctx.currentTime + 0.25) {
      this.playStep(this.step, this.nextNoteTime)
      this.step += 1
      this.nextNoteTime += EIGHTH
    }
  }

  async start() {
    if (this.playing || this.starting) return
    if (!this.ctx && !this.init()) return
    const ctx = this.ctx
    if (ctx.state === 'suspended') {
      this.starting = true
      try {
        await ctx.resume()
      } catch {
        this.starting = false
        return
      }
      this.starting = false
    }
    if (this.playing) return
    this.playing = true
    this.started = true
    this.step = 0
    this.nextNoteTime = ctx.currentTime + 0.1
    const now = ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(this.master.gain.value || 0.0001, now)
    this.master.gain.linearRampToValueAtTime(0.9, now + 2.2)
    this.schedule()
    this.timer = setInterval(this.schedule, 60)
  }

  pause() {
    if (!this.playing) return
    this.playing = false
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    if (this.ctx) {
      const now = this.ctx.currentTime
      this.master.gain.cancelScheduledValues(now)
      this.master.gain.setValueAtTime(this.master.gain.value, now)
      this.master.gain.linearRampToValueAtTime(0.0001, now + 0.6)
    }
  }

  async toggle() {
    if (this.playing) this.pause()
    else await this.start()
    return this.playing
  }

  destroy() {
    this.pause()
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
  }
}

/** Même boîte à musique, mais avec un fichier audio classique. */
export class FileMusic {
  constructor(src) {
    this.audio = new Audio(src)
    this.audio.loop = true
    this.audio.volume = 0.65
    this.audio.preload = 'auto'
    this.playing = false
    this.started = false
  }

  async start() {
    if (this.playing) return
    try {
      await this.audio.play()
      this.playing = true
      this.started = true
    } catch {
      this.playing = false
    }
  }

  pause() {
    this.audio.pause()
    this.playing = false
  }

  async toggle() {
    if (this.playing) this.pause()
    else await this.start()
    return this.playing
  }

  destroy() {
    this.pause()
    this.audio.src = ''
  }
}
