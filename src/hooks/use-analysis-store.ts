import { create } from 'zustand'
import type { AnalysisResult, RoastMode, ViewMode } from '@/lib/types'

interface AnalysisState {
  view: ViewMode
  url: string
  roastMode: RoastMode
  analysisResult: AnalysisResult | null
  error: string | null
  currentStep: number
  pendingAnalysis: boolean

  setUrl: (url: string) => void
  setRoastMode: (mode: RoastMode) => void
  startAnalysis: () => void
  setAnalysisResult: (result: AnalysisResult) => void
  setError: (error: string | null) => void
  reset: () => void
  setView: (view: ViewMode) => void
  setStep: (step: number) => void
  setPendingAnalysis: (pending: boolean) => void
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  view: 'landing',
  url: '',
  roastMode: 'professional',
  analysisResult: null,
  error: null,
  currentStep: 0,
  pendingAnalysis: false,

  setUrl: (url) => set({ url }),
  setRoastMode: (roastMode) => set({ roastMode }),
  startAnalysis: () => set({ view: 'loading', error: null, currentStep: 0 }),
  setAnalysisResult: (analysisResult) => set({ view: 'results', analysisResult, currentStep: 6, pendingAnalysis: false }),
  setError: (error) => set({ error, view: 'landing', pendingAnalysis: false }),
  reset: () => {
    // Clean up URL query params when going back to landing
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', '/')
    }
    return set({ view: 'landing', analysisResult: null, error: null, currentStep: 0, url: '', pendingAnalysis: false })
  },
  setView: (view) => set({ view }),
  setStep: (currentStep) => set({ currentStep }),
  setPendingAnalysis: (pendingAnalysis) => set({ pendingAnalysis }),
}))
