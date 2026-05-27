'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn } from 'next-auth/react'
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { Mail, Lock, User, Flame, Loader2, ArrowRight, Copy, Check, ExternalLink, Shield, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'login' | 'register'
}

export function AuthDialog({ open, onOpenChange, defaultTab = 'login' }: AuthDialogProps) {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Domain setup state
  const [showDomainSetup, setShowDomainSetup] = useState(false)
  const [currentDomain, setCurrentDomain] = useState('')
  const [domainCopied, setDomainCopied] = useState(false)

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirm, setRegisterConfirm] = useState('')

  // Handle Firebase redirect result - this runs when user returns from Google login
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          const firebaseUser = result.user
          const email = firebaseUser.email || ''
          const name = firebaseUser.displayName || email.split('@')[0]
          const image = firebaseUser.photoURL || ''
          const uid = firebaseUser.uid

          if (email && uid) {
            const nextAuthResult = await signIn('firebase-google', {
              email,
              name,
              image,
              uid,
              redirect: false,
            })

            if (nextAuthResult?.error) {
              setError('Google sign-in failed. Please try again.')
            }
          }
        }
      } catch (err: unknown) {
        console.error('Firebase redirect result error:', err)
        const firebaseError = err as { code?: string; message?: string }

        if (firebaseError.code === 'auth/unauthorized-domain') {
          const domain = window.location.hostname
          setCurrentDomain(domain)
          setShowDomainSetup(true)
        } else if (firebaseError.code !== 'auth/popup-closed-by-user') {
          setError(firebaseError.message || 'Google sign-in failed. Please try again.')
        }
      }
    }

    handleRedirectResult()
  }, [])

  const resetForm = useCallback(() => {
    setError(null)
    setLoginEmail('')
    setLoginPassword('')
    setRegisterName('')
    setRegisterEmail('')
    setRegisterPassword('')
    setRegisterConfirm('')
    setShowDomainSetup(false)
  }, [])

  const copyDomain = async () => {
    try {
      await navigator.clipboard.writeText(currentDomain)
      setDomainCopied(true)
      setTimeout(() => setDomainCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = currentDomain
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setDomainCopied(true)
      setTimeout(() => setDomainCopied(false), 2000)
    }
  }

  const handleGoogleClick = async () => {
    setError(null)
    setIsLoading(true)

    try {
      // Try popup first - works in most environments
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user
      const email = firebaseUser.email || ''
      const name = firebaseUser.displayName || email.split('@')[0]
      const image = firebaseUser.photoURL || ''
      const uid = firebaseUser.uid

      if (email && uid) {
        const nextAuthResult = await signIn('firebase-google', {
          email,
          name,
          image,
          uid,
          redirect: false,
        })

        if (nextAuthResult?.error) {
          setError('Google sign-in failed. Please try again.')
        } else {
          resetForm()
          onOpenChange(false)
        }
      }
    } catch (err: unknown) {
      console.error('Firebase Google sign-in error:', err)
      const firebaseError = err as { code?: string; message?: string }

      if (firebaseError.code === 'auth/unauthorized-domain') {
        // Domain not authorized in Firebase - show setup dialog
        const domain = window.location.hostname
        setCurrentDomain(domain)
        setShowDomainSetup(true)
      } else if (firebaseError.code === 'auth/popup-closed-by-user') {
        // User closed the popup - not an error, just cancel
        setError(null)
      } else if (firebaseError.code === 'auth/popup-blocked') {
        // Popup was blocked - try redirect instead
        try {
          await signInWithRedirect(auth, googleProvider)
        } catch (redirectErr) {
          console.error('Firebase redirect sign-in error:', redirectErr)
          setError('Unable to open Google sign-in. Please allow popups or try email sign-in.')
        }
      } else if (firebaseError.code === 'auth/cancelled-popup-request') {
        // Another popup was already open - ignore
        setError(null)
      } else if (firebaseError.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(firebaseError.message || 'Google sign-in failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetryAfterDomainSetup = () => {
    setShowDomainSetup(false)
    handleGoogleClick()
  }

  const handleTabChange = (newTab: 'login' | 'register') => {
    setTab(newTab)
    setError(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!registerEmail || !registerPassword || !registerName) {
      setError('Please fill in all fields')
      return
    }

    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (registerPassword !== registerConfirm) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email: registerEmail,
        password: registerPassword,
        redirect: false,
      })

      if (result?.error) {
        setError('Account created! Please sign in.')
        setTab('login')
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] dark:border-white/10 border-border dark:bg-[#0a0a0f] bg-background backdrop-blur-xl p-0 overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600" />

        <div className="p-6 pt-8">
          {/* Domain Setup View */}
          <AnimatePresence mode="wait">
            {showDomainSetup ? (
              <motion.div
                key="domain-setup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <DialogHeader>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-orange-500/25">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <DialogTitle className="text-center text-xl text-foreground">
                    Authorize Your Domain
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    Add your domain to Firebase to enable Google Sign-In
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-6 space-y-4">
                  {/* Current domain display */}
                  <div className="rounded-xl border dark:border-white/10 border-border dark:bg-white/5 bg-muted p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Your current domain:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-lg dark:bg-white/10 bg-background px-3 py-2 text-sm font-mono text-foreground break-all">
                        {currentDomain}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyDomain}
                        className="shrink-0 h-9 w-9 p-0 rounded-lg dark:border-white/10 border-border"
                      >
                        {domainCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Step-by-step instructions */}
                  <div className="rounded-xl border dark:border-white/10 border-border p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">Follow these steps:</p>

                    <ol className="space-y-2.5 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[10px] font-bold text-white">1</span>
                        <span>Open Firebase Console → Authentication → Settings</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[10px] font-bold text-white">2</span>
                        <span>Scroll to <strong className="text-foreground">&quot;Authorized domains&quot;</strong></span>
                      </li>
                      <li className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[10px] font-bold text-white">3</span>
                        <span>Click <strong className="text-foreground">&quot;Add domain&quot;</strong> and paste: <code className="text-xs px-1.5 py-0.5 rounded dark:bg-white/10 bg-muted text-foreground">{currentDomain}</code></span>
                      </li>
                      <li className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[10px] font-bold text-white">4</span>
                        <span>Come back and click <strong className="text-foreground">&quot;I&apos;ve Added It&quot;</strong> below</span>
                      </li>
                    </ol>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2.5">
                    <Button
                      type="button"
                      onClick={handleRetryAfterDomainSetup}
                      className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:from-purple-500 hover:to-indigo-500 transition-all gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      I&apos;ve Added It — Retry Google Sign-In
                    </Button>

                    <a
                      href="https://console.firebase.google.com/project/roastmysite-ai/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border dark:border-white/10 border-border dark:bg-white/5 bg-muted dark:text-white text-foreground dark:hover:bg-white/10 hover:bg-muted/80 transition-all text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Firebase Console
                    </a>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowDomainSetup(false)}
                      className="w-full text-muted-foreground hover:text-foreground"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DialogHeader>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25">
                    <Flame className="h-7 w-7 text-white" />
                  </div>
                  <DialogTitle className="text-center text-xl text-foreground">
                    {tab === 'login' ? 'Welcome Back' : 'Create Account'}
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    {tab === 'login'
                      ? 'Sign in to your RoastMySite AI account'
                      : 'Get started with free website analyses'}
                  </DialogDescription>
                </DialogHeader>

                {/* Tab switcher */}
                <div className="mt-6 flex rounded-xl dark:bg-white/5 bg-muted/50 p-1">
                  <button
                    onClick={() => handleTabChange('login')}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                      tab === 'login'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleTabChange('register')}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                      tab === 'register'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm dark:text-red-400 text-red-600"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Google sign in button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleClick}
                  disabled={isLoading}
                  className="mt-6 h-11 w-full rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted dark:text-white text-foreground dark:hover:bg-white/10 hover:bg-muted/80 transition-all gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Continue with Google
                </Button>

                {/* Divider */}
                <div className="relative mt-4">
                  <Separator className="dark:bg-white/10 bg-border" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 dark:bg-[#0a0a0f] bg-background px-3 text-xs text-muted-foreground/70">
                    or continue with email
                  </span>
                </div>

                {/* Forms */}
                <AnimatePresence mode="wait">
                  {tab === 'login' ? (
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleLogin}
                      className="mt-6 space-y-4"
                    >
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Email address"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="h-11 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-purple-500/50"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="h-11 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-purple-500/50"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:from-purple-500 hover:to-indigo-500 transition-all"
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
                    </motion.form>
                  ) : (
                    <motion.form
                      key="register"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleRegister}
                      className="mt-6 space-y-4"
                    >
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Full name"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          className="h-11 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-purple-500/50"
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Email address"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          className="h-11 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-purple-500/50"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Password (6+ characters)"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="h-11 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-purple-500/50"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Confirm password"
                          value={registerConfirm}
                          onChange={(e) => setRegisterConfirm(e.target.value)}
                          className="h-11 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-purple-500/50"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:from-purple-500 hover:to-indigo-500 transition-all"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Create Account
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Footer text */}
                <p className="mt-4 text-center text-xs text-muted-foreground/70">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
