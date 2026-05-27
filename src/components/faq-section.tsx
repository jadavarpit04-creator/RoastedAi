'use client'

import { motion } from 'framer-motion'
import { HelpCircle } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'How does the AI website analysis work?',
    answer:
      'Our AI crawls your website, captures metadata and HTML content, then uses advanced language models to analyze it across 7 categories: UI/UX, SEO, Accessibility, Performance, Mobile, Design, and Conversion. The AI provides specific, actionable issues and suggestions for each category along with scores from 0-100.',
  },
  {
    question: 'What is the difference between Professional and Savage mode?',
    answer:
      'Professional mode provides constructive, thorough feedback with an engaging but respectful tone. Savage mode delivers brutally honest, hilarious roasts with witty metaphors and pop culture references — think comedy roast for your website. Both modes provide the same detailed technical analysis.',
  },
  {
    question: 'How long does an analysis take?',
    answer:
      'Most analyses complete within 20-40 seconds. The AI needs time to fetch your website content and process the comprehensive analysis. Complex sites with lots of content may take slightly longer.',
  },
  {
    question: 'Is my website data secure?',
    answer:
      'Yes! We only analyze publicly accessible website content. We don\'t store any sensitive data, and your analysis results are stored securely. We never share your data with third parties.',
  },
  {
    question: 'Can I analyze password-protected or private websites?',
    answer:
      'Currently, we can only analyze publicly accessible websites. If your site requires authentication, our crawler won\'t be able to access the content behind the login wall.',
  },
  {
    question: 'How accurate are the scores?',
    answer:
      'Our AI uses industry best practices and standards (WCAG, Core Web Vitals, SEO best practices) as benchmarks. While no automated tool is perfect, our scores provide a reliable baseline for understanding your website\'s strengths and weaknesses across key categories.',
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="relative px-4 py-28">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full dark:bg-purple-600/[0.03] bg-purple-400/[0.03] blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 dark:bg-purple-500/10 bg-purple-50/80 px-4 py-1.5 text-xs dark:text-purple-300 text-purple-700 mb-4 badge-shimmer">
            <HelpCircle className="h-3 w-3" />
            Got Questions?
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent animated-gradient-text">
              Questions
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about RoastMySite AI.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-2xl border dark:border-white/[0.06] border-border/50 dark:bg-white/[0.02] bg-card/80 px-6 transition-all data-[state=open]:dark:border-purple-500/20 data-[state=open]:border-purple-500/20 data-[state=open]:dark:bg-purple-500/[0.03] data-[state=open]:bg-purple-50/30"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-purple-400 hover:no-underline py-5 text-[15px] font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
