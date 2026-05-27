'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { User, Mail, Shield, BarChart3, Loader2, Save, Flame, Zap, Key, Paintbrush, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { data: session, update: updateSession } = useSession()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [stats, setStats] = useState<{ analysesUsed: number; plan: string } | null>(null)

  useEffect(() => {
    if (open && session?.user) {
      setName(session.user.name || '')
      fetchStats()
    }
  }, [open, session])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/user/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      // Stats are optional
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Name required', description: 'Please enter your name', variant: 'destructive' })
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (res.ok) {
        // Pass the new name directly to updateSession so the session state
        // is immediately updated across all components (navbar, etc.)
        await updateSession({ name: name.trim() })
        // Dispatch custom event so other components can react immediately
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: { name: name.trim() } }))
        toast({ title: 'Profile updated', description: 'Your profile has been saved successfully' })
      } else {
        toast({ title: 'Update failed', description: 'Could not update your profile.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Update failed', description: 'Something went wrong.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : session?.user?.email?.[0]?.toUpperCase() || 'U'

  const planLabel = stats?.plan || session?.user?.plan || 'free'
  const analysesUsed = stats?.analysesUsed ?? 0
  const planLimit = planLabel === 'pro' || planLabel === 'enterprise' ? '∞' : planLabel === 'starter' ? '10/day' : '3/day'

  const planFeatures: Record<string, string[]> = {
    free: ['3 analyses/day', 'Professional mode', 'Basic reports', 'Email reports'],
    starter: ['10 analyses/day', 'Savage mode', 'Full 7-category audit', 'PDF export', 'Historical tracking', 'Email support'],
    pro: ['Unlimited analyses', 'Savage mode', 'PDF export', 'Competitor comparison', 'Security Scanner', 'Tech Stack Analysis', 'API access (100/day)', 'Priority processing'],
    enterprise: ['Everything in Pro', '25 team members', 'API access (10k/day)', 'White-label reports', 'Custom branding', 'Priority support', 'Dedicated manager'],
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] dark:border-white/10 border-border dark:bg-[#0a0a0f] bg-background backdrop-blur-xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600" />

        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-foreground">Profile Settings</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Manage your account and plan
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Profile avatar and info */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-purple-500/25">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{session?.user?.name || 'User'}</p>
              <p className="truncate text-sm text-muted-foreground">{session?.user?.email}</p>
              <Badge
                variant="outline"
                className={`mt-1 ${
                  planLabel === 'enterprise'
                    ? 'border-cyan-500/30 text-cyan-400'
                    : planLabel === 'pro'
                    ? 'border-purple-500/30 text-purple-400'
                    : planLabel === 'starter'
                    ? 'border-green-500/30 text-green-400'
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                <Shield className="mr-1 h-3 w-3" />
                {planLabel === 'enterprise' ? 'Enterprise Plan' : planLabel === 'pro' ? 'Pro Plan' : planLabel === 'starter' ? 'Starter Plan' : 'Free Plan'}
              </Badge>
            </div>
          </div>

          <Separator className="my-6 dark:bg-white/10 bg-border" />

          {/* Plan features */}
          <div>
            <h4 className="mb-3 text-sm font-medium text-foreground">Your Plan Features</h4>
            <div className="grid grid-cols-2 gap-2">
              {(planFeatures[planLabel] || planFeatures.free).map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                  {feature}
                </div>
              ))}
            </div>
            {(planLabel === 'free' || planLabel === 'starter') && (
              <div className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-400" />
                  <p className="text-xs text-purple-300">
                    Upgrade to Pro for unlimited analyses, savage mode, PDF export & more!
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-6 dark:bg-white/10 bg-border" />

          {/* Edit name */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-11 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-purple-500/50"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={session?.user?.email || ''}
                  disabled
                  className="h-11 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted pl-10 text-muted-foreground cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
          </div>

          <Separator className="my-6 dark:bg-white/10 bg-border" />

          {/* Usage stats */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Usage
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl dark:bg-white/5 bg-muted/50 px-4 py-3 text-center">
                <div className="text-2xl font-bold text-foreground">{analysesUsed}</div>
                <div className="text-xs text-muted-foreground">Total Analyses</div>
              </div>
              <div className="rounded-xl dark:bg-white/5 bg-muted/50 px-4 py-3 text-center">
                <div className="text-2xl font-bold text-foreground">{planLimit}</div>
                <div className="text-xs text-muted-foreground">Daily Limit</div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-6 h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:from-purple-500 hover:to-indigo-500 transition-all"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
