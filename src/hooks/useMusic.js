import { useCallback, useEffect, useRef, useState } from 'react'
import { FileMusic, MusicBox } from '../lib/music.js'
import { MUSIC_SRC } from '../config.js'

/**
 * Gère la musique.
 *
 * Stratégie pour que ça marche partout (surtout sur téléphone) :
 *  1. on tente un démarrage automatique au chargement ;
 *  2. si le navigateur le refuse (règle d'autoplay), on réessaie à CHAQUE
 *     geste (toucher, clic, touche du clavier) jusqu'à ce que ça marche ;
 *  3. si l'autoplay est refusé, une petite pastille « Activer la musique »
 *     apparaît à côté du bouton pour prévenir ;
 *  4. dès que la musique a démarré une fois, les gestes ne la relancent plus
 *     (seul le bouton la contrôle).
 */
export function useMusic() {
  const engineRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const blockTimer = useRef(null)

  if (!engineRef.current) {
    engineRef.current = MUSIC_SRC ? new FileMusic(MUSIC_SRC) : new MusicBox()
  }

  const start = useCallback(async ({ auto = false } = {}) => {
    let engine = engineRef.current
    if (!engine) return false

    // Si le fichier audio ne charge pas (mauvais chemin après hébergement),
    // on bascule automatiquement sur la boîte à musique intégrée.
    if (engine.failed) {
      engine = new MusicBox()
      engineRef.current = engine
    }

    const ok = await engine.start()

    if (ok) {
      if (blockTimer.current) clearTimeout(blockTimer.current)
      setPlaying(true)
      setUnlocked(true)
      setBlocked(false)
    } else if (auto) {
      // On ne montre l'invitation qu'après un petit délai, pour ne pas
      // clignoter au chargement.
      if (blockTimer.current) clearTimeout(blockTimer.current)
      blockTimer.current = setTimeout(() => setBlocked(true), 900)
    }

    return ok
  }, [])

  const toggle = useCallback(async () => {
    const engine = engineRef.current
    if (!engine) return
    if (engine.playing) {
      engine.pause()
      setPlaying(false)
    } else {
      await start()
    }
  }, [start])

  useEffect(() => {
    if (unlocked) return

    const events = ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown']
    const kick = () => {
      start()
    }

    events.forEach((e) => window.addEventListener(e, kick, { passive: true }))

    const autoTimer = setTimeout(() => {
      start({ auto: true })
    }, 350)

    return () => {
      clearTimeout(autoTimer)
      if (blockTimer.current) clearTimeout(blockTimer.current)
      events.forEach((e) => window.removeEventListener(e, kick))
    }
  }, [unlocked, start])

  return { playing, blocked: blocked && !playing, start, toggle }
}
