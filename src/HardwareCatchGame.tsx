import { useEffect, useRef, useState, type CSSProperties } from 'react'

type PartKind = 'bolt' | 'nut' | 'screw'

type FallingPart = {
  id: number
  lane: number
  y: number
  speed: number
  kind: PartKind
}

type HardwareCatchGameProps = {
  onComplete: (success: boolean) => void
}

const PART_KINDS: PartKind[] = ['bolt', 'nut', 'screw']
const REQUIRED_PARTS = 35
const TOTAL_PARTS = 40

function drawHexagon(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  context.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    if (i === 0) context.moveTo(px, py)
    else context.lineTo(px, py)
  }
  context.closePath()
}

function drawPart(
  context: CanvasRenderingContext2D,
  part: FallingPart,
  x: number,
  scale: number,
) {
  const y = part.y
  const shaftWidth = 7 * scale
  const shaftHeight = 27 * scale

  context.save()
  context.translate(x, y)
  context.lineWidth = 2 * scale
  context.lineJoin = 'round'
  context.strokeStyle = '#454d4c'

  if (part.kind === 'nut') {
    drawHexagon(context, 0, 0, 17 * scale)
    context.fillStyle = '#929b96'
    context.fill()
    context.stroke()
    context.beginPath()
    context.arc(0, 0, 6 * scale, 0, Math.PI * 2)
    context.fillStyle = '#45504e'
    context.fill()
    context.beginPath()
    context.arc(-2 * scale, -2 * scale, 3 * scale, Math.PI, Math.PI * 1.8)
    context.strokeStyle = '#d9ded6'
    context.lineWidth = 2 * scale
    context.stroke()
  } else {
    context.beginPath()
    context.roundRect(-shaftWidth / 2, -shaftHeight / 2, shaftWidth, shaftHeight, 2 * scale)
    context.fillStyle = '#aeb6b0'
    context.fill()
    context.stroke()

    for (let thread = -8; thread <= 8; thread += 6) {
      context.beginPath()
      context.moveTo(-shaftWidth / 2, thread * scale)
      context.lineTo(shaftWidth / 2, (thread - 4) * scale)
      context.strokeStyle = '#59625f'
      context.lineWidth = 1.5 * scale
      context.stroke()
    }

    if (part.kind === 'bolt') {
      drawHexagon(context, 0, -shaftHeight / 2 - 5 * scale, 11 * scale)
      context.fillStyle = '#d0d4cc'
      context.fill()
      context.stroke()
      context.beginPath()
      context.moveTo(-4 * scale, -shaftHeight / 2 - 5 * scale)
      context.lineTo(4 * scale, -shaftHeight / 2 - 5 * scale)
      context.strokeStyle = '#737c77'
      context.stroke()
    } else {
      context.beginPath()
      context.moveTo(-shaftWidth / 2, shaftHeight / 2 - 2 * scale)
      context.lineTo(0, shaftHeight / 2 + 8 * scale)
      context.lineTo(shaftWidth / 2, shaftHeight / 2 - 2 * scale)
      context.closePath()
      context.fillStyle = '#aeb6b0'
      context.fill()
      context.stroke()

      context.beginPath()
      context.ellipse(0, -shaftHeight / 2, 12 * scale, 7 * scale, 0, 0, Math.PI * 2)
      context.fillStyle = '#c7cdc5'
      context.fill()
      context.stroke()
      context.beginPath()
      context.moveTo(-5 * scale, -shaftHeight / 2)
      context.lineTo(5 * scale, -shaftHeight / 2)
      context.strokeStyle = '#59625f'
      context.stroke()
    }
  }

  context.restore()
}

export default function HardwareCatchGame({ onComplete }: HardwareCatchGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const basketLaneRef = useRef(1)
  const caughtCountRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  const [basketLane, setBasketLane] = useState(1)
  const [caughtCount, setCaughtCount] = useState(0)
  const [fallenCount, setFallenCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [showFailure, setShowFailure] = useState(false)
  const [started, setStarted] = useState(false)
  const [round, setRound] = useState(0)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!started) return

    const moveBasket = (direction: number) => {
      const nextLane = Math.max(0, Math.min(3, basketLaneRef.current + direction))
      basketLaneRef.current = nextLane
      setBasketLane(nextLane)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) return
      event.preventDefault()
      if (event.repeat) return
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') moveBasket(-1)
      if (event.code === 'ArrowRight' || event.code === 'KeyD') moveBasket(1)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [started])

  useEffect(() => {
    if (!started) return

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const duration = 30
    const parts: FallingPart[] = []
    const laneCount = 4
    let elapsed = 0
    let spawnTimer = 0
    let nextId = 0
    let spawnedCount = 0
    let lastTime = performance.now()
    let lastHudUpdate = 0
    let frame = 0
    let completed = false
    let catchFlash = 0
    let failureTimeout = 0
    setFallenCount(0)

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(bounds.width * pixelRatio)
      canvas.height = Math.round(bounds.height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    const draw = (now: number) => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (!width || !height) {
        frame = requestAnimationFrame(draw)
        return
      }

      const delta = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      elapsed += delta

      if (elapsed >= duration && !completed) {
        completed = true
        setTimeLeft(0)
        if (caughtCountRef.current >= REQUIRED_PARTS) {
          onCompleteRef.current(true)
        } else {
          setShowFailure(true)
          failureTimeout = window.setTimeout(() => {
            caughtCountRef.current = 0
            basketLaneRef.current = 1
            setCaughtCount(0)
            setBasketLane(1)
            setTimeLeft(duration)
            setShowFailure(false)
            setRound(value => value + 1)
          }, 4000)
        }
        return
      }

      const panel = context.createLinearGradient(0, 0, 0, height)
      panel.addColorStop(0, '#d7e2ad')
      panel.addColorStop(1, '#aebd83')
      context.fillStyle = panel
      context.fillRect(0, 0, width, height)

      const margin = width * 0.08
      const playWidth = width - margin * 2
      const laneWidth = playWidth / laneCount
      const laneCenter = (lane: number) => margin + laneWidth * (lane + 0.5)
      const basketY = height - 68

      context.fillStyle = 'rgba(30,48,37,0.08)'
      for (let row = 0; row < height; row += 5) {
        context.fillRect(margin, row, playWidth, 1)
      }

      context.strokeStyle = 'rgba(49,70,48,0.35)'
      context.lineWidth = 2
      for (let lane = 1; lane < laneCount; lane++) {
        const x = margin + laneWidth * lane
        context.beginPath()
        context.moveTo(x, 0)
        context.lineTo(x, basketY - 18)
        context.stroke()
      }

      const chutePulse = (Math.sin(elapsed * 5) + 1) * 0.5
      for (let lane = 0; lane < laneCount; lane++) {
        const x = laneCenter(lane)
        context.fillStyle = '#647254'
        context.fillRect(x - 20, 0, 40, 15)
        context.fillStyle = '#87956f'
        context.fillRect(x - 14, 15, 28, 12)
        context.fillStyle = `rgba(255,244,196,${0.12 + chutePulse * 0.15})`
        context.fillRect(x - 13, 27, 26, 4)
      }

      spawnTimer += delta
      const spawnInterval = Math.max(0.28, 0.68 - elapsed * 0.009)
      while (spawnTimer >= spawnInterval && spawnedCount < TOTAL_PARTS) {
        spawnTimer -= spawnInterval
        spawnedCount += 1
        setFallenCount(spawnedCount)
        parts.push({
          id: nextId++,
          lane: Math.floor(Math.random() * laneCount),
          y: -28,
          speed: 135 + elapsed * 3 + Math.random() * 35,
          kind: PART_KINDS[Math.floor(Math.random() * PART_KINDS.length)],
        })
      }

      for (let index = parts.length - 1; index >= 0; index--) {
        const part = parts[index]
        const previousY = part.y
        part.y += part.speed * delta

        if (part.lane === basketLaneRef.current && previousY < basketY && part.y >= basketY - 12) {
          parts.splice(index, 1)
          caughtCountRef.current += 1
          setCaughtCount(caughtCountRef.current)
          catchFlash = 0.18
          continue
        }

        if (part.y > height + 32) {
          parts.splice(index, 1)
        }
      }

      for (const part of parts) {
        const fallProgress = Math.min(1, part.y / height)
        drawPart(context, part, laneCenter(part.lane), 0.72 + fallProgress * 0.42)
      }

      if (catchFlash > 0) {
        catchFlash = Math.max(0, catchFlash - delta)
        context.fillStyle = `rgba(255,250,205,${catchFlash * 0.8})`
        context.fillRect(margin, basketY - 25, playWidth, 55)
      }

      const basketX = laneCenter(basketLaneRef.current)
      const basketWidth = Math.min(laneWidth * 0.7, 110)
      context.fillStyle = 'rgba(37,47,34,0.25)'
      context.beginPath()
      context.ellipse(basketX, basketY + 23, basketWidth * 0.56, 9, 0, 0, Math.PI * 2)
      context.fill()

      context.fillStyle = '#a55836'
      context.beginPath()
      context.moveTo(basketX - basketWidth / 2, basketY - 12)
      context.lineTo(basketX + basketWidth / 2, basketY - 12)
      context.lineTo(basketX + basketWidth * 0.38, basketY + 27)
      context.lineTo(basketX - basketWidth * 0.38, basketY + 27)
      context.closePath()
      context.fill()
      context.strokeStyle = '#593f2b'
      context.lineWidth = 4
      context.stroke()
      context.strokeStyle = '#e4bc77'
      context.lineWidth = 6
      context.beginPath()
      context.ellipse(basketX, basketY - 12, basketWidth / 2, 9, 0, Math.PI, Math.PI * 2)
      context.stroke()
      context.strokeStyle = '#784a30'
      context.lineWidth = 3
      context.beginPath()
      context.ellipse(basketX, basketY - 12, basketWidth / 2, 9, 0, 0, Math.PI)
      context.stroke()

      if (now - lastHudUpdate > 100) {
        setTimeLeft(Math.ceil(duration - elapsed))
        lastHudUpdate = now
      }

      frame = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(failureTimeout)
      window.removeEventListener('resize', resize)
    }
  }, [round, started])

  const moveBasket = (direction: number) => {
    const nextLane = Math.max(0, Math.min(3, basketLaneRef.current + direction))
    basketLaneRef.current = nextLane
    setBasketLane(nextLane)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: '22px 16px',
        overflow: 'auto',
        color: '#352c23',
        background: 'radial-gradient(ellipse at 50% 0%, #f3e8c8, #c9ad83 75%)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {!started ? (
        <div style={{ width: 'min(620px, 100%)', padding: '30px 28px', border: '3px solid #78492f', borderRadius: 18, background: '#f2dfb3', boxShadow: '0 18px 60px rgba(49,35,25,.4)', textAlign: 'center' }}>
          <div style={{ color: '#7c4932', letterSpacing: 2, fontSize: 13, fontWeight: 700 }}>МАСТЕРСКАЯ ДЕДА</div>
          <h2 style={{ margin: '8px 0 18px', fontSize: 'clamp(24px, 5vw, 34px)' }}>Собери детали для деда!</h2>
          <div style={{ fontSize: 18, lineHeight: 1.6, textAlign: 'left' }}>
            <p style={{ margin: '0 0 10px' }}>За 30 секунд сверху упадут ровно <strong>{TOTAL_PARTS} деталей</strong>: болты, гайки и винтики.</p>
            <p style={{ margin: '0 0 10px' }}>Поймай в корзинку не меньше <strong>{REQUIRED_PARTS} деталей</strong>, чтобы пройти игру. Можно пропустить только 5.</p>
            <p style={{ margin: 0 }}>Управляй корзинкой клавишами <strong>← / →</strong> или <strong>A / D</strong>. На телефоне можно нажимать экранные стрелки.</p>
          </div>
          <button type="button" onClick={() => setStarted(true)} style={{ ...buttonStyle, width: '100%', height: 52, marginTop: 24, fontSize: 19 }}>Начать игру</button>
        </div>
      ) : <>
      <div style={{ width: 'min(760px, 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ color: '#7c4932', letterSpacing: 2, fontSize: 13, fontWeight: 700 }}>МАСТЕРСКАЯ ДЕДА</div>
          <h2 style={{ margin: '5px 0 0', fontSize: 'clamp(20px, 4vw, 30px)' }}>Лови детали: поймай {REQUIRED_PARTS} из {TOTAL_PARTS}!</h2>
        </div>
        <div style={{ display: 'flex', gap: 18, fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 700, whiteSpace: 'nowrap' }}>
          <span>Детали: {caughtCount} / {REQUIRED_PARTS}</span>
          <span>Появилось: {fallenCount} / {TOTAL_PARTS}</span>
          <span style={{ color: timeLeft <= 5 ? '#a73527' : '#352c23' }}>{timeLeft} сек.</span>
        </div>
      </div>

      <div style={{ width: 'min(760px, 100%)', height: 'min(58vh, 470px)', minHeight: 280, padding: 10, border: '8px solid #78492f', borderRadius: 24, background: '#ac7049', boxShadow: 'inset 0 0 0 3px #e6c08a, 0 16px 42px rgba(49,35,25,.35)' }}>
        <canvas
          ref={canvasRef}
          aria-label={`Игра-ловилка. Корзинка на дорожке ${basketLane + 1}`}
          style={{ display: 'block', width: '100%', height: '100%', border: '4px solid #4a593e', borderRadius: 8, background: '#c8d69b', imageRendering: 'pixelated' }}
        />
      </div>

      <div style={{ width: 'min(760px, 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ color: '#4c4034', fontSize: 15 }}>← → или A / D — поймай минимум {REQUIRED_PARTS} из {TOTAL_PARTS} деталей за 30 секунд</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => moveBasket(-1)} aria-label="Подвинуть корзинку влево" style={buttonStyle}>←</button>
          <button type="button" onClick={() => moveBasket(1)} aria-label="Подвинуть корзинку вправо" style={buttonStyle}>→</button>
        </div>
      </div>

      {showFailure && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(30,24,20,.76)' }}>
          <div style={{ maxWidth: 620, padding: '28px 34px', border: '3px solid #78492f', borderRadius: 14, background: '#f2dfb3', color: '#713a2d', boxShadow: '0 18px 60px rgba(0,0,0,.45)', textAlign: 'center', fontSize: 'clamp(23px, 5vw, 38px)', lineHeight: 1.25, fontWeight: 800 }}>
            ты все просыпал, давай заново!!!
          </div>
        </div>
      )}
      </>}
    </div>
  )
}

const buttonStyle: CSSProperties = {
  width: 48,
  height: 42,
  border: '2px solid #75472f',
  borderRadius: 8,
  background: '#eed39d',
  color: '#4a3425',
  fontSize: 22,
  fontWeight: 700,
  cursor: 'pointer',
}
