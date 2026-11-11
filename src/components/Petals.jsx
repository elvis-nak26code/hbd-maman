import { useEffect, useRef } from 'react'

const COLORS = ['#f6d79b', '#f0b7c6', '#ffffff', '#e8c88a', '#f7c8d4']
const TYPES = ['petal', 'heart', 'spark']

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

/**
 * Ciel de pétales, cœurs et poussières d'or qui flottent doucement.
 * Dessiné sur un canvas pour rester fluide même sur téléphone.
 */
export default function Petals({ density = 1 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let items = []
    let raf = 0

    const makeItem = (initial = false) => {
      const type = Math.random() < 0.5 ? 'petal' : Math.random() < 0.6 ? 'heart' : 'spark'
      const size = type === 'spark' ? randomBetween(1, 2.6) : randomBetween(7, 18)
      return {
        type,
        x: randomBetween(-40, width + 40),
        y: initial ? randomBetween(-height, height) : randomBetween(-height * 0.4, -20),
        size,
        speed: type === 'spark' ? randomBetween(8, 22) : randomBetween(14, 38),
        drift: randomBetween(-14, 14),
        angle: randomBetween(0, Math.PI * 2),
        spin: randomBetween(-0.7, 0.7),
        sway: randomBetween(0.4, 1.4),
        phase: randomBetween(0, Math.PI * 2),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: type === 'spark' ? randomBetween(0.25, 0.8) : randomBetween(0.18, 0.5),
      }
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const base = Math.round((width * height) / 26000)
      const count = Math.max(18, Math.min(90, Math.round(base * density)))
      items = Array.from({ length: count }, () => makeItem(true))
    }

    const drawHeart = (size) => {
      ctx.beginPath()
      const s = size / 16
      ctx.moveTo(0, 4 * s)
      ctx.bezierCurveTo(0, 1 * s, -8 * s, 1 * s, -8 * s, 6 * s)
      ctx.bezierCurveTo(-8 * s, 11 * s, 0, 15 * s, 0, 16 * s)
      ctx.bezierCurveTo(0, 15 * s, 8 * s, 11 * s, 8 * s, 6 * s)
      ctx.bezierCurveTo(8 * s, 1 * s, 0, 1 * s, 0, 4 * s)
      ctx.closePath()
      ctx.fill()
    }

    const drawPetal = (size) => {
      ctx.beginPath()
      ctx.ellipse(0, 0, size * 0.5, size * 0.22, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    let last = performance.now()

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      ctx.clearRect(0, 0, width, height)

      for (const p of items) {
        p.phase += dt * p.sway
        p.y += p.speed * dt
        p.x += (p.drift + Math.sin(p.phase) * 16) * dt
        p.angle += p.spin * dt

        if (p.y - p.size > height + 20) {
          Object.assign(p, makeItem(false))
        }
        if (p.x < -60) p.x = width + 40
        if (p.x > width + 60) p.x = -40

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        if (p.type === 'heart') drawHeart(p.size)
        else if (p.type === 'petal') drawPetal(p.size)
        else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      raf = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)

    if (reduced) {
      // Une seule image fixe, sans animation
      ctx.clearRect(0, 0, width, height)
      for (const p of items) {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        if (p.type === 'heart') drawHeart(p.size)
        else if (p.type === 'petal') drawPetal(p.size)
        else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [density])

  return <canvas ref={canvasRef} className="petals" aria-hidden="true" />
}
