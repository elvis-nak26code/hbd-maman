/**
 * Une petite boîte à musique générée en direct avec la Web Audio API.
 * Aucun fichier audio n'est nécessaire : la mélodie est jouée note par note.
 *
 * Si tu préfères ta propre chanson, regarde `src/config.js` (MUSIC_SRC).
 *
 * Note importante : sur mobile, les navigateurs n'autorisent le son qu'après
 * une interaction de l'utilisateur. `start()` est donc appelé au chargement
 * (tentative) puis à chaque geste jusqu'à ce que ça fonctionne.
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
    this.failed = false
    this.step = 0
    this.nextNoteTime = 0
  }

  init() {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) {
      this.failed = true
      return false
    }
    const ctx = new Ctx()
    this.ctx = ctx

    const master = ctx.createGain()
    master.gain.value = 0.0001

    // Compresseur doux : évite la saturation sur les petits haut-parleurs.
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -20
    comp.knee.value = 26
    comp.ratio.value = 3
    comp.attack.value = 0.006
    comp.release.value = 0.3

    // Limiteur final : plus aucun pic ne peut « cracher ».
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -3
    limiter.knee.value = 0
    limiter.ratio.value = 20
    limiter.attack.value = 0.002
    limiter.release.value = 0.16

    master.connect(comp)
    comp.connect(limiter)
    limiter.connect(ctx.destination)
    this.master = master

    // Réverbération légère : deux lignes à retard croisées.
    // Beaucoup moins gourmand (et moins « métallique ») qu'un convolver,
    // qui faisait saccader le son sur les téléphones modestes.
    const revIn = ctx.createGain()
    const revOut = ctx.createGain()
    revOut.gain.value = 0.32

    const d1 = ctx.createDelay(0.5)
    d1.delayTime.value = 0.083
    const d2 = ctx.createDelay(0.5)
    d2.delayTime.value = 0.127

    const lp1 = ctx.createBiquadFilter()
    lp1.type = 'lowpass'
    lp1.frequency.value = 2400
    const lp2 = ctx.createBiquadFilter()
    lp2.type = 'lowpass'
    lp2.frequency.value = 1800

    const fb1 = ctx.createGain()
    fb1.gain.value = 0.3
    const fb2 = ctx.createGain()
    fb2.gain.value = 0.26

    revIn.connect(d1)
    d1.connect(lp1)
    lp1.connect(fb1)
    fb1.connect(d2)
    d2.connect(lp2)
    lp2.connect(fb2)
    fb2.connect(d1)
    lp1.connect(revOut)
    lp2.connect(revOut)
    revOut.connect(master)

    this.reverb = revIn

    return true
  }

  /** Note de boîte à musique : sinus + harmonique cristalline. */
  bell(freq, time, gain = 0.1, dur = 2.2) {
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
  pad(notes, time, dur, gain = 0.02) {
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
    g.gain.linearRampToValueAtTime(0.075, time + 0.05)
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
    const velocity = idx === 0 ? 0.12 : 0.085 + Math.random() * 0.02
    this.bell(midiToFreq(note) * human, time, velocity, 2.4)

    if (idx === 0) {
      this.bass(midiToFreq(chord.bass), time)
      this.pad(chord.notes, time, BAR * 0.98)
    }

    if (SPARKLE_STEPS.has(step % 32)) {
      this.bell(midiToFreq(chord.notes[3] + 12), time + EIGHTH * 0.5, 0.045, 2.8)
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

  /** @returns {Promise<boolean>} true si la musique joue vraiment. */
  async start() {
    if (this.playing) return true
    if (!this.ctx && !this.init()) return false
    const ctx = this.ctx

    if (ctx.state !== 'running') {
      if (this.starting) return false
      this.starting = true
      let resumed = false
      try {
        // Sur mobile, resume() peut rester en attente tant qu'il n'y a pas
        // de geste. On ne bloque donc pas indéfiniment.
        resumed = await Promise.race([
          ctx
            .resume()
            .then(() => ctx.state === 'running')
            .catch(() => false),
          new Promise((resolve) => setTimeout(() => resolve(false), 900)),
        ])
      } finally {
        this.starting = false
      }
      if (!resumed) return false
    }

    if (this.playing) return true

    this.playing = true
    this.started = true
    this.step = 0
    this.nextNoteTime = ctx.currentTime + 0.1
    const now = ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now)
    this.master.gain.linearRampToValueAtTime(0.62, now + 0.5)
    this.schedule()
    this.timer = setInterval(this.schedule, 60)
    return true
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

/** Même principe, mais avec un fichier audio classique. */
export class FileMusic {
  constructor(src) {
    this.audio = new Audio()
    this.audio.loop = true
    this.audio.volume = 0.7
    this.audio.preload = 'auto'
    this.audio.setAttribute('playsinline', '')
    this.audio.playsInline = true
    this.audio.src = src
    this.playing = false
    this.started = false
    this.failed = false

    this.audio.addEventListener('error', () => {
      this.failed = true
    })
  }

  async start() {
    if (this.playing) return true
    if (this.failed) return false
    try {
      await this.audio.play()
      this.playing = true
      this.started = true
      return true
    } catch {
      this.playing = false
      return false
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
