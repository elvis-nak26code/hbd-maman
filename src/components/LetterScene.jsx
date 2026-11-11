import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, useCallback, useRef, useState } from 'react'
import { MAMAN } from '../config.js'
import { PARAGRAPHS } from '../data/letter.js'

function RichText({ text }) {
  return text.split('**').map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>,
  )
}

function Ornament() {
  return (
    <div className="ornament" aria-hidden="true">
      <span className="ornament-line" />
      <svg viewBox="0 0 32 20" className="ornament-heart">
        <path d="M16 18.6S4.4 11.4 2.2 6.9C.6 3.6 3 1 5.9 1c2 0 3.7 1.1 4.6 2.8h11c.9-1.7 2.6-2.8 4.6-2.8 2.9 0 5.3 2.6 3.7 5.9C27.6 11.4 16 18.6 16 18.6z" />
      </svg>
      <span className="ornament-line" />
    </div>
  )
}

const EASE = [0.22, 1, 0.36, 1]

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 24, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 1, delay, ease: EASE },
})

export default function LetterScene({ onReplay }) {
  const [hearts, setHearts] = useState([])
  const idRef = useRef(0)

  const burst = useCallback(() => {
    const batch = Array.from({ length: 16 }, () => {
      idRef.current += 1
      return {
        id: idRef.current,
        x: (Math.random() - 0.5) * 240,
        drift: (Math.random() - 0.5) * 120,
        size: 14 + Math.random() * 22,
        delay: Math.random() * 0.25,
        duration: 1.8 + Math.random() * 1.4,
        rotate: (Math.random() - 0.5) * 60,
        char: Math.random() < 0.75 ? '❤' : '✿',
      }
    })
    setHearts((prev) => [...prev, ...batch])
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !batch.some((b) => b.id === h.id)))
    }, 3600)
  }, [])

  return (
    <motion.section
      className="scene scene--letter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <div className="letter-glow" aria-hidden="true" />

      <div className="letter-wrap">
        <motion.article
          className="letter-card"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="card-corner card-corner--tl" aria-hidden="true" />
          <span className="card-corner card-corner--tr" aria-hidden="true" />
          <span className="card-corner card-corner--bl" aria-hidden="true" />
          <span className="card-corner card-corner--br" aria-hidden="true" />

          <header className="letter-head">
            <motion.p className="letter-eyebrow" {...reveal(0.25)}>
              Aujourd&apos;hui, c&apos;est ton jour
            </motion.p>

            <motion.h1 className="letter-title" {...reveal(0.38)}>
              Joyeux Anniversaire
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, scaleX: 0.4 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 1, delay: 0.58, ease: EASE }}
            >
              <Ornament />
            </motion.div>

            <motion.p className="letter-name" {...reveal(0.68)}>
              {MAMAN}
            </motion.p>
          </header>

          <div className="letter-body">
            {PARAGRAPHS.map((paragraph, index) => (
              <motion.p
                key={index}
                className={index === 0 ? 'lead' : undefined}
                initial={{ opacity: 0, y: 26, filter: 'blur(4px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 1, ease: EASE, delay: index === 0 ? 0.9 : 0 }}
              >
                <RichText text={paragraph} />
              </motion.p>
            ))}
          </div>

          <motion.footer
            className="letter-sign"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1 }}
          >
            <p className="sign-line">Avec tout mon amour,</p>
            <p className="sign-name">Ton enfant</p>
            <span className="sign-heart" aria-hidden="true">
              ❤
            </span>
          </motion.footer>
        </motion.article>

        <motion.div
          className="letter-actions"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <button type="button" className="soft-btn" onClick={burst}>
            <span aria-hidden="true">❤</span> Encore des cœurs
          </button>
          <button type="button" className="soft-btn soft-btn--ghost" onClick={onReplay}>
            Revoir l&apos;enveloppe
          </button>
        </motion.div>

        <p className="letter-foot">Fait avec amour, pour toi.</p>
      </div>

      <div className="hearts-layer" aria-hidden="true">
        <AnimatePresence>
          {hearts.map((h) => (
            <motion.span
              key={h.id}
              className="burst-heart"
              style={{ left: '50%', bottom: '14%', fontSize: h.size }}
              initial={{ opacity: 0, y: 0, x: h.x, scale: 0.4, rotate: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -260 - Math.random() * 160,
                x: h.x + h.drift,
                scale: [0.4, 1, 0.9],
                rotate: h.rotate,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: h.duration, delay: h.delay, ease: 'easeOut' }}
            >
              {h.char}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}
