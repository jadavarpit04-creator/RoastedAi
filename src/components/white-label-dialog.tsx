'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Paintbrush, Save, Trash2, Loader2, Plus, AlertTriangle, Eye } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

interface WhiteLabelConfig {
  id: string
  companyName: string
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  customDomain: string | null
  footerText: string | null
  isActive: boolean
  createdAt: string
}

interface WhiteLabelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhiteLabelDialog({ open, onOpenChange }: WhiteLabelDialogProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [configs, setConfigs] = useState<WhiteLabelConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string>(session?.user?.plan || 'free')

  // Form state
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#7c3aed')
  const [accentColor, setAccentColor] = useState('#6366f1')
  const [customDomain, setCustomDomain] = useState('')
  const [footerText, setFooterText] = useState('')

  const canUseWhiteLabel = currentPlan === 'team'

  useEffect(() => {
    if (open) {
      fetchConfigs()
      fetchCurrentPlan()
    }
  }, [open])

  // Also update plan when session changes
  useEffect(() => {
    if (session?.user?.plan) {
      setCurrentPlan(session.user.plan)
    }
  }, [session?.user?.plan])

  const fetchCurrentPlan = async () => {
    try {
      const res = await fetch('/api/user/stats')
      if (res.ok) {
        const data = await res.json()
        if (data.plan) setCurrentPlan(data.plan)
      }
    } catch {
      // Fallback to session plan
    }
  }

  const fetchConfigs = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/white-label')
      const data = await res.json()
      if (data.success) setConfigs(data.data)
    } catch (err) {
      console.error('Failed to fetch configs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setCompanyName('')
    setLogoUrl('')
    setPrimaryColor('#7c3aed')
    setAccentColor('#6366f1')
    setCustomDomain('')
    setFooterText('')
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast({ title: 'Company name required', variant: 'destructive' })
      return
    }

    setIsSaving(true)
    try {
      if (editingId) {
        const res = await fetch('/api/white-label', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, companyName, logoUrl, primaryColor, accentColor, customDomain, footerText }),
        })
        const data = await res.json()
        if (data.success) {
          toast({ title: 'Config updated', description: 'White-label settings saved.' })
        }
      } else {
        const res = await fetch('/api/white-label', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName, logoUrl, primaryColor, accentColor, customDomain, footerText }),
        })
        const data = await res.json()
        if (data.success) {
          toast({ title: 'Config created', description: 'White-label branding saved.' })
        } else {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
        }
      }
      resetForm()
      fetchConfigs()
    } catch {
      toast({ title: 'Error', description: 'Failed to save config', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/white-label?id=${id}`, { method: 'DELETE' })
      setConfigs(configs.filter((c) => c.id !== id))
      toast({ title: 'Config deleted' })
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  const handleEdit = (config: WhiteLabelConfig) => {
    setEditingId(config.id)
    setCompanyName(config.companyName)
    setLogoUrl(config.logoUrl || '')
    setPrimaryColor(config.primaryColor)
    setAccentColor(config.accentColor)
    setCustomDomain(config.customDomain || '')
    setFooterText(config.footerText || '')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] dark:border-white/10 border-border dark:bg-[#0a0a0f] bg-background backdrop-blur-xl p-0 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600" />
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25">
                <Paintbrush className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-foreground">White-Label Reports</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Customize report branding for your clients
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {!canUseWhiteLabel ? (
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Team Plan Required</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    White-label reports are available on the Team plan. Upgrade to customize your reports with your own branding.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {/* Existing configs */}
              {configs.length > 0 && (
                <ScrollArea className="max-h-32">
                  <div className="space-y-2 pr-3">
                    {configs.map((config) => (
                      <div
                        key={config.id}
                        className="flex items-center gap-3 rounded-xl border dark:border-white/10 border-border dark:bg-white/5 bg-card p-3"
                      >
                        <div
                          className="h-8 w-8 shrink-0 rounded-lg"
                          style={{ backgroundColor: config.primaryColor }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{config.companyName}</p>
                          <p className="text-xs text-muted-foreground">{config.customDomain || 'No custom domain'}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(config)} className="h-8 text-xs">
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(config.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Form */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Company Name *</label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Acme Digital Agency"
                    className="h-10 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Logo URL</label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="h-10 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Primary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 w-10 rounded-lg border dark:border-white/10 border-border cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Accent Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-10 w-10 rounded-lg border dark:border-white/10 border-border cursor-pointer"
                      />
                      <Input
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-10 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Custom Domain</label>
                  <Input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="reports.yourcompany.com"
                    className="h-10 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Footer Text</label>
                  <Input
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="© 2025 Acme Digital. All rights reserved."
                    className="h-10 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted"
                  />
                </div>

                {/* Preview toggle */}
                <Button
                  variant="ghost"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full text-muted-foreground hover:text-foreground gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {showPreview ? 'Hide' : 'Preview'} Report Look
                </Button>

                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border dark:border-white/10 border-border overflow-hidden">
                        {/* Preview header */}
                        <div className="p-4 flex items-center gap-3" style={{ backgroundColor: primaryColor + '15' }}>
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: primaryColor }}>
                              {(companyName || 'C')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-foreground">{companyName || 'Your Company'}</p>
                            <p className="text-xs text-muted-foreground">Website Analysis Report</p>
                          </div>
                        </div>
                        {/* Preview score */}
                        <div className="p-4 flex items-center gap-4">
                          <div className="h-16 w-16 rounded-full border-4 flex items-center justify-center text-lg font-bold" style={{ borderColor: primaryColor, color: primaryColor }}>
                            72
                          </div>
                          <div>
                            <p className="font-medium text-foreground">example.com</p>
                            <p className="text-xs text-muted-foreground">Overall Score</p>
                          </div>
                        </div>
                        {/* Preview footer */}
                        {footerText && (
                          <div className="px-4 py-2 border-t dark:border-white/5 border-border text-xs text-muted-foreground">
                            {footerText}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !companyName.trim()}
                    className="flex-1 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {editingId ? 'Update' : 'Save'} Config
                  </Button>
                  {editingId && (
                    <Button variant="outline" onClick={resetForm} className="h-10 rounded-xl">
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
