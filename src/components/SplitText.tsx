import { motion } from 'motion/react'

/** Word-by-word rise-in for headlines. The full text stays readable to assistive tech. */
export default function SplitText({
  text,
  className = '',
  delay = 0,
  stagger = 0.055,
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
}) {
  const words = text.split(' ')
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="-mb-[0.15em] inline-block overflow-hidden pb-[0.15em] align-bottom" aria-hidden>
          <motion.span
            className="inline-block"
            initial={{ y: '105%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: delay + i * stagger, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
