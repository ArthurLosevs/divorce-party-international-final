import { caseInfo, modelVersion, templateStatus, basisExplanation } from '@/data/assumptions';
import { reviewedState, certificationWording } from '@/data/certification';
import { analyses, analysisExplanation } from '@/data/analyses';
import { evidence, accountingReferences, refs } from '@/data/evidence';
import { uncertainties } from '@/data/uncertainties';
import { makeDecisions } from '@/data/decisions';
import { calculate, basisFromReview, statements, schedules } from './accounting';
import { reconciliations } from './reconciliations';
import { certificationBlockers, reviewCount } from './review';
import { euro } from './formatting';
import groupStructure from '@/data/group-structure.json';
import type { ReviewState } from './types';

export function buildSubmission(review:ReviewState=reviewedState) {
 const a=calculate(undefined,basisFromReview(review));
 const decisions=makeDecisions(a,review);
 const material=decisions.filter(d=>d.type==='material');
 const blockers=certificationBlockers(review,decisions);
 const certified=['CERTIFIED','COMPLETE'].includes(review.status)&&blockers.length===0&&Number.isFinite(Date.parse(review.certifiedAt));
 return {
  ...caseInfo, schemaVersion:'INTERNAL-WORKING-1 (not the course schema)',modelVersion,templateStatus,
  student:{name:review.student.name||'PENDING',id:review.student.id||'PENDING'},
  certification:{status:certified?'COMPLETE':'PERSONAL REVIEW PENDING',timestamp:certified?review.certifiedAt:'PENDING',wording:certificationWording,blockers,materialReviewed:reviewCount(review,material.map(d=>d.id)),operationalReviewAttested:review.operationalAttestation,scope:'Explicit personal approval of the 25 material judgments and their existing reasoning. This does not verify unresolved source facts or official submission-schema compliance; no separate personal attestation of the 75 operational decisions is recorded.',answers:review.answers,staticSnapshot:true},
  accountingBasis:{...a.basis,explanation:basisExplanation,studentAdopted:certified,adoptionSource:certified?'Original-consumption baseline explicitly approved by Artūrs Losevs (al25174)':'Original-consumption baseline; personal certification pending',unknownRepresentation:'UNKNOWN is an unquantified actual amount; N/A is non-applicable. Insurance recognised at 0 means no supported amount recognised, not a proven factual zero.',decisionEffectsAdditive:false},
  decisionStructure:{source:'Supplied group reference',sha256:groupStructure.sha256,preservedFields:['id','question','category','reviewTier'],personalContentImported:false},
  metrics:a,
  financialStatements:statements(a),supportingSchedules:schedules(a),reconciliations:reconciliations(a),
  uncertainties,
  boardRecommendation:{
   decision:'Continue the core business conditionally under immediate cash controls. Defer binding valuation and earn-out settlement.',
   rationale:[
    `Management’s €312,000 profit is unreliable. The adopted reconstruction produces ${euro(a.knownResult)} provisional profit, including ${euro(a.depreciation)} adopted depreciation that remains independently unverified. No supported insurance amount is recognised; actual insurance and expense completeness remain uncertain. This is not certified earnings.`,
    `Bank-confirmed cash is ${euro(a.closingCash)}. AP and payroll obligations total ${euro(a.ap+a.payrollClosing)}; customer deposits of ${euro(a.deposits)} carry future-delivery obligations, and bank principal is ${euro(a.debtClosing)}. Prioritise a weekly 13-week forecast, supplier-term negotiation and collection of verified receivables.`,
    `Retain recorded materials consumed ${euro(a.materialsUsed)} and closing inventory ${euro(a.inventory)}. Physical stock differs by ${euro(a.inventoryDifference)}. The alternative profit ${euro(a.physicalCountAlternative.correctedProfit)} and inventory ${euro(a.physicalCountAlternative.inventory)} are sensitivities only, adoptable after additional reconciliation evidence substantiates the difference. Quarantine unsaleable stock and investigate count and cut-off; do not book an unexplained balancing adjustment.`,
    `The adopted balance sheet totals ${euro(a.totalAssets)} assets, ${euro(a.totalLiabilities)} liabilities and ${euro(a.closingEquity)} equity. Opening PPE and equity are adopted assumptions not independently verified from the available original evidence. Those gaps, web fulfilment, expense completeness and debt maturities prevent a conclusion on sustainable profitability or legal solvency.`,
    'Obtain opening trial balance and equity records, insurance policy/prepayments, fixed-asset/depreciation register, web-delivery evidence, full bank facility, original villa records and the acquisition/earn-out contract before valuation or settlement.'
   ],
   controls:[
    {action:'Restrict owner-card access and require dual payment approval.',evidence:refs.owner},
    {action:'Update a 13-week cash forecast weekly, including delivery commitments and supplier/payroll due dates.',evidence:[...refs.bank,...refs.payroll,...refs.deposits]},
    {action:'Reconcile AR/AP to customers, suppliers, bank and ledgers; escalate overdue balances and negotiate terms.',evidence:[...refs.revenue,...refs.purchases]},
    {action:'Recount inventory, test cut-off, quarantine damaged stock and investigate the €9,000 conflict.',evidence:refs.inventory},
    {action:'Release deposits to revenue only against evidence of delivery or acceptance; apply credit review to open sales.',evidence:[...refs.deposits,...refs.impairment]},
    {action:'Investigate management override and preserve original records and owner-payment documentation.',evidence:refs.management},
   ],evidence:[...refs.bank,...refs.management,...refs.missing]
  },
  evidenceSummary:{files:evidence,filesInspected:evidence.length,uniqueFiles:new Set(evidence.map(e=>e.sha256)).size,hierarchy:['Externally confirmed / bank / signed third-party records','Contracts / invoices / acceptance and delivery','Operational schedules','Management spreadsheets','Unsupported messages'],references:accountingReferences},
  aiReviewTrail:{...analyses,explanation:analysisExplanation,
   materialJudgmentsPopulated:material.filter(d=>d.agentReviews?.agent1.sourceText&&d.agentReviews?.agent2.sourceText&&d.comparison).length,
   accountingDisagreements:material.filter(d=>d.agentsDisagree===true).length,
   confidenceDifferences:material.filter(d=>d.aiComparison?.confidenceDifference).length,
   presentationDifferences:material.filter(d=>d.aiComparison?.presentationDifference).length,
   presentationNote:'Agent 1 presents the €22,000 inventory write-off below gross profit (€475,000); Agent 2 includes it in cost of sales (gross profit €453,000). The website retains Agent 2’s presentation. Both report €77,000 operating profit and €65,000 corrected profit.',
  },
  decisionCoverage:{total:decisions.length,operational:decisions.filter(d=>d.type==='operational').length,material:decisions.filter(d=>d.type==='material').length,groupReferenceMapping:'EXACT',officialMapping:'UNVERIFIED — official course files absent'},
  decisions,
 };
}
export type Submission = ReturnType<typeof buildSubmission>;
