'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Trash2, Loader2, AlertTriangle, Shield, Crown, UserCheck } from 'lucide-react'
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

interface TeamMemberData {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface TeamData {
  id: string
  name: string
  slug: string
  description: string | null
  role: string
  ownerId: string
  members: TeamMemberData[]
  createdAt: string
}

interface TeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeamDialog({ open, onOpenChange }: TeamDialogProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [teams, setTeams] = useState<TeamData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDesc, setNewTeamDesc] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>(session?.user?.plan || 'free')

  const canUseTeams = currentPlan === 'team'

  useEffect(() => {
    if (open) {
      fetchTeams()
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

  const fetchTeams = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/teams')
      const data = await res.json()
      if (data.success) setTeams(data.data)
    } catch (err) {
      console.error('Failed to fetch teams:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createTeam = async () => {
    if (!newTeamName.trim()) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName, description: newTeamDesc }),
      })
      const data = await res.json()
      if (data.success) {
        setNewTeamName('')
        setNewTeamDesc('')
        fetchTeams()
        toast({ title: 'Team Created', description: `"${data.data.name}" is ready to go!` })
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create team', variant: 'destructive' })
    } finally {
      setIsCreating(false)
    }
  }

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !activeTeamId) return
    setIsInviting(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invite', teamId: activeTeamId, email: inviteEmail.trim(), role: 'member' }),
      })
      const data = await res.json()
      if (data.success) {
        setInviteEmail('')
        fetchTeams()
        toast({ title: 'Member Invited', description: `${inviteEmail} has been added to the team.` })
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to invite member', variant: 'destructive' })
    } finally {
      setIsInviting(false)
    }
  }

  const removeMember = async (teamId: string, memberId: string) => {
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', teamId, memberId }),
      })
      if (res.ok) {
        fetchTeams()
        toast({ title: 'Member Removed' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to remove member', variant: 'destructive' })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-3.5 w-3.5 text-amber-400" />
      case 'admin': return <Shield className="h-3.5 w-3.5 text-purple-400" />
      default: return <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] dark:border-white/10 border-border dark:bg-[#0a0a0f] bg-background backdrop-blur-xl p-0 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600" />
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-foreground">Team Management</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Create teams and collaborate with members
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {!canUseTeams ? (
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Team Plan Required</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Team collaboration features require a Team plan. Upgrade to create teams and invite members.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {/* Create team */}
              <div className="space-y-2">
                <Input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Team name (e.g., Marketing Team)"
                  className="h-10 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted"
                />
                <Input
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="h-10 rounded-xl dark:border-white/10 border-border dark:bg-white/5 bg-muted"
                />
                <Button
                  onClick={createTeam}
                  disabled={isCreating || !newTeamName.trim()}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Team
                </Button>
              </div>

              <Separator className="dark:bg-white/10 bg-border" />

              {/* Teams list */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                </div>
              ) : teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No teams yet. Create one above to get started.</p>
                </div>
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="space-y-4 pr-3">
                    {teams.map((team) => (
                      <div key={team.id} className="rounded-xl border dark:border-white/10 border-border dark:bg-white/5 bg-card overflow-hidden">
                        {/* Team header */}
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer"
                          onClick={() => setActiveTeamId(activeTeamId === team.id ? null : team.id)}
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{team.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {team.members.length} member{team.members.length !== 1 ? 's' : ''} · You are {team.role}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {team.members.length}/10
                          </Badge>
                        </div>

                        {/* Expanded team */}
                        <AnimatePresence>
                          {activeTeamId === team.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t dark:border-white/5 border-border p-3 space-y-2">
                                {/* Members */}
                                {team.members.map((member) => (
                                  <div key={member.id} className="flex items-center gap-2 text-sm">
                                    {getRoleIcon(member.role)}
                                    <span className="flex-1 text-foreground truncate">
                                      {member.user.name || member.user.email}
                                    </span>
                                    <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                                    {member.role !== 'owner' && team.role !== 'member' && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeMember(team.id, member.id)}
                                        className="h-6 w-6 text-muted-foreground hover:text-red-400"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                ))}

                                {/* Invite member */}
                                {team.role !== 'member' && team.members.length < 10 && (
                                  <div className="flex gap-2 mt-2 pt-2 border-t dark:border-white/5 border-border">
                                    <Input
                                      value={inviteEmail}
                                      onChange={(e) => setInviteEmail(e.target.value)}
                                      placeholder="Email to invite"
                                      type="email"
                                      className="h-8 text-xs rounded-lg dark:border-white/10 border-border dark:bg-white/5 bg-muted"
                                      onKeyDown={(e) => e.key === 'Enter' && inviteMember()}
                                    />
                                    <Button
                                      onClick={inviteMember}
                                      disabled={isInviting || !inviteEmail.trim()}
                                      size="sm"
                                      className="h-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white shrink-0"
                                    >
                                      {isInviting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Invite'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
