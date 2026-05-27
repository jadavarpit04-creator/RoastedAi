'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { PLANS, FEATURES, FEATURE_LABELS, type PlanKey } from '@/lib/plan-config'

export interface UsageData {
  plan: PlanKey
  planName: string
  analysesPerDay: number
  analysesUsedToday: number
  analysesRemaining: number
  isUnlimited: boolean
  canAnalyze: boolean
  features: Record<string, boolean>
  subscription: {
    id: string
    plan: string
    status: string
    billingCycle: string
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  } | null
  isExpired: boolean
  isAdmin?: boolean
}

export function usePlanFeatures() {
  const { data: session } = useSession()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUsage = useCallback(async () => {
    if (!session?.user) {
      // Not logged in — return free plan defaults
      const freeConfig = PLANS.free
      setUsage({
        plan: 'free',
        planName: freeConfig.name,
        analysesPerDay: freeConfig.analysesPerDay,
        analysesUsedToday: 0,
        analysesRemaining: freeConfig.analysesPerDay,
        isUnlimited: false,
        canAnalyze: true,
        features: freeConfig.features,
        subscription: null,
        isExpired: false,
      })
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/user/usage')
      if (res.ok) {
        const data = await res.json()
        setUsage(data)
      }
    } catch {
      // Fallback to session plan
      const planKey = (session?.user?.plan || 'free') as PlanKey
      const planConfig = PLANS[planKey] || PLANS.free
      setUsage({
        plan: planKey,
        planName: planConfig.name,
        analysesPerDay: planConfig.analysesPerDay,
        analysesUsedToday: 0,
        analysesRemaining: planConfig.analysesPerDay === -1 ? -1 : planConfig.analysesPerDay,
        isUnlimited: planConfig.analysesPerDay === -1,
        canAnalyze: true,
        features: planConfig.features,
        subscription: null,
        isExpired: false,
      })
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  // Feature check helpers
  const hasFeature = useCallback((feature: string): boolean => {
    if (!usage?.features) return false
    return usage.features[feature] ?? false
  }, [usage])

  const getMinPlanForFeature = useCallback((feature: string): PlanKey => {
    return (FEATURE_LABELS[feature]?.minPlan as PlanKey) || 'free'
  }, [])

  const isFeatureLocked = useCallback((feature: string): boolean => {
    return !hasFeature(feature)
  }, [hasFeature])

  // Convenience feature checks
  const canUseSavageMode = hasFeature(FEATURES.savageMode)
  const canExportPdf = hasFeature(FEATURES.pdfExport)
  const canCompare = hasFeature(FEATURES.competitorComparison)
  const canUseApi = hasFeature(FEATURES.apiAccess)
  const canUseFullAudit = hasFeature(FEATURES.fullAudit)
  const canUseWhiteLabel = hasFeature(FEATURES.whiteLabel)
  const canUseTeamMembers = hasFeature(FEATURES.teamMembers)
  const canUseSecurityScanner = hasFeature(FEATURES.securityScanner)
  const canUseTechStack = hasFeature(FEATURES.techStackAnalysis)

  return {
    usage,
    loading,
    refetch: fetchUsage,
    hasFeature,
    getMinPlanForFeature,
    isFeatureLocked,
    // Convenience booleans
    canUseSavageMode,
    canExportPdf,
    canCompare,
    canUseApi,
    canUseFullAudit,
    canUseWhiteLabel,
    canUseTeamMembers,
    canUseSecurityScanner,
    canUseTechStack,
    // Plan info
    currentPlan: usage?.plan || 'free',
    planName: usage?.planName || 'Free',
    analysesRemaining: usage?.analysesRemaining ?? 3,
    analysesUsedToday: usage?.analysesUsedToday ?? 0,
    isUnlimited: usage?.isUnlimited ?? false,
    canAnalyze: usage?.canAnalyze ?? true,
    isExpired: usage?.isExpired ?? false,
    isAdmin: usage?.isAdmin ?? false,
  }
}
