import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Inspect the actual prerendered response. This uses only Node standard libraries.
export function readBuiltSubmission(){
  try{return JSON.parse(readFileSync('.next/server/app/submission.json.body','utf8'));}
  catch(error){throw new Error('Run pnpm build before validating the generated submission.',{cause:error});}
}
export function validateBuiltSubmission(s){
  assert.equal(s.caseId,'DPI-HT-01');
  assert.deepEqual(s.student,{name:'Artūrs Losevs',id:'al25174'});
  assert.equal(s.decisions.length,100);
  assert.deepEqual(s.decisions.map(d=>d.id),Array.from({length:100},(_,i)=>`D${String(i+1).padStart(3,'0')}`));
  assert.equal(s.decisions.filter(d=>d.type==='operational').length,75);
  assert.equal(s.decisions.filter(d=>d.type==='material').length,25);
  const structure=JSON.parse(readFileSync('data/group-structure.json','utf8'));
  assert.deepEqual(s.decisions.map(({id,question,category,reviewTier})=>({id,category,reviewTier,question})),structure.decisions);
  assert.ok(!/Muižniece|em25177|Ērika/.test(JSON.stringify(s)),'Reference identity leaked into export');
  assert.equal(s.supportingSchedules.length,8);
  assert.equal(s.accountingBasis.decisionEffectsAdditive,false);
  const a=s.metrics;
  for(const [key,value] of Object.entries({revenue:960000,materialsUsed:405000,directPayroll:80000,costOfSales:507000,grossProfit:453000,salesPayroll:72000,adminPayroll:96000,operatingCashCosts:141000,depreciation:24000,knownOperatingProfit:77000,knownResult:65000,closingCash:60000,netAR:168000,inventory:112000,netPPE:191000,totalAssets:531000,ap:126000,payrollClosing:32000,deposits:90000,debtClosing:131000,totalLiabilities:406000,openingEquity:170000,closingEquity:125000,inventoryDifference:9000,disposalProvision:0}))assert.equal(a[key],value,key);
  assert.equal(a.basis.inventory,'movement');
  const alt=a.physicalCountAlternative;
  for(const [key,value] of Object.entries({inventory:121000,materialsUsed:396000,correctedProfit:74000,totalAssets:540000,totalLiabilities:406000,closingEquity:134000,closingCash:60000,disposalProvision:0,adopted:false,status:'SENSITIVITY ONLY'}))assert.equal(alt[key],value,`Alternative ${key}`);
  assert.equal(alt.totalAssets,alt.totalLiabilities+alt.closingEquity);
  assert.equal(alt.correctedProfit-a.knownResult,a.inventoryDifference);
  assert.match(alt.condition,/only if additional reconciliation evidence substantiates/i);
  assert.equal(a.totalAssets,a.totalLiabilities+a.closingEquity);
  assert.equal(a.openingEquity+a.knownResult-a.distributions,a.closingEquity);
  assert.equal(a.openingGrossPPE+a.capex-a.openingAccumulatedDepreciation-a.depreciation,a.netPPE);
  assert.equal(80000+a.purchases-a.materialsUsed-a.adjustments.AJ_DAMAGED_STOCK.amount,a.inventory);
  assert.equal(a.openingCash+a.cfo+a.cfi+a.cff,a.closingCash);
  assert.equal(a.closingCash,a.bankClosingCash);
  assert.equal(a.revenue-a.customerReceipts-a.adjustments.AJ_BAD_DEBT.amount,a.netAR);
  assert.equal(a.physicalInventory-a.movementInventory,a.inventoryDifference);
  assert.equal(a.bridge.reduce((sum,row)=>sum+row.amount,0),a.knownResult);
  assert.equal(a.conditionalIndirectCFO,a.cfo);
  const lines=s.financialStatements;
  const amount=(rows,id)=>rows.find(row=>row.id===id)?.amount;
  assert.equal(amount(lines.profitAndLoss.lines,'result-known'),a.knownResult);
  assert.equal(amount(lines.balanceSheet.lines,'cash'),a.closingCash);
  assert.equal(amount(lines.cashFlow.lines,'cash-close'),a.closingCash);
  assert.equal(amount(lines.profitAndLoss.lines,'insurance'),0);
  assert.equal(lines.profitAndLoss.insuranceActualAmount,'UNKNOWN');
  assert.equal(a.adoptedBasis.insuranceActualAmount,'UNKNOWN');
  assert.match(lines.profitAndLoss.lines.find(l=>l.id==='insurance').note,/not.*zero/);
  assert.equal(amount(lines.profitAndLoss.lines,'depreciation'),-a.depreciation);
  assert.equal(amount(lines.balanceSheet.lines,'equity'),a.closingEquity);
  assert.equal(amount(lines.balanceSheet.lines,'assets-total'),a.totalAssets);
  assert.equal(amount(lines.balanceSheet.lines,'liabilities-total'),a.totalLiabilities);
  const sources=new Set(s.evidenceSummary.files.map(e=>e.id));
  for(const d of s.decisions){
    assert.ok(d.effect.baseline&&d.recommendedAnswer&&d.evidence.length,`${d.id}: missing explanation`);
    for(const r of d.evidence)assert.ok(sources.has(r.id),`${d.id}: invalid evidence ${r.id}`);
    assert.equal(new Set(d.adjustmentIds).size,d.adjustmentIds.length);
    for(const id of d.adjustmentIds)assert.ok(Object.hasOwn(a.adjustments,id),`${d.id}: unknown event ${id}`);
    if(d.type==='material'){
      assert.ok(d.agentReviews&&d.aiComparison&&d.proposedReasoning&&d.proposedStudentPosition,`${d.id}: missing original analyses / proposed position`);
      for(const key of ['agent1','agent2']){
        const original=s.aiReviewTrail[key].positions[d.id],shown=d.agentReviews[key];
        for(const field of ['proposal','reasoningEvidence','challenge','statementEffect','confidence','missingEvidence','changeCondition','sourceLine','sourceText'])assert.equal(shown[field],original[field],`${d.id}/${key}/${field}`);
        assert.ok(shown.proposal&&shown.reasoningEvidence&&shown.confidence&&shown.statementEffect&&shown.sourceText);
      }
      assert.equal(d.agentsDisagree,false,'Do not manufacture accounting disagreement');
      assert.equal(d.aiComparison.finalDiffersFromAgent1,false);
      assert.equal(d.aiComparison.finalDiffersFromAgent2,false);
      assert.equal(d.certificationState,'CERTIFIED');
      assert.equal(d.finalPositionStatus,'APPROVED / CERTIFIED');
      assert.equal(d.finalAnswer,d.recommendedAnswer);
      assert.equal(d.studentAnswer,d.finalAnswer);
      assert.equal(d.studentReasoning,d.proposedReasoning,'Preserve the existing adopted reasoning');
      assert.equal(d.studentChangedAIAnswer,false);
      assert.equal(d.reviewedAt,s.certification.timestamp);
      const approval=s.certification.answers[d.id];
      assert.equal(approval?.state,'accepted');
      assert.equal(approval.answer,d.finalAnswer);
      assert.equal(approval.reason,d.studentReasoning);
      assert.equal(approval.reviewedAt,d.reviewedAt);
    }else{
      assert.notEqual(d.certificationState,'CERTIFIED','Do not invent separate operational approval');
    }
  }
  assert.equal(s.aiReviewTrail.materialJudgmentsPopulated,25);
  assert.equal(s.aiReviewTrail.accountingDisagreements,0);
  assert.equal(s.aiReviewTrail.confidenceDifferences,5);
  assert.equal(s.aiReviewTrail.presentationDifferences,2);
  assert.equal(s.certification.status,'COMPLETE');
  assert.equal(s.certification.materialReviewed,25);
  assert.deepEqual(s.certification.blockers,[]);
  assert.ok(Number.isFinite(Date.parse(s.certification.timestamp)));
  assert.equal(s.certification.operationalReviewAttested,false);
  assert.deepEqual(Object.keys(s.certification.answers),s.decisions.filter(d=>d.type==='material').map(d=>d.id));
  assert.equal(s.accountingBasis.studentAdopted,true);
  assert.equal(s.templateStatus.officialSchemaVerified,false);
  assert.equal(s.uncertainties.find(u=>u.id==='U15').status,'RESOLVED');
  for(const r of s.reconciliations){
    assert.ok(['PASS','QUALIFIED','OPEN','NOT DETERMINABLE'].includes(r.status));
    if(r.evidenceStatus==='PASS'){assert.equal(r.difference,0);assert.equal(r.uncertaintyIds.length,0);}
  }
  assert.equal(s.reconciliations.find(r=>r.id==='inventory-conflict').status,'OPEN');
  assert.equal(s.reconciliations.find(r=>r.id==='inventory-conflict').difference,9000);
  for(const id of ['inventory','ppe','equity','balance-sheet']){const r=s.reconciliations.find(r=>r.id===id);assert.equal(r.difference,0);assert.equal(r.evidenceStatus,'QUALIFIED');}
  for(const u of s.uncertainties)assert.ok(u.area&&u.confidence&&u.knownEvidence&&u.evidenceNeeded&&u.financialConsequence);
  return s;
}

if(process.argv[1]?.endsWith('validate-build.mjs')){
  const s=validateBuiltSubmission(readBuiltSubmission());
  console.log(`PASS: ${s.decisions.length} exact group decisions (75 operational / 25 material), 25 original agent comparisons, 25 approved material positions, Student Certification COMPLETE, 8 schedules, EUR 65,000 profit, EUR 531,000 assets. The physical-count model is sensitivity only; the EUR 9,000 inventory conflict remains OPEN.`);
}
