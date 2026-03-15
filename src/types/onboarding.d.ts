export interface OnboardingField {
  name: string
  key: string
  type: 'checklist' | 'text' | 'warning' | 'demoVideo'
  order: number
  description: string
  steps?: string[]
  route?: string
  videoUrl?: string
  highlightSelectors?: string[]
}

export interface OnboardingCategory {
  name: string
  key: string
  type: string
  order: number
  fields: OnboardingField[]
}

export interface OnboardingConfig {
  categories: OnboardingCategory[]
}

export interface OnboardingProgress {
  userId: string
  completedCategoryKeys: string[]
  completedFieldKeys: string[]
  dismissedAt: string | null
}
