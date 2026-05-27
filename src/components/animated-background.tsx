'use client'

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 dark:bg-[#07070a] bg-gray-50" />

      {/* Floating orbs - CSS animations instead of Framer Motion for performance */}
      <div
        className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full dark:bg-purple-600/15 bg-purple-300/20 blur-[120px] animate-orb1"
      />
      <div
        className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full dark:bg-indigo-600/10 bg-indigo-300/15 blur-[140px] animate-orb2"
      />
      <div
        className="absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full dark:bg-cyan-500/8 bg-cyan-300/10 blur-[100px] animate-orb3"
      />
      {/* 4th orb - rose/pink with different timing */}
      <div
        className="absolute top-2/3 -left-20 h-[450px] w-[450px] rounded-full dark:bg-rose-500/10 bg-rose-300/12 blur-[110px] animate-orb4"
      />

      {/* Grid overlay - enhanced with fade-out at edges */}
      <div
        className="absolute inset-0 dark:opacity-[0.025] opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />

      {/* Noise texture overlay - subtle dot pattern for depth */}
      <div
        className="absolute inset-0 dark:opacity-[0.03] opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Vignette / radial gradient overlay - darker edges, lighter center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
        }}
      />
      {/* Light mode vignette */}
      <div
        className="absolute inset-0 pointer-events-none dark:hidden"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.06) 100%)',
        }}
      />
      {/* Dark mode vignette */}
      <div
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />


    </div>
  )
}
