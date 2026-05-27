'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Plus, Trash2, Copy, Check, Loader2, AlertTriangle, Code, ExternalLink } from 'lucide-react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

interface ApiKeyData {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  isActive: boolean
  createdAt: string
}

interface ApiKeysDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApiKeysDialog({ open, onOpenChange }: ApiKeysDialogProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string>(session?.user?.plan || 'free')

  useEffect(() => {
    if (open) {
      fetchKeys()
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

  const fetchKeys = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/api-keys')
      const data = await res.json()
      if (data.success) setApiKeys(data.data)
    } catch (err) {
      console.error('Failed to fetch API keys:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createKey = async () => {
    if (!newKeyName.trim()) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setRevealedKey(data.data.key)
        setNewKeyName('')
        fetchKeys()
        toast({ title: 'API Key Created', description: 'Make sure to copy your key — it won\'t be shown again!' })
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create API key', variant: 'destructive' })
    } finally {
      setIsCreating(false)
    }
  }

  const deleteKey = async (id: string) => {
    try {
      const res = await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setApiKeys(apiKeys.filter((k) => k.id !== id))
        toast({ title: 'API Key Revoked', description: 'The key has been permanently deleted.' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to revoke key', variant: 'destructive' })
    }
  }

  const copyToClipboard = async (text: string, type: 'key' | 'snippet') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'key') {
        setCopiedKey(true)
        setTimeout(() => setCopiedKey(false), 2000)
      } else {
        setCopiedSnippet(true)
        setTimeout(() => setCopiedSnippet(false), 2000)
      }
    } catch {
      // fallback
    }
  }

  const canCreateKeys = currentPlan === 'pro' || currentPlan === 'team'

  const codeSnippet = `curl -X POST https://your-domain.com/api/v1/analyze \\
  -H "Authorization: Bearer ${revealedKey || 'rmai_your_api_key'}" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com", "roastMode": "professional"}'`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] dark:border-white/10 border-border dark:bg-[#0a0a0f] bg-background backdrop-blur-xl p-0 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600" />
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25">
                <Key className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-foreground">API Access</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Manage API keys for programmatic access
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {!canCreateKeys ? (
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Upgrade Required</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    API access is available on Pro and Team plans. Upgrade to generate API keys and integrate RoastMySite AI into your workflow.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {/* New key creation */}
              <div className="flex gap-2">
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g., Production, Staging)"
                  className="h-10 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted text-foreground placeholder:text-muted-foreground"
                  onKeyDown={(e) => e.key === 'Enter' && createKey()}
                />
                <Button
                  onClick={createKey}
                  disabled={isCreating || !newKeyName.trim()}
                  className="h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shrink-0"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>

              {/* Revealed key */}
              <AnimatePresence>
                {revealedKey && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                        <Key className="h-4 w-4" />
                        Copy your API key now — it won&apos;t be shown again!
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-lg dark:bg-white/10 bg-background px-3 py-2 text-sm font-mono text-foreground break-all">
                          {revealedKey}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(revealedKey, 'key')}
                          className="shrink-0 h-9 w-9 p-0 rounded-lg"
                        >
                          {copiedKey ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Key list */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Key className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No API keys yet. Create one above to get started.</p>
                </div>
              ) : (
                <ScrollArea className="max-h-48">
                  <div className="space-y-2 pr-3">
                    {apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center gap-3 rounded-xl border dark:border-white/10 border-border dark:bg-white/5 bg-card p-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                          <Key className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{key.name}</p>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500/30 text-green-400">
                              Active
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{key.prefix}••••••••</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteKey(key.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-400 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* API Docs toggle */}
              <Button
                variant="ghost"
                onClick={() => setShowDocs(!showDocs)}
                className="w-full text-muted-foreground hover:text-foreground gap-2"
              >
                <Code className="h-4 w-4" />
                {showDocs ? 'Hide' : 'Show'} API Documentation
              </Button>

              <AnimatePresence>
                {showDocs && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border dark:border-white/10 border-border dark:bg-white/5 bg-muted p-4 space-y-3">
                      <h4 className="text-sm font-medium text-foreground">Quick Start</h4>
                      <div className="rounded-lg dark:bg-black/50 bg-background p-3 relative">
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto font-mono">{codeSnippet}</pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(codeSnippet, 'snippet')}
                          className="absolute top-2 right-2 h-7 w-7 p-0"
                        >
                          {copiedSnippet ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground"><strong className="text-foreground">Endpoint:</strong> POST /api/v1/analyze</p>
                        <p className="text-xs text-muted-foreground"><strong className="text-foreground">Auth:</strong> Bearer token (API key)</p>
                        <p className="text-xs text-muted-foreground"><strong className="text-foreground">Rate Limit:</strong> {currentPlan === 'team' ? '1,000' : '100'}/day</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
