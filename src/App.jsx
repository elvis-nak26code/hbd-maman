import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import EnvelopeScene from './components/EnvelopeScene.jsx'
import LetterScene from './components/LetterScene.jsx'
import MusicToggle from './components/MusicToggle.jsx'
import Petals from './components/Petals.jsx'
import { useMusic } from './hooks/useMusic.js'

export default function App() {
  const [opened, setOpened] = useState(false)
  const music = useMusic()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [opened])

  return (
    <div className="app">
      <div className="bg-aurora" aria-hidden="true" />
      <Petals />
      <div className="grain" aria-hidden="true" />

      <AnimatePresence mode="wait">
        {opened ? (
          <LetterScene key="letter" onReplay={() => setOpened(false)} />
        ) : (
          <EnvelopeScene key="envelope" onOpen={() => setOpened(true)} />
        )}
      </AnimatePresence>

      <MusicToggle playing={music.playing} onToggle={music.toggle} />
    </div>
  )
}
