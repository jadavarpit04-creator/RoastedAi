'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn } from 'next-auth/react'
import { Mail, User, Loader2, ArrowRight, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface GoogleSignInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GoogleSignInDialog({ open, onOpenChange }: GoogleSignInDialogProps) {
  const [step, setStep] = useState<'choose' | 'email' | 'name'>('choose')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setStep('choose')
    setEmail('')
    setName('')
    setError(null)
    setIsLoading(false)
  }

  const handleRealGoogleSignIn = () => {
    // Redirect to actual Google OAuth login page (accounts.google.com)
    signIn('google', { callbackUrl: '/' })
  }

  const handleEmailNext = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setStep('name')
  }

  const handleSimulatedSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn('google-simulated', {
        email: email.trim(),
        name: name.trim(),
        isGoogle: 'true',
        redirect: false,
      })

      if (result?.error) {
        setError('Sign-in failed. Please try again.')
      } else {
        resetForm()
        onOpenChange(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm()
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px] dark:border-white/10 border-border dark:bg-[#0a0a0f] bg-background backdrop-blur-xl p-0 overflow-hidden">
        {/* Google-style header */}
        <div className="px-8 pt-8 pb-4">
          <DialogHeader>
            {/* Google Logo */}
            <div className="flex justify-center mb-4">
              <svg viewBox="0 0 75 24" width="75" height="24" xmlns="http://www.w3.org/2000/svg" className="dark:brightness-100 brightness-75">
                <g>
                  <path fill="#4285F4" d="M9.24 8.19v2.46h5.88c-.18 1.38-.64 2.39-1.34 3.1-.86.86-2.2 1.8-4.54 1.8-3.62 0-6.45-2.92-6.45-6.54s2.83-6.54 6.45-6.54c1.95 0 3.38.77 4.43 1.76L15.4 2.5C13.94 1.08 11.98 0 9.24 0 4.28 0 .11 4.04.11 9s4.17 9 9.13 9c2.68 0 4.7-.88 6.28-2.52 1.62-1.62 2.13-3.91 2.13-5.75 0-.57-.04-1.1-.13-1.54H9.24z"/>
                  <path fill="#EA4335" d="M25 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/>
                  <path fill="#FBBC05" d="M53.58 7.49h-.09c-.57-.68-1.67-1.3-3.06-1.3C47.53 6.19 45 8.72 45 12c0 3.26 2.53 5.81 5.43 5.81 1.39 0 2.49-.62 3.06-1.32h.09v.81c0 2.22-1.19 3.41-3.1 3.41-1.56 0-2.53-1.12-2.93-2.07l-2.22.92c.64 1.54 2.33 3.43 5.15 3.43 2.99 0 5.52-1.76 5.52-6.05V6.49h-2.42v1zm-2.93 8.03c-1.76 0-3.1-1.5-3.1-3.52 0-2.05 1.34-3.52 3.1-3.52 1.74 0 3.1 1.5 3.1 3.54 0 2.02-1.37 3.5-3.1 3.5z"/>
                  <path fill="#4285F4" d="M38 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/>
                  <path fill="#34A853" d="M58 .24h2.51v17.57H58z"/>
                  <path fill="#EA4335" d="M68.26 15.52c-1.3 0-2.22-.59-2.82-1.76l7.77-3.21-.26-.66c-.48-1.3-1.96-3.7-4.97-3.7-2.99 0-5.48 2.35-5.48 5.81 0 3.26 2.46 5.81 5.76 5.81 2.66 0 4.2-1.63 4.84-2.57l-1.98-1.32c-.66.96-1.56 1.6-2.86 1.6zm-.18-7.15c1.03 0 1.91.53 2.2 1.28l-5.25 2.17c0-2.44 1.73-3.45 3.05-3.45z"/>
                </g>
              </svg>
            </div>
            <DialogTitle className="text-center text-xl text-foreground">
              {step === 'choose' ? 'Sign in with Google' : step === 'email' ? 'Sign in' : 'Welcome!'}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              {step === 'choose'
                ? 'Choose how you want to sign in'
                : step === 'email'
                ? 'Use your Google Account'
                : `Continue as ${email}`}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-8 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm dark:text-red-400 text-red-600"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step: Choose sign-in method */}
        <AnimatePresence mode="wait">
          {step === 'choose' ? (
            <motion.div
              key="choose-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="px-8 pb-8 space-y-3"
            >
              {/* Primary: Real Google OAuth */}
              <Button
                type="button"
                onClick={handleRealGoogleSignIn}
                className="h-12 w-full rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium gap-3 shadow-lg"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                </svg>
                <ExternalLink className="h-4 w-4" />
                Sign in with Google Account
              </Button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full dark:border-white/10 border-border border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="dark:bg-[#0a0a0f] bg-background px-3 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Fallback: Simulated Google sign-in */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('email')}
                className="h-12 w-full rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted dark:text-white text-foreground dark:hover:bg-white/10 hover:bg-muted/80 gap-2"
              >
                <Mail className="h-5 w-5 text-muted-foreground" />
                Sign in with email
              </Button>

              <p className="text-xs text-muted-foreground text-center pt-1">
                &quot;Sign in with Google Account&quot; opens Google&apos;s login page to pick your email directly.
              </p>
            </motion.div>
          ) : step === 'email' ? (
            <motion.form
              key="email-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleEmailNext}
              className="px-8 pb-8 space-y-4"
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  className="h-12 rounded-lg dark:border-white/10 border-border dark:bg-white/5 bg-muted pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-500/50"
                />
              </div>

              <div className="flex justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setStep('choose'); setError(null) }}
                  className="text-muted-foreground hover:text-foreground dark:hover:bg-white/5 hover:bg-muted"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6"
                >
                  Next
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="name-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSimulatedSignIn}
              className="px-8 pb-8 space-y-4"
            >
              {/* Show selected email */}
              <div className="flex items-center gap-3 rounded-lg dark:bg-white/5 bg-muted p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-xs font-bold text-white">
                  {email[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(null) }}
                  className="text-xs text-blue-500 hover:text-blue-400"
                >
                  Change
                </button>
              </div>

              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="h-12 rounded-lg dark:border-white/10 border-border dark:bg-white/5 bg-muted pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-500/50"
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setStep('email'); setError(null) }}
                  className="text-blue-500 hover:text-blue-400 dark:hover:bg-white/5 hover:bg-muted"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="px-8 pb-6">
          <div className="border-t dark:border-white/10 border-border pt-4">
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to RoastMySite AI&apos;s Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
