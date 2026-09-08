import { useRef, type CSSProperties, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

const fine = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

/**
 * Pointer-tracked 3D tilt with a light sweep (via --mx/--my). Inert on touch devices.
 * The wrapper supplies the perspective so children get true depth.
 */
export default function Tilt({
  children,
  className = '',
  max = 6,
  style,
}: {
  children: ReactNode
  className?: string
  max?: number
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 260, damping: 24 })
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 260, damping: 24 })

  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (!fine() || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    px.set(x)
    py.set(y)
    ref.current.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
    ref.current.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
  }
  function leave() {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <div style={{ perspective: 1000 }} className={className}>
      <motion.div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={leave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', ...style }}
        className="tilt-surface h-full"
      >
        {children}
      </motion.div>
    </div>
  )
}
