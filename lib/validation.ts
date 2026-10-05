import { buildSubmission } from './submission';
import { facts, bank, payroll } from '@/data/inputs';
import { sum } from './accounting';
import { validateReviewShape, certificationBlockers } from './review';
import type { ReviewState } from './types';
import structure from '@/data/group-structure.json';

export function validateSubmission(s:ReturnType<typeof buildSubmission>,final=false):string[] {
 const errors:string[]=[];
 const fail=(ok:boolean,message:string)=>{if(!ok)errors.push(message);};
 const ids=s.decisions.map(d=>d.id);
 fail(ids.length===100,'Exactly 100 decisions required.');
 fail(new Set(ids).size===100,'Duplicate decision ID.');
 for(let i=1;i<=100;i++)fail(ids.includes(`D${String(i).padStart(3,'0')}`),`Missing D${String(i).padStart(3,'0')}.`);
 fail(s.decisions.filter(d=>d.type==='operational').length===75&&s.decisions.filter(d=>d.type==='material').length===25,'Wrong operational/material counts.');
 fail(s.student.id==='al25174'&&s.student.name==='Artūrs Losevs','Student identity mismatch.');
 for(const expected of structure.decisions){const actual=s.decisions.find(d=>d.id===expected.id);for(const key of ['id','question','category','reviewTier'] as const)fail(actual?.[key]===expected[key],`${expected.id}: group structure differs in ${key}.`);}
 const a=s.metrics,fs=s.financialStatements;
 fail(s.currency==='EUR'&&s.units==='euros','Units must be EUR euros.');
 fail(a.closingCash===facts.confirmedCash&&a.bankClosingCash===facts.confirmedCash,'Cash / bank mismatch, including possible cents/euros mismatch.');
 fail(a.openingCash+a.cfo+a.cfi+a.cff===a.closingCash,'Cash roll-forward failure.');
 fail(a.revenue-a.customerReceipts-facts.badDebt===a.netAR&&sum(a.revenueRows.map(c=>c.grossAR))===a.grossAR,'AR reconciliation failure.');
 fail(a.inferredOpeningAP+a.purchases-a.supplierPayments===a.ap&&sum(a.supplierRows.map(x=>x.payable))===a.ap,'AP reconciliation failure.');
 fail(facts.openingPayroll+a.payrollExpense-a.payrollCash===a.payrollClosing&&sum(payroll.map(p=>p.paid))===a.payrollCash,'Payroll reconciliation failure.');
 fail(a.capex===facts.packagingMachine+facts.photoBooth,'PPE addition reconciliation failure.');
 fail(facts.openingLoan+a.borrowing-a.principalRepaid===a.debtClosing&&a.debtClosing===facts.confirmedLoan,'Debt reconciliation failure.');
 fail(a.inferredOpeningInterest+facts.interestExpense-a.interestPaid===facts.confirmedInterestPayable,'Interest reconciliation failure.');
 fail(a.movementInventory===facts.openingInventory+a.purchases-facts.materialsConsumed-facts.damagedStock,'Inventory roll-forward failure / duplicate write-down.');
 fail(a.physicalInventory-a.movementInventory===a.inventoryDifference,'Inventory discrepancy hidden.');
 fail(a.knownResult===a.revenue-a.materialsUsed-a.payrollExpense-facts.damagedStock-a.operatingCashCosts-a.depreciation-facts.badDebt-a.basis.legal-a.disposalProvision-facts.interestExpense-a.adoptedBasis.insuranceRecognised,'Profit arithmetic / duplicated expense.');
 fail(facts.openingInventory+a.purchases-a.materialsUsed-facts.damagedStock===a.inventory,'Adopted inventory roll-forward failure.');
 fail(a.openingGrossPPE+a.capex-a.openingAccumulatedDepreciation-a.depreciation===a.netPPE,'PPE roll-forward failure.');
 fail(a.openingEquity+a.knownResult-a.distributions===a.closingEquity&&a.totalAssets===a.totalLiabilities+a.closingEquity,'Equity or balance-sheet failure.');
 fail(sum(a.bridge.map(r=>r.amount))===a.knownResult,'Management bridge failure.');
 fail(a.conditionalIndirectCFO===a.cfo,'Conditional indirect CFO cross-check failure.');
 for(let i=1;i<bank.length;i++)fail(bank[i-1].balance+bank[i].credit-bank[i].debit===bank[i].balance,`Bank row ${i+2} fails.`);
 const lookup=(rows:{id:string;amount:unknown}[],id:string)=>rows.find(l=>l.id===id)?.amount;
 fail(lookup(fs.profitAndLoss.lines,'revenue')===a.revenue&&lookup(fs.profitAndLoss.lines,'result-known')===a.knownResult&&fs.profitAndLoss.knownItemsResult===a.knownResult,'P&L and canonical model inconsistent.');
 fail(lookup(fs.cashFlow.lines,'cash-close')===a.closingCash&&lookup(fs.balanceSheet.lines,'cash')===a.closingCash,'Website / JSON cash inconsistent.');
 fail(lookup(fs.balanceSheet.lines,'inventory')===a.inventory&&lookup(fs.balanceSheet.lines,'loan')===a.debtClosing,'Balance sheet/model inconsistent.');
 fail(lookup(fs.profitAndLoss.lines,'depreciation')===-a.depreciation&&lookup(fs.profitAndLoss.lines,'insurance')===0&&fs.profitAndLoss.insuranceActualAmount==='UNKNOWN','Adopted depreciation / qualified insurance representation mismatch.');
 fail(lookup(fs.balanceSheet.lines,'equity')===a.closingEquity&&fs.balanceSheet.status==='QUALIFIED','Adopted equity or its qualification missing.');
 for(const [key,value] of Object.entries({revenue:960000,materialsUsed:405000,costOfSales:507000,grossProfit:453000,knownOperatingProfit:77000,knownResult:65000,closingCash:60000,netAR:168000,inventory:112000,netPPE:191000,totalAssets:531000,totalLiabilities:406000,closingEquity:125000,inventoryDifference:9000,disposalProvision:0}))fail(a[key as keyof typeof a]===value,`Primary ${key} differs from the approved baseline instruction.`);
 const alt=a.physicalCountAlternative;
 fail(!alt.adopted&&alt.status==='SENSITIVITY ONLY','Physical-count alternative must not become the primary baseline.');
 fail(alt.inventory===121000&&alt.materialsUsed===396000&&alt.correctedProfit===74000&&alt.totalAssets===540000&&alt.closingEquity===134000&&alt.totalLiabilities===406000,'Sensitivity values mismatch.');
 fail(alt.totalAssets===alt.totalLiabilities+alt.closingEquity&&alt.correctedProfit-a.knownResult===a.inventoryDifference&&alt.closingCash===a.closingCash&&alt.disposalProvision===0,'Sensitivity reconciliation failure.');
 fail(s.aiReviewTrail.materialJudgmentsPopulated===25,'Original agent material-judgment coverage incomplete.');
 for(const r of s.reconciliations)if(r.status==='PASS')fail(r.difference===0&&r.uncertaintyIds.length===0,`Unresolved issue falsely marked reconciled: ${r.id}`);
 fail(s.reconciliations.find(r=>r.id==='inventory-conflict')?.status==='OPEN','Inventory conflict falsely resolved.');
 fail(s.reconciliations.find(r=>r.id==='ppe')?.status==='QUALIFIED','Unsupported PPE roll-forward certified.');
 const owner=s.decisions.find(d=>d.id==='D047');
 fail(owner?.effect.cash===0&&owner.effect.equity===0,'Owner reclassification duplicates cash or equity.');
 fail(s.accountingBasis.decisionEffectsAdditive===false,'Decision effects cannot be summed as journals.');
 for(const d of s.decisions){fail(d.evidence.length>0&&!!d.question&&!!d.recommendedAnswer&&!!d.effect.baseline,`${d.id} required decision content missing.`);if(d.studentReasoning.startsWith('PENDING'))fail(d.certificationState!=='CERTIFIED',`${d.id} fake student review.`);if(d.type==='material')fail(!!d.agentReviews?.agent1.sourceText&&!!d.agentReviews?.agent2.sourceText&&!!d.agentReviews?.agent1.confidence&&!!d.agentReviews?.agent2.confidence&&!!d.proposedReasoning&&!!d.aiComparison,`${d.id} original analysis fields missing.`);}
 if(s.certification.status==='COMPLETE'){
  fail(s.certification.blockers.length===0&&s.certification.materialReviewed===25&&Number.isFinite(Date.parse(s.certification.timestamp)),'Certification inconsistency.');
  for(const d of s.decisions.filter(d=>d.type==='material'))fail(d.certificationState==='CERTIFIED'&&d.finalPositionStatus==='APPROVED / CERTIFIED'&&d.finalAnswer===d.studentAnswer&&!!d.studentReasoning.trim()&&Number.isFinite(Date.parse(d.reviewedAt)),`${d.id}: approved position is incomplete.`);
 }
 if(final)fail(s.certification.status==='COMPLETE'&&s.templateStatus.officialSchemaVerified,'Final submission blocked: official schema/provenance/personal certification incomplete.');
 const walk=(v:unknown,path:string)=>{if(v===null||v===undefined||(typeof v==='number'&&!Number.isFinite(v)))errors.push(`Invalid JSON value at ${path}`);else if(v==='NOT_PROVIDED')errors.push(`Forbidden placeholder at ${path}`);else if(Array.isArray(v))v.forEach((x,i)=>walk(x,`${path}[${i}]`));else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>walk(x,`${path}.${k}`));};
 walk(s,'submission');
 try{JSON.parse(JSON.stringify(s));}catch{errors.push('Broken JSON.');}
 return errors;
}
export function validateReviewImport(value:unknown) {
 validateReviewShape(value);
 const s=value as ReviewState;
 const submission=buildSubmission(s);
 for(const d of submission.decisions){const r=s.answers[d.id];if(!r)continue;
  if(r.state==='accepted'&&r.answer!==d.recommendedAnswer)throw new Error(`${d.id}: accepted answer differs from the current model; review it again.`);
  if(d.choices.length&&r.choice!=='custom'&&!d.choices.some(c=>c.value===r.choice))throw new Error(`${d.id}: invalid treatment choice.`);
  if(r.state==='modified'&&!d.choices.length&&r.choice!=='custom')throw new Error(`${d.id}: custom modification needs canonical model mapping.`);
 }
 if(['CERTIFIED','COMPLETE'].includes(s.status)){
  const blockers=certificationBlockers(s,submission.decisions);
  if(blockers.length||!Number.isFinite(Date.parse(s.certifiedAt)))throw new Error('Cannot import certification: '+blockers.join(' '));
 }
 const problems=validateSubmission(submission);
 if(problems.length)throw new Error(problems.join('\n'));
 return submission;
}
