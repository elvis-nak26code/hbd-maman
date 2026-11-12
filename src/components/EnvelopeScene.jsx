import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/**
 * Scène d'ouverture : une enveloppe en 3D avec un sceau de cire.
 * Un clic (ou Entrée) ouvre le rabat, la lettre se soulève, puis on
 * passe à la lettre complète.
 */
export default function EnvelopeScene({ onOpen, onOpenStart }) {
  const [opening, setOpening] = useState(false)
  const [flapBack, setFlapBack] = useState(false)
  const timers = useRef([])

  useEffect(() => {
    return () => timers.current.forEach((t) => clearTimeout(t))
  }, [])

  const handleOpen = () => {
    if (opening) return
    // Démarre la musique immédiatement, dans le geste de l'utilisateur :
    // c'est le moment où les navigateurs mobiles autorisent le son.
    onOpenStart?.()
    setOpening(true)
    timers.current.push(setTimeout(() => setFlapBack(true), 420))
    timers.current.push(setTimeout(() => onOpen(), 1600))
  }

  return (
    <motion.section
      className="scene scene--envelope"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="halo" aria-hidden="true" />

      <motion.header
        className="envelope-head"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow">Aujourd&apos;hui, c&apos;est ton jour</p>
        <h1 className="script-title">Pour toi, Maman</h1>
        <p className="subtitle">Une lettre écrite avec tout mon amour</p>
      </motion.header>

      <motion.div
        className="envelope-stage"
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.button
          type="button"
          className={`envelope-btn ${opening ? 'is-open' : ''}`}
          onClick={handleOpen}
          aria-label="Ouvrir l'enveloppe"
          whileHover={opening ? undefined : { scale: 1.015 }}
          whileTap={opening ? undefined : { scale: 0.985 }}
        >
          <div className="envelope-float">
            <div className={`envelope ${opening ? 'is-open' : ''} ${flapBack ? 'flap-back' : ''}`}>
              <div className="env-shadow" aria-hidden="true" />
              <div className="env-back" aria-hidden="true" />

              <div className="env-letter" aria-hidden="true">
                <div className="env-letter-inner">
                  <span className="env-letter-heart">❤</span>
                  <span className="env-letter-lines" />
                  <span className="env-letter-lines short" />
                  <span className="env-letter-lines" />
                </div>
              </div>

              <div className="env-front" aria-hidden="true">
                <span className="env-fold env-fold--left" />
                <span className="env-fold env-fold--right" />
                <span className="env-fold env-fold--bottom" />
                <span className="env-sheen" />
                <span className="env-frame">
                  <span className="env-frame-inner" />
                </span>
                <span className="env-date">
                  <span className="env-date-rule" />
                  Le 12 Novembre
                  <span className="env-date-rule" />
                </span>
              </div>

              <div className="env-flap" aria-hidden="true">
                <span className="env-flap-shade" />
                <span className="env-flap-lining">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s-7.2-4.5-9.4-8.6C.7 9.1 2.6 5.3 6.1 4.7c2-.3 3.9.7 4.9 2.4h2c1-1.7 2.9-2.7 4.9-2.4 3.5.6 5.4 4.4 3.5 7.7C19.2 16.5 12 21 12 21z" />
                  </svg>
                </span>
                <svg
                  className="env-flap-edge"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M1.6 0 L50 96.8 L98.4 0"
                    fill="none"
                    stroke="rgba(176, 133, 72, 0.5)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <span className="env-flap-note">
                  <span className="env-flap-sender">Écrit par votre fils</span>
                  <span className="env-flap-name">Elvis</span>
                </span>
              </div>

              <span className="seal" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21s-7.2-4.5-9.4-8.6C.7 9.1 2.6 5.3 6.1 4.7c2-.3 3.9.7 4.9 2.4h2c1-1.7 2.9-2.7 4.9-2.4 3.5.6 5.4 4.4 3.5 7.7C19.2 16.5 12 21 12 21z" />
                </svg>
              </span>

              <span className="env-glow" aria-hidden="true" />
            </div>
          </div>
        </motion.button>

        <motion.div
          className="open-flash"
          aria-hidden="true"
          animate={opening ? { opacity: [0, 0.85, 0], scale: [0.2, 2.6, 3.4] } : { opacity: 0 }}
          transition={{ duration: 1.5, times: [0, 0.35, 1], ease: 'easeOut' }}
        />
      </motion.div>

      <motion.div
        className="hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: opening ? 0 : 1 }}
        transition={{ duration: 0.8, delay: opening ? 0 : 1.4 }}
      >
        <span className="hint-dot" aria-hidden="true" />
        <span>Touche l&apos;enveloppe pour l&apos;ouvrir</span>
        <span className="hint-note">♪</span>
      </motion.div>
    </motion.section>
  )
}
