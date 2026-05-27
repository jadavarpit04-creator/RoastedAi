'use client'

import { motion } from 'framer-motion'
import { Star, Quote, Flame, Zap, ArrowRight } from 'lucide-react'

const roastExamples = [
  {
    score: 34,
    website: 'retail-chaos.com',
    roast: "This website looks like it was designed during a power outage. Navigation is like a maze designed by someone who hates visitors. Your CTA button is hiding like it owes money.",
    mode: 'savage' as const,
  },
  {
    score: 72,
    website: 'techstartup.io',
    roast: "Solid fundamentals but your hero section has the energy of a corporate memo. The typography screams 'I downloaded a free template' but at least it's consistent.",
    mode: 'savage' as const,
  },
  {
    score: 91,
    website: 'designstudio.co',
    roast: "Now THIS is how you design a website. Clean hierarchy, beautiful spacing, and CTAs that actually make you want to click. Rare to see something this polished.",
    mode: 'professional' as const,
  },
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Product Designer at Stripe',
    text: 'RoastMySite AI found accessibility issues that our entire team missed. The savage mode had us dying laughing while actually learning.',
    avatar: 'SC',
  },
  {
    name: 'Marcus Rodriguez',
    role: 'CEO at LaunchPad',
    text: 'We improved our conversion rate by 40% after implementing the AI suggestions. The detailed analysis was worth every second.',
    avatar: 'MR',
  },
  {
    name: 'Emily Watson',
    role: 'Frontend Lead at Vercel',
    text: "This tool is like having a senior UX reviewer on demand. The multi-category scoring system is incredibly thorough and actionable.",
    avatar: 'EW',
  },
]

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-400 bg-green-500/10 border-green-500/20' 
    : score >= 40 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' 
    : 'text-red-400 bg-red-500/10 border-red-500/20'

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-sm font-bold ${color}`}>
      {score}/100
    </span>
  )
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function RoastExamplesSection() {
  return (
    <section className="relative px-4 py-28">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-0 h-[400px] w-[400px] rounded-full dark:bg-orange-600/[0.03] bg-orange-400/[0.03] blur-[150px]" />
        <div className="absolute bottom-1/4 left-0 h-[300px] w-[300px] rounded-full dark:bg-red-600/[0.03] bg-red-400/[0.03] blur-[150px]" />
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
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 dark:bg-orange-500/10 bg-orange-50/80 px-4 py-1.5 text-xs dark:text-orange-300 text-orange-700 mb-4 badge-shimmer">
            <Flame className="h-3 w-3 animate-pulse" />
            Real AI Output
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            See the AI in{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent animated-gradient-text">
              Action
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Real examples of what our AI roaster has to say about websites.
          </p>
        </motion.div>

        {/* Roast examples */}
        <div className="grid gap-5 md:grid-cols-3">
          {roastExamples.map((example, index) => (
            <motion.div
              key={example.website}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative overflow-hidden rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-6 transition-all duration-200 dark:hover:border-white/[0.12] hover:border-muted-foreground/20"
            >
              {/* Hover glow */}
              <div className={`absolute -top-20 -right-20 h-48 w-48 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-[0.07] blur-3xl ${
                example.mode === 'savage'
                  ? 'bg-gradient-to-br from-red-500 to-orange-500'
                  : 'bg-gradient-to-br from-purple-500 to-indigo-500'
              }`} />

              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                      example.mode === 'savage' 
                        ? 'bg-gradient-to-br from-red-500 to-orange-500' 
                        : 'bg-gradient-to-br from-purple-500 to-indigo-500'
                    } shadow-lg shadow-black/10`}>
                      {example.mode === 'savage' ? <Flame className="h-4 w-4 text-white" /> : <Zap className="h-4 w-4 text-white" />}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{example.website}</span>
                  </div>
                  <ScoreBadge score={example.score} />
                </div>
                <div className="relative mb-4">
                  <Quote className="absolute -left-1 -top-1 h-8 w-8 dark:text-white/[0.03] text-foreground/[0.03] rotate-180" />
                  <p className="text-sm leading-relaxed text-muted-foreground italic pl-2">
                    &ldquo;{example.roast}&rdquo;
                  </p>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    example.mode === 'savage'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {example.mode === 'savage' ? <Flame className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                    {example.mode === 'savage' ? 'Savage Mode' : 'Professional'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mt-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 dark:bg-purple-500/10 bg-purple-50/80 px-4 py-1.5 text-xs dark:text-purple-300 text-purple-700 mb-4 badge-shimmer">
              <Star className="h-3 w-3 fill-purple-400" />
              Social Proof
            </div>
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
              Loved by{' '}
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent animated-gradient-text">
                Developers
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
              See what creators and builders are saying about RoastMySite AI.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative overflow-hidden rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 p-6 transition-all duration-200 dark:hover:border-white/[0.12] hover:border-muted-foreground/20"
              >
                {/* Hover glow */}
                <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.05] blur-3xl" />

                <div className="relative">
                  <div className="mb-4 flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500 star-shimmer" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-purple-500/20">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
