import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'

/** Number that counts up from 0 the first time it scrolls into view. */
export default function Counter({
  value,
  format = (n) => Math.round(n).toLocaleString('en-AU'),
  duration = 1.5,
  delay = 0,
  className,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setN(value)
      return
    }
    const c = animate(0, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setN(v),
    })
    return () => c.stop()
  }, [inView, value, duration, delay, reduce])

  return (
    <span ref={ref} className={className}>
      {format(n)}
    </span>
  )
}
