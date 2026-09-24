import type { AnalysisInput, AnalysisResult } from './analysis-contract'

export type ScanStage = 'updating' | 'filtering' | 'risk' | 'ranking'
export type StageObserver = (stage: ScanStage) => void

export interface AnalysisService {
  run(input: AnalysisInput, onStage: StageObserver): Promise<AnalysisResult>
}
