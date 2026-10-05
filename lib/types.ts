export type Amount = number | 'UNKNOWN' | 'N/A';
export type CheckStatus = 'PASS' | 'QUALIFIED' | 'OPEN' | 'NOT DETERMINABLE';
export type Confidence = 'High' | 'Medium' | 'Low';
export type EffectKind = 'original transaction' | 'accounting classification' | 'correction/reclassification' | 'estimate' | 'closing balance' | 'duplicated/cross-reference treatment' | 'analytical comparison only' | 'governance/operational action';
export interface SourceRef { id: string; locator: string }
export interface StatementLine { id: string; label: string; amount: Amount; schedule: string; evidence: SourceRef[]; note: string; total?: boolean }
export interface Effect { baseline: string; kind: EffectKind; profit: Amount; cash: Amount; assets: Amount; liabilities: Amount; equity: Amount; note: string }
export interface ReviewAnswer { state: 'accepted' | 'modified' | 'needs-review'; answer: string; reason: string; choice: string; reviewedAt: string }
export interface ReviewState { version: 1; modelVersion: string; student: { name: string; id: string }; answers: Record<string, ReviewAnswer>; operationalAttestation: boolean; acknowledged: boolean; certifiedAt: string; status: 'PERSONAL REVIEW PENDING' | 'CERTIFIED' | 'COMPLETE'; }
export interface Decision {
  id: string; category: string; type: 'operational' | 'material'; reviewTier: 'operational' | 'material_judgment'; question: string; answer: string;
  recommendedAnswer: string; finalAnswer: string; evidence: SourceRef[]; confidence: Confidence;
  calculation: string; uncertainty: string; uncertaintyIds: string[]; certificationState: string;
  effect: Effect; underlyingTreatmentId: string; adjustmentIds: string[]; templateMapping: string;
  agent1Original: string; agent2Original: string; comparison: string;
  agentsDisagree: boolean | 'PENDING' | 'N/A'; disagreementType: string; studentAnswer: string; studentReasoning: string;
  studentChangedAIAnswer: boolean | 'PENDING' | 'N/A'; reviewedAt: string; choices: { value: string; label: string }[];
  proposedStudentPosition:string; proposedReasoning:string; proposedReasoningSource:string;
  finalPositionStatus:string;
  agentReviews?: {agent1: import('@/data/analyses').AnalysisPosition & {sourceUrl:string;sourceFile:string;sha256:string};agent2:import('@/data/analyses').AnalysisPosition & {sourceUrl:string;sourceFile:string;sha256:string}};
  aiComparison?: import('@/data/analyses').AnalysisComparison & {finalDiffersFromAgent1:boolean|'PENDING';finalDiffersFromAgent2:boolean|'PENDING'};
}
export interface Reconciliation { id: string; name: string; status: CheckStatus; formula: string; difference: Amount; detail: string; evidence: SourceRef[]; uncertaintyIds: string[] }
export interface Uncertainty { id: string; issue: string; area: string; confidence: Confidence; knownEvidence: string; financialConsequence: string; currentTreatment: string; alternative: string; evidenceNeeded: string; decisionIds: string[]; status: 'OPEN' | 'QUALIFIED' | 'RESOLVED'; evidence: SourceRef[] }
export interface Schedule { id: string; title: string; description: string; rows: StatementLine[]; formula: string; status: CheckStatus }
