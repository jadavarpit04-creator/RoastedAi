export interface CategoryAnalysis {
  score: number
  issues: string[]
  suggestions: string[]
}

export interface AnalysisData {
  overallScore: number
  uiux: CategoryAnalysis
  seo: CategoryAnalysis
  accessibility: CategoryAnalysis
  performance: CategoryAnalysis
  mobile: CategoryAnalysis
  design: CategoryAnalysis
  conversion: CategoryAnalysis
  roast: string
  finalVerdict: string
}

export interface WebsiteInfo {
  title: string
  url: string
  domain: string
}

export interface AnalysisResult {
  success: boolean
  reportId: string
  data: AnalysisData
  website: WebsiteInfo
}

export type RoastMode = 'professional' | 'savage'
export type ViewMode = 'landing' | 'loading' | 'results' | 'billing'

export interface CategoryKey {
  key: keyof Omit<AnalysisData, 'overallScore' | 'roast' | 'finalVerdict'>
  label: string
  icon: string
  color: string
}
