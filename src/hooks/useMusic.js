import { useCallback, useEffect, useRef, useState } from 'react'
import { FileMusic, MusicBox } from '../lib/music.js'
import { MUSIC_SRC } from '../config.js'

/**
 * Gère la musique : démarre toute seule au premier geste de l'utilisateur
 * (les navigateurs interdisent le son 100% automatique), puis reste
 * contrôlable via le bouton flottant.
 */
export function useMusic() {
  const engineRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)

  if (!engineRef.current) {
    engineRef.current = MUSIC_SRC ? new FileMusic(MUSIC_SRC) : new MusicBox()
  }

  const start = useCallback(async () => {
    const engine = engineRef.current
    if (!engine) return
    await engine.start()
    setPlaying(engine.playing)
    if (engine.started) setStarted(true)
  }, [])

  const toggle = useCallback(async () => {
    const engine = engineRef.current
    if (!engine) return
    const next = await engine.toggle()
    setPlaying(next)
    if (engine.started) setStarted(true)
  }, [])

  // Premier geste = on lance la musique (clavier, clic, toucher)
  useEffect(() => {
    let done = false
    const kick = () => {
      if (done) return
      done = true
      start()
      remove()
    }
    const remove = () => {
      window.removeEventListener('pointerdown', kick)
      window.removeEventListener('keydown', kick)
      window.removeEventListener('touchstart', kick)
    }
    window.addEventListener('pointerdown', kick, { passive: true })
    window.addEventListener('keydown', kick)
    window.addEventListener('touchstart', kick, { passive: true })
    return remove
  }, [start])

  return { playing, started, start, toggle }
}
