'use client'

import { useEffect, useState, useRef } from 'react'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
  delay?: number
  showGlow?: boolean
}

function getScoreGradient(score: number): { from: string; to: string } {
  if (score >= 70) return { from: '#22c55e', to: '#10b981' }
  if (score >= 40) return { from: '#eab308', to: '#f59e0b' }
  return { from: '#ef4444', to: '#dc2626' }
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Average'
  if (score >= 30) return 'Below Avg'
  return 'Critical'
}

export function ScoreRing({ score, size = 120, strokeWidth = 8, label, delay = 0, showGlow = false }: ScoreRingProps) {
  const [visible, setVisible] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)
  const frameRef = useRef<number>(0)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const colors = getScoreGradient(score)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true)
      
      // Simple counter animation - uses fewer frames
      const duration = 1200
      const startTime = performance.now()
      
      const tick = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayScore(Math.round(eased * score))
        
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick)
        }
      }
      
      frameRef.current = requestAnimationFrame(tick)
    }, delay * 1000)

    return () => {
      clearTimeout(timer)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [score, delay])

  const offset = visible ? circumference - (displayScore / 100) * circumference : circumference
  const gradientId = `g-${label || 's'}-${size}-${delay}`.replace(/[^a-zA-Z0-9-]/g, '')

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow - pure CSS, no motion */}
        {showGlow && (
          <div
            className="absolute inset-0 rounded-full blur-xl transition-opacity duration-700"
            style={{
              background: `radial-gradient(circle, ${colors.from}22 0%, transparent 70%)`,
              opacity: visible ? 1 : 0,
            }}
          />
        )}

        <svg
          width={size}
          height={size}
          className="-rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="dark:text-white/5 text-black/5"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.from} />
              <stop offset="100%" stopColor={colors.to} />
            </linearGradient>
          </defs>

          {/* Progress circle - CSS transition instead of Framer Motion */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold text-foreground transition-opacity duration-500"
            style={{
              fontSize: size >= 140 ? '2.5rem' : size >= 100 ? '1.75rem' : '1.25rem',
              opacity: visible ? 1 : 0,
            }}
          >
            {displayScore}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">/100</span>
        </div>
      </div>

      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}

      {!label && size >= 140 && (
        <span
          className="text-xs font-semibold mt-0.5 transition-opacity duration-500"
          style={{ color: colors.from, opacity: visible ? 1 : 0 }}
        >
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  )
}

export { getScoreGradient, getScoreLabel }
