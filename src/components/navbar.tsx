'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { Menu, X, Sun, Moon, LogOut, User, BarChart3, ChevronDown, Key, Users, Paintbrush, Zap, GitCompare, CreditCard, Lock, Crown } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { AuthDialog } from '@/components/auth-dialog'
import { ReportsDialog } from '@/components/reports-dialog'
import { ProfileDialog } from '@/components/profile-dialog'
import { ApiKeysDialog } from '@/components/api-keys-dialog'
import { WhiteLabelDialog } from '@/components/white-label-dialog'
import { TeamDialog } from '@/components/team-dialog'
import { CompareDialog } from '@/components/compare-dialog'
import { UpgradeDialog } from '@/components/upgrade-dialog'
import { useAnalysisStore } from '@/hooks/use-analysis-store'
import { usePlanFeatures } from '@/hooks/use-plan-features'
import { FEATURES } from '@/lib/plan-config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [reportsOpen, setReportsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [apiKeysOpen, setApiKeysOpen] = useState(false)
  const [whiteLabelOpen, setWhiteLabelOpen] = useState(false)
  const [teamOpen, setTeamOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradePlan, setUpgradePlan] = useState<'starter' | 'pro' | 'enterprise'>('pro')
  const { data: session, update: updateSession } = useSession()
  const { theme, setTheme } = useTheme()

  // Listen for custom event from footer to open API keys
  useEffect(() => {
    const handler = () => {
      if (session) {
        setApiKeysOpen(true)
      } else {
        setAuthTab('register')
        setAuthOpen(true)
      }
    }
    window.addEventListener('open-api-keys', handler)
    return () => window.removeEventListener('open-api-keys', handler)
  }, [session])

  // Listen for profile-updated event to force session refresh in navbar
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.name) {
        // Force session refresh with new name data
        updateSession({ name: detail.name })
      }
    }
    window.addEventListener('profile-updated', handler)
    return () => window.removeEventListener('profile-updated', handler)
  }, [updateSession])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const openAuth = (tab: 'login' | 'register' = 'login') => {
    setAuthTab(tab)
    setAuthOpen(true)
  }

  const handleGetStarted = () => {
    if (session) {
      document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      openAuth('register')
    }
  }

  const openUpgrade = (plan: 'starter' | 'pro' | 'enterprise') => {
    setUpgradePlan(plan)
    setUpgradeOpen(true)
  }

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : session?.user?.email?.[0]?.toUpperCase() || 'U'

  const { currentPlan, analysesRemaining, isUnlimited, canUseApi, canUseWhiteLabel, canUseTeamMembers, isAdmin } = usePlanFeatures()
  const plan = currentPlan

  const planBadge = isAdmin ? 'Admin' : plan === 'enterprise' ? 'Enterprise' : plan === 'pro' ? 'Pro' : plan === 'starter' ? 'Starter' : 'Free'
  const planBadgeColor = isAdmin ? 'border-amber-500/30 text-amber-400' : plan === 'enterprise' ? 'border-cyan-500/30 text-cyan-400' : plan === 'pro' ? 'border-purple-500/30 text-purple-400' : plan === 'starter' ? 'border-green-500/30 text-green-400' : 'border-muted-foreground/30 text-muted-foreground'

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 z-50 dark:bg-black/50 bg-background/70 backdrop-blur-2xl border-b dark:border-white/[0.06] border-border/50"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="RoastMySite AI logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow"
              />
              {(plan === 'pro' || plan === 'enterprise' || isAdmin) && (
                <Image
                  src="/premium-badge.png"
                  alt="Premium"
                  width={18}
                  height={18}
                  className="absolute -top-1.5 -right-1.5 h-[18px] w-[18px] drop-shadow-lg"
                />
              )}
            </div>
            <span className="text-lg font-bold text-foreground">
              RoastMySite <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">AI</span>
            </span>
            {(plan === 'pro' || plan === 'enterprise' || isAdmin) && (
              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[8px] px-1.5 py-0 font-bold border-0 shadow-md shadow-amber-500/20">
                <Crown className="h-2.5 w-2.5 mr-0.5" />
                PREMIUM
              </Badge>
            )}
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground px-3 py-2 rounded-lg hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
            <div className="mx-2 h-4 w-px dark:bg-white/10 bg-border" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground dark:hover:bg-white/10 hover:bg-muted h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 dark:hover:bg-white/5 hover:bg-muted px-2 h-9 ml-1">
                    <Avatar className="h-7 w-7 border border-purple-500/30">
                      {session.user?.image && <AvatarImage src={session.user.image} alt={session.user.name || ''} />}
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-xs text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[80px] truncate text-sm text-foreground">
                      {session.user?.name?.split(' ')[0] || session.user?.email?.split('@')[0]}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[8px] px-1.5 py-0 font-bold ${planBadgeColor}`}
                    >
                      {planBadge}
                    </Badge>
                    {!isUnlimited && (
                      <span className="text-[10px] text-muted-foreground">
                        {analysesRemaining} left
                      </span>
                    )}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 dark:border-white/[0.08] border-border/50 dark:bg-[#0c0c14]/95 bg-popover/95 backdrop-blur-2xl shadow-2xl"
                >
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-foreground">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="dark:bg-white/[0.06] bg-border/50" />
                  <DropdownMenuItem 
                    onClick={() => setReportsOpen(true)}
                    className="text-muted-foreground focus:text-foreground dark:focus:bg-white/5 focus:bg-muted cursor-pointer rounded-lg"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    My Reports
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setProfileOpen(true)}
                    className="text-muted-foreground focus:text-foreground dark:focus:bg-white/5 focus:bg-muted cursor-pointer rounded-lg"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const store = useAnalysisStore.getState()
                      store.setView('billing')
                    }}
                    className="text-muted-foreground focus:text-foreground dark:focus:bg-white/5 focus:bg-muted cursor-pointer rounded-lg"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing & Subscription
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-white/[0.06] bg-border/50" />
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground/60 px-2 uppercase tracking-wider">Integrations</DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => canUseApi ? setApiKeysOpen(true) : null}
                    className="text-muted-foreground focus:text-foreground dark:focus:bg-white/5 focus:bg-muted cursor-pointer rounded-lg"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    API Access
                    {!canUseApi && <Badge variant="outline" className="ml-auto text-[8px] px-1 py-0 border-amber-500/30 text-amber-400">PRO</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => canUseWhiteLabel ? setWhiteLabelOpen(true) : null}
                    className="text-muted-foreground focus:text-foreground dark:focus:bg-white/5 focus:bg-muted cursor-pointer rounded-lg"
                  >
                    <Paintbrush className="mr-2 h-4 w-4" />
                    White-Label
                    {!canUseWhiteLabel && <Badge variant="outline" className="ml-auto text-[8px] px-1 py-0 border-amber-500/30 text-amber-400">ENT</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => canUseTeamMembers ? setTeamOpen(true) : null}
                    className="text-muted-foreground focus:text-foreground dark:focus:bg-white/5 focus:bg-muted cursor-pointer rounded-lg"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Team
                    {!canUseTeamMembers && <Badge variant="outline" className="ml-auto text-[8px] px-1 py-0 border-amber-500/30 text-amber-400">ENT</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCompareOpen(true)}
                    className="text-muted-foreground focus:text-foreground dark:focus:bg-white/5 focus:bg-muted cursor-pointer rounded-lg"
                  >
                    <GitCompare className="mr-2 h-4 w-4" />
                    Compare
                  </DropdownMenuItem>
                  {plan !== 'enterprise' && (
                    <>
                      <DropdownMenuSeparator className="dark:bg-white/[0.06] bg-border/50" />
                      <DropdownMenuItem 
                        onClick={() => openUpgrade(plan === 'free' ? 'starter' : plan === 'starter' ? 'pro' : 'enterprise')}
                        className="text-purple-400 focus:text-purple-300 focus:bg-purple-500/5 cursor-pointer rounded-lg"
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        Upgrade Plan
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="dark:bg-white/[0.06] bg-border/50" />
                  <DropdownMenuItem
                    onClick={() => {
                      signOut({ redirect: false })
                      useAnalysisStore.getState().reset()
                    }}
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/5 cursor-pointer rounded-lg"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Button
                  variant="ghost"
                  onClick={() => openAuth('login')}
                  className="text-sm text-muted-foreground hover:text-foreground dark:hover:bg-white/5 hover:bg-muted h-9"
                >
                  Sign In
                </Button>
                <Button
                  onClick={handleGetStarted}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:from-purple-500 hover:to-indigo-500 transition-all h-9 text-sm"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground dark:hover:bg-white/10 hover:bg-muted h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-muted-foreground hover:text-foreground dark:hover:bg-white/10 hover:bg-muted h-9 w-9"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t dark:border-white/[0.06] border-border/50 dark:bg-black/95 bg-background/95 backdrop-blur-2xl md:hidden"
            >
              <div className="flex flex-col gap-1 px-4 py-3">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground py-2 px-2 rounded-lg hover:bg-white/5"
                  >
                    {link.label}
                  </a>
                ))}
                {session ? (
                  <>
                    <div className="flex items-center gap-3 py-2 mt-2 border-t dark:border-white/[0.06] border-border/50">
                      <Avatar className="h-8 w-8 border border-purple-500/30">
                        {session.user?.image && <AvatarImage src={session.user.image} alt={session.user.name || ''} />}
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-xs text-white">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{session.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => { setReportsOpen(true); setIsOpen(false) }} className="w-full justify-start text-muted-foreground hover:text-foreground h-9 text-sm">
                      <BarChart3 className="mr-2 h-4 w-4" /> My Reports
                    </Button>
                    <Button variant="ghost" onClick={() => { setProfileOpen(true); setIsOpen(false) }} className="w-full justify-start text-muted-foreground hover:text-foreground h-9 text-sm">
                      <User className="mr-2 h-4 w-4" /> Profile Settings
                    </Button>
                    <Button variant="ghost" onClick={() => { if (canUseApi) { setApiKeysOpen(true) } else { openUpgrade('pro') }; setIsOpen(false) }} className="w-full justify-start text-muted-foreground hover:text-foreground h-9 text-sm">
                      <Key className="mr-2 h-4 w-4" /> API Access
                      {!canUseApi && <Badge variant="outline" className="ml-auto text-[8px] px-1 py-0 border-amber-500/30 text-amber-400">PRO</Badge>}
                    </Button>
                    <Button variant="ghost" onClick={() => { if (canUseWhiteLabel) { setWhiteLabelOpen(true) } else { openUpgrade('enterprise') }; setIsOpen(false) }} className="w-full justify-start text-muted-foreground hover:text-foreground h-9 text-sm">
                      <Paintbrush className="mr-2 h-4 w-4" /> White-Label
                      {!canUseWhiteLabel && <Badge variant="outline" className="ml-auto text-[8px] px-1 py-0 border-amber-500/30 text-amber-400">ENT</Badge>}
                    </Button>
                    <Button variant="ghost" onClick={() => { if (canUseTeamMembers) { setTeamOpen(true) } else { openUpgrade('enterprise') }; setIsOpen(false) }} className="w-full justify-start text-muted-foreground hover:text-foreground h-9 text-sm">
                      <Users className="mr-2 h-4 w-4" /> Team
                      {!canUseTeamMembers && <Badge variant="outline" className="ml-auto text-[8px] px-1 py-0 border-amber-500/30 text-amber-400">ENT</Badge>}
                    </Button>
                    <Button variant="ghost" onClick={() => { setCompareOpen(true); setIsOpen(false) }} className="w-full justify-start text-muted-foreground hover:text-foreground h-9 text-sm">
                      <GitCompare className="mr-2 h-4 w-4" /> Compare
                    </Button>
                    {plan !== 'enterprise' && (
                      <Button variant="ghost" onClick={() => { openUpgrade(plan === 'free' ? 'starter' : plan === 'starter' ? 'pro' : 'enterprise'); setIsOpen(false) }} className="w-full justify-start text-purple-400 hover:text-purple-300 h-9 text-sm">
                        <Zap className="mr-2 h-4 w-4" /> Upgrade Plan
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => { signOut({ redirect: false }); useAnalysisStore.getState().reset(); setIsOpen(false) }} className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/5 h-9 text-sm">
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 border-t dark:border-white/[0.06] border-border/50 pt-3 mt-2">
                    <Button variant="ghost" onClick={() => { openAuth('login'); setIsOpen(false) }} className="w-full text-foreground dark:hover:bg-white/5 hover:bg-muted h-9">
                      Sign In
                    </Button>
                    <Button onClick={() => { openAuth('register'); setIsOpen(false) }} className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 h-9 text-sm">
                      Get Started Free
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Dialogs */}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
      <ReportsDialog open={reportsOpen} onOpenChange={setReportsOpen} />
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ApiKeysDialog open={apiKeysOpen} onOpenChange={setApiKeysOpen} />
      <WhiteLabelDialog open={whiteLabelOpen} onOpenChange={setWhiteLabelOpen} />
      <TeamDialog open={teamOpen} onOpenChange={setTeamOpen} />
      <CompareDialog open={compareOpen} onOpenChange={setCompareOpen} />
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} defaultPlan={upgradePlan} />
    </>
  )
}
