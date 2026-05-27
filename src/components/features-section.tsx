'use client'

import { motion } from 'framer-motion'
import {
  Monitor,
  Search,
  Gauge,
  Accessibility,
  Smartphone,
  Palette,
  Flame,
  TrendingUp,
} from 'lucide-react'

const features = [
  {
    icon: Monitor,
    title: 'UI/UX Analysis',
    description: 'Deep analysis of your user interface design, navigation flow, and overall user experience quality.',
    gradient: 'from-purple-500 to-indigo-500',
    stat: '7',
    statLabel: 'categories',
  },
  {
    icon: Search,
    title: 'SEO Audit',
    description: 'Comprehensive search engine optimization check covering meta tags, headings, and content structure.',
    gradient: 'from-blue-500 to-cyan-500',
    stat: '15+',
    statLabel: 'checks',
  },
  {
    icon: Gauge,
    title: 'Performance Check',
    description: 'Speed and performance metrics analysis including load times, resource optimization, and Core Web Vitals.',
    gradient: 'from-green-500 to-emerald-500',
    stat: '<30s',
    statLabel: 'analysis',
  },
  {
    icon: Accessibility,
    title: 'Accessibility Audit',
    description: 'WCAG compliance check ensuring your website is usable by everyone, including users with disabilities.',
    gradient: 'from-amber-500 to-orange-500',
    stat: 'WCAG',
    statLabel: 'compliant',
  },
  {
    icon: Smartphone,
    title: 'Mobile Check',
    description: 'Responsive design analysis ensuring your site works flawlessly across all device sizes and orientations.',
    gradient: 'from-pink-500 to-rose-500',
    stat: '100%',
    statLabel: 'coverage',
  },
  {
    icon: Palette,
    title: 'Design Review',
    description: 'Visual design assessment covering color theory, typography, spacing, and overall aesthetic coherence.',
    gradient: 'from-violet-500 to-purple-500',
    stat: 'AI',
    statLabel: 'powered',
  },
  {
    icon: Flame,
    title: 'AI Roast',
    description: 'Get a hilarious, brutally honest AI-generated roast of your website. Choose professional or savage mode.',
    gradient: 'from-red-500 to-orange-500',
    stat: '2',
    statLabel: 'modes',
  },
  {
    icon: TrendingUp,
    title: 'Conversion Tips',
    description: 'Actionable suggestions to improve conversion rates, CTA placement, and user journey optimization.',
    gradient: 'from-teal-500 to-cyan-500',
    stat: '+40%',
    statLabel: 'avg lift',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative px-4 py-28">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full dark:bg-purple-600/[0.03] bg-purple-400/[0.03] blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 dark:bg-purple-500/10 bg-purple-50/80 px-4 py-1.5 text-xs dark:text-purple-300 text-purple-700 mb-4 badge-shimmer">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
            7-Category Deep Analysis
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Comprehensive{' '}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent animated-gradient-text">
              Website Analysis
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Our AI examines every aspect of your website and provides detailed, actionable insights
            across 7 critical categories.
          </p>
        </motion.div>

        {/* Feature grid with staggered animations */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative overflow-hidden rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-6 transition-all duration-200 dark:hover:border-white/[0.12] hover:border-muted-foreground/20 dark:hover:bg-white/[0.05] hover:bg-muted/50 cursor-default"
            >
              {/* Hover glow - CSS only */}
              <div className={`absolute -top-20 -right-20 h-48 w-48 rounded-full bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.08] blur-3xl`} />
              {/* Bottom glow on hover */}
              <div className={`absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.05] blur-3xl`} />

              <div className="relative">
                <div className="flex items-start justify-between mb-5">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg shadow-black/10 transition-transform duration-300 group-hover:scale-110`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">{feature.stat}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{feature.statLabel}</div>
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground group-hover:text-purple-400 transition-colors">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
