import { useEffect, useRef, useState } from 'react'

/**
 * 3D Iron Man helmet logo.
 *
 * A layered set of CSS 3D panels. Helmet parts are painted back-to-front
 * (skull, ears, red face guard, jaw, gold mask with glowing eyes), and every
 * slab is extruded into a real 3D box by repeating its outline at several
 * depths. Depths are in `em` against font-size = logo size, so the whole
 * helmet scales with `size` without any per-pixel maths.
 */

const SHELL_LAYERS = 10
const GUARD_LAYERS = 8
const JAW_LAYERS = 6
const FACE_LAYERS = 6
const EAR_LAYERS = 6

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

function panels(cls: string, layers: number, depthEm: number, children?: React.ReactNode) {
  return range(layers).map((i) => (
    <div
      key={`${cls}-${i}`}
      className={`hp ${cls}${i === layers - 1 ? ' hp-cap' : ''}`}
      style={{ transform: `translateZ(${((i / (layers - 1)) * depthEm).toFixed(3)}em)` }}
    >
      {i === layers - 1 ? children : null}
    </div>
  ))
}

export default function IronManLogo({ size = 140, spin = true }: { size?: number; spin?: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  // Start slightly turned so the logo reads as 3D the moment it appears.
  const rotation = useRef({ x: -6, y: -22 })

  const apply = () => {
    const el = stageRef.current
    if (!el) return
    el.style.setProperty('--rx', `${rotation.current.x}deg`)
    el.style.setProperty('--ry', `${rotation.current.y}deg`)
  }

  useEffect(() => {
    apply()
  }, [])

  // Auto-rotate with requestAnimationFrame (a CSS animation would fight the drag).
  useEffect(() => {
    if (!spin || dragging || hovered) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      rotation.current.y += (now - last) * 0.03
      last = now
      apply()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [spin, dragging, hovered])

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true)
    const start = { x: e.clientX, y: e.clientY, rx: rotation.current.x, ry: rotation.current.y }
    const move = (ev: PointerEvent) => {
      rotation.current.y = start.ry + (ev.clientX - start.x) * 0.5
      rotation.current.x = Math.max(-45, Math.min(45, start.rx - (ev.clientY - start.y) * 0.4))
      apply()
    }
    const up = () => {
      setDragging(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      className={`ironman-logo ${dragging ? 'is-dragging' : ''}`}
      style={{ ['--logo-size' as string]: `${size}px`, fontSize: `${size / 16}px` }}
      role="img"
      aria-label="3D Iron Man helmet logo"
      ref={stageRef}
      onPointerDown={onPointerDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="logo-glow" aria-hidden="true" />
      <div className="logo-stage" aria-hidden="true">
        {/* skull shell */}
        <div className="hp-group">{panels('hp-shell', SHELL_LAYERS, 4.6)}</div>

        {/* side ear plates */}
        <div className="hp-group">
          {panels('hp-ear hp-ear-r', EAR_LAYERS, 3.2)}
          {panels('hp-ear hp-ear-l', EAR_LAYERS, 3.2)}
        </div>

        {/* red face guard */}
        <div className="hp-group">{panels('hp-guard', GUARD_LAYERS, 3.6)}</div>

        {/* jaw / chin */}
        <div className="hp-group">{panels('hp-jaw', JAW_LAYERS, 2.6)}</div>

        {/* gold face plate, with the glowing eyes on its front cap */}
        <div className="hp-group">
          {panels(
            'hp-face',
            FACE_LAYERS,
            1.6,
            <>
              <span className="lf-eye lf-eye-l" />
              <span className="lf-eye lf-eye-r" />
              <span className="lf-nose" />
              <span className="lf-mouth" />
            </>,
          )}
        </div>
      </div>
    </div>
  )
}
