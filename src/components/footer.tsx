'use client'

import Image from 'next/image'
import { Heart, ArrowUpRight } from 'lucide-react'

export function Footer() {
  const handleApiAccess = () => {
    window.dispatchEvent(new CustomEvent('open-api-keys'))
  }

  return (
    <footer className="relative z-10 border-t dark:border-white/[0.06] border-border/50 dark:bg-black/30 bg-muted/20 backdrop-blur-sm mt-auto">
      {/* Top gradient line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo.png"
                alt="RoastMySite AI logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl shadow-lg shadow-purple-500/20"
              />
              <span className="text-base font-bold text-foreground">
                RoastMySite <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">AI</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-powered website analysis that delivers brutally honest feedback across UI, SEO, speed, and accessibility.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Product</h4>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Features', href: '#features' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'FAQ', href: '#faq' },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1 group"
                >
                  {link.label}
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 transition-all group-hover:opacity-60 group-hover:translate-y-0 group-hover:translate-x-0" />
                </a>
              ))}
              <button
                onClick={handleApiAccess}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1 group text-left"
              >
                API Access
                <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 transition-all group-hover:opacity-60 group-hover:translate-y-0 group-hover:translate-x-0" />
              </button>
            </div>
          </div>

          {/* About */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">About</h4>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
              Made with <Heart className="h-3.5 w-3.5 text-red-400 fill-red-400 animate-pulse" /> by Arpit Jadav
            </p>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              &copy; {new Date().getFullYear()} RoastMySite AI. All rights reserved.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t dark:border-white/[0.06] border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Privacy</a>
            <a href="#" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Terms</a>
            <a href="#" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
