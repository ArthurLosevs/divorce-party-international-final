import { bank, customers, suppliers, payroll, facts } from '@/data/inputs';
import { defaultBasis } from '@/data/assumptions';
import { adoptedBasis } from '@/data/adopted-basis';
import { refs, ref } from '@/data/evidence';
import type { Amount, ReviewState, Schedule, SourceRef, StatementLine } from './types';
import { num } from './formatting';

export const sourceInputs = { bank, customers, suppliers, payroll, facts };
export type Inputs = typeof sourceInputs;
export type Basis = typeof defaultBasis;
export const sum = (values: number[]) => values.reduce((a,b) => a+b, 0);
export function basisFromReview(_review: ReviewState): Basis {
  // Personal review text never silently changes the adopted accounts.
  return {...defaultBasis};
}
export function calculate(input: Inputs = sourceInputs, basis: Basis = defaultBasis) {
  const { facts:f } = input;
  const entry = (reference: string) => { const x = input.bank.find(b=>b.reference===reference); if(!x) throw new Error(`Missing bank reference ${reference}`); return x; };
  const paid = (r: string) => entry(r).debit;
  const received = (r: string) => entry(r).credit;
  const revenueRows = input.customers.map(c=>({...c, cash:received(c.receipt), grossAR:c.revenue-received(c.receipt)}));
  const revenue = sum(revenueRows.map(c=>c.revenue));
  const customerReceipts = sum(revenueRows.map(c=>c.cash));
  const openingARCollection = received('RCPT-001');
  const deposits = received('DEP-NB')+received('DEP-FF2');
  // One amount per economic event. Decisions reference these IDs; they never post entries.
  const adjustments = {
    AJ_BAD_DEBT: {amount:f.badDebt as Amount, treatment:'r17', status:'CONFIRMED', evidence:refs.impairment},
    AJ_DAMAGED_STOCK: {amount:f.damagedStock as Amount, treatment:'stock-write-down', status:'CONFIRMED', evidence:refs.inventory},
    AJ_LEGAL_PROVISION: {amount:basis.legal as Amount, treatment:'legal', status:'QUALIFIED', evidence:refs.legal},
    AJ_DEPRECIATION: {amount:adoptedBasis.periodDepreciation as Amount, treatment:'depreciation', status:'QUALIFIED', evidence:refs.ppe},
    AJ_CUSTOMER_DEPOSITS: {amount:deposits as Amount, treatment:'deposits', status:'CONFIRMED', evidence:refs.deposits},
    AJ_OWNER_DISTRIBUTIONS: {amount:(paid('VILLA')+paid('OWNERCARD')) as Amount, treatment:'owner-distribution', status:'QUALIFIED', evidence:refs.owner},
    AJ_DISPOSAL_PROVISION: {amount:(basis.disposal?f.disposalQuote:0) as Amount, treatment:'disposal', status:'QUALIFIED', evidence:refs.inventory},
  };
  const grossAR = revenue-customerReceipts;
  const netAR = grossAR-f.badDebt;
  const supplierRows = input.suppliers.map(s=>({...s, paid:paid(s.payment), inferredOpening:s.payable-s.received+paid(s.payment)}));
  const purchases = sum(supplierRows.map(s=>s.received));
  const supplierPayments = sum(supplierRows.map(s=>s.paid));
  const ap = sum(supplierRows.map(s=>s.payable));
  const inferredOpeningAP = ap-purchases+supplierPayments;
  const payrollExpense = sum(input.payroll.map(p=>p.expense));
  const payrollCash = paid('PAYROLL');
  const payrollClosing = f.openingPayroll+payrollExpense-payrollCash;
  const movementGrossInventory = f.openingInventory+purchases-f.materialsConsumed;
  const movementInventory = movementGrossInventory-f.damagedStock;
  const physicalInventory = f.physicalGoodFSB+f.physicalGoodNCB;
  const physicalGrossInventory = physicalInventory+f.damagedStock;
  const inventoryDifference = physicalInventory-movementInventory;
  const inventory = movementInventory;
  const materialsUsed = f.materialsConsumed;
  const operating = ['RENT','MKT','SOFT','UTIL','REPAIR'].map(id=>({id, cash:paid(id)}));
  const operatingCashCosts = sum(operating.map(o=>o.cash));
  const capex = paid('CAPEX-PACK')+paid('CAPEX-PHOTO');
  const openingGrossPPE=adoptedBasis.openingGrossPPE;
  const openingAccumulatedDepreciation=adoptedBasis.openingAccumulatedDepreciation;
  const depreciation=adoptedBasis.periodDepreciation;
  const closingGrossPPE=openingGrossPPE+capex;
  const closingAccumulatedDepreciation=openingAccumulatedDepreciation+depreciation;
  const netPPE=closingGrossPPE-closingAccumulatedDepreciation;
  const borrowing = received('LOAN-ADV');
  const principalRepaid = paid('PRINCIPAL');
  const debtClosing = f.openingLoan+borrowing-principalRepaid;
  const interestPaid = paid('INT');
  const interestPayableMovement = f.interestExpense-interestPaid;
  const inferredOpeningInterest = f.confirmedInterestPayable+interestPaid-f.interestExpense;
  const distributions = adjustments.AJ_OWNER_DISTRIBUTIONS.amount as number;
  const disposalProvision = adjustments.AJ_DISPOSAL_PROVISION.amount as number;
  const directPayroll = input.payroll[0].expense;
  const salesPayroll = input.payroll[1].expense;
  const adminPayroll = input.payroll[2].expense;
  const costOfSales=materialsUsed+directPayroll+f.damagedStock;
  const grossProfit = revenue-costOfSales;
  const knownOperatingProfit = grossProfit-salesPayroll-adminPayroll-operatingCashCosts-depreciation-f.badDebt-basis.legal-disposalProvision-adoptedBasis.insuranceRecognised;
  const knownResult = knownOperatingProfit-f.interestExpense;
  const cfo = customerReceipts+openingARCollection+deposits-supplierPayments-payrollCash-operatingCashCosts-interestPaid;
  const cfi = -capex;
  const cff = borrowing-principalRepaid-distributions;
  const openingCash = entry('OPEN').balance;
  const closingCash = openingCash+cfo+cfi+cff;
  const bankClosingCash = input.bank[input.bank.length-1].balance;
  const knownCurrentAssets = closingCash+netAR+inventory;
  const knownLiabilities = ap+payrollClosing+deposits+basis.legal+disposalProvision+f.confirmedInterestPayable+debtClosing;
  const totalAssets=knownCurrentAssets+netPPE;
  const openingEquity=adoptedBasis.openingEquity;
  const closingEquity=openingEquity+knownResult-distributions;
  const totalLiabilities=knownLiabilities;
  const obligationsExcludingDebtMaturity = knownLiabilities-debtClosing;
  // Adopted opening balances and gross working capital avoid duplicate impairment add-backs.
  const conditionalIndirectCFO = knownResult+depreciation+f.badDebt+f.damagedStock+basis.legal+disposalProvision-(grossAR-openingARCollection)-(movementGrossInventory-f.openingInventory)+(ap-inferredOpeningAP)+(payrollClosing-f.openingPayroll)+deposits+interestPayableMovement;
  const alternativeMaterialsUsed=f.openingInventory+purchases-f.damagedStock-physicalInventory;
  const alternativeProfitChange=materialsUsed-alternativeMaterialsUsed;
  const physicalCountAlternative={
    status:'SENSITIVITY ONLY',adopted:false,
    condition:'Adopt only if additional reconciliation evidence substantiates the €9,000 physical-count difference and supports the corresponding reduction in materials consumed. Until then, retain the original consumption record and roll-forward baseline.',
    inventory:physicalInventory,materialsUsed:alternativeMaterialsUsed,
    costOfSales:alternativeMaterialsUsed+directPayroll+f.damagedStock,
    grossProfit:grossProfit+alternativeProfitChange,operatingProfit:knownOperatingProfit+alternativeProfitChange,
    correctedProfit:knownResult+alternativeProfitChange,
    totalAssets:totalAssets+inventoryDifference,totalLiabilities,
    closingEquity:closingEquity+alternativeProfitChange,
    closingCash,netAR,netPPE,disposalProvision,
    difference:inventoryDifference,profitChange:alternativeProfitChange,
  };
  const bridge = [
    {label:'Management claimed profit', amount:f.managementProfit},
    {label:'Replace claimed sales with delivered / provisionally supported revenue', amount:revenue-f.managementSales},
    {label:'Remove bank advance from income', amount:-f.managementBankIncome},
    {label:'Replace aggregate materials and wages with recorded materials consumed, employee payroll and one stock write-down', amount:f.managementMaterialsWages-(materialsUsed+payrollExpense+f.damagedStock)},
    {label:'Replace aggregate operating costs with known operating costs, R-17 and legal estimate', amount:f.managementOpex-(operatingCashCosts+f.badDebt+basis.legal+disposalProvision)},
    {label:'Recognise adopted period depreciation', amount:-depreciation},
    {label:'Recognise period interest expense', amount:-f.interestExpense},
  ];
  return {basis, adjustments, adoptedBasis, physicalCountAlternative, materialsUsed,costOfSales,openingGrossPPE,openingAccumulatedDepreciation,depreciation,closingGrossPPE,closingAccumulatedDepreciation,netPPE,openingEquity,closingEquity,totalAssets,totalLiabilities, revenueRows,revenue,customerReceipts,openingARCollection,deposits,grossAR,netAR,supplierRows,purchases,supplierPayments,ap,inferredOpeningAP,payrollExpense,payrollCash,payrollClosing,movementGrossInventory,movementInventory,physicalGrossInventory,physicalInventory,inventoryDifference,inventory,operating,operatingCashCosts,capex,borrowing,principalRepaid,debtClosing,interestPaid,interestPayableMovement,inferredOpeningInterest,distributions,disposalProvision,directPayroll,salesPayroll,adminPayroll,grossProfit,knownOperatingProfit,knownResult,cfo,cfi,cff,openingCash,closingCash,bankClosingCash,knownCurrentAssets,knownLiabilities,obligationsExcludingDebtMaturity,conditionalIndirectCFO,bridge};
}
export type Accounts = ReturnType<typeof calculate>;
export function line(id:string,label:string,amount:Amount,schedule:string,evidence:SourceRef[],note='',total=false):StatementLine { return {id,label,amount,schedule,evidence,note,total}; }
export function statements(a:Accounts) {
 const l = line;
 return {
  profitAndLoss: {status:'QUALIFIED', label:'1 January–31 August 2026', finalProfit:a.knownResult, knownItemsResult:a.knownResult, insuranceActualAmount:'UNKNOWN', lines:[
   l('revenue','Recognised revenue',a.revenue,'revenue',refs.revenue,'Includes CRM-supported web sales; fulfilment corroboration still required.'),
   l('materials','Materials consumed — original warehouse record',-a.materialsUsed,'inventory',refs.inventory,'Primary baseline retains recorded consumption. Physical-count difference of €9,000 remains open; the alternative is sensitivity only.'),
   l('direct-payroll','Direct event / service payroll',-a.directPayroll,'payroll',refs.payroll),
   l('stock-impairment','Inventory write-down',-facts.damagedStock,'inventory',refs.inventory,'Recorded once.'),
   l('cost-of-sales','Total cost of sales',-a.costOfSales,'inventory',refs.inventory,'Materials used + direct event payroll + damaged stock, each counted once.',true),
   l('gross-profit','Gross profit',a.grossProfit,'inventory',refs.inventory,'Adopted reconstruction.',true),
   l('sales-payroll','Sales payroll',-a.salesPayroll,'payroll',refs.payroll),
   l('admin-payroll','Office / admin payroll',-a.adminPayroll,'payroll',refs.payroll),
   ...a.operating.map(o=>l(o.id,{RENT:'Rent',MKT:'Marketing',SOFT:'Software',UTIL:'Utilities',REPAIR:'Restoration / repairs'}[o.id]||o.id,-o.cash,'expenses',refs.expenses,'Bank-supported period cost basis; accrual completeness unverified.')),
   l('depreciation','Depreciation — adopted estimate',-a.depreciation,'ppe',refs.ppe,'Adopted reference-based estimate. Original invoices support additions only; the assets workbook is missing, so depreciation remains unverified.'),
   l('bad-debt','R-17 receivable impairment',-facts.badDebt,'revenue',refs.impairment,'Valid sale retained; impairment recognised once.'),
   l('legal','Legal provision',-a.basis.legal,'expenses',refs.legal,'Counsel range €20,000–€30,000; selected estimate shown.'),
   l('disposal','Disposal provision',-a.disposalProvision,'inventory',refs.inventory,a.basis.disposal?'Alternative sensitivity: present obligation still requires corroboration.':'No reporting-date obligation evidenced; €2,000 future quote disclosed.'),
   l('insurance','Insurance — no supported amount recognised',adoptedBasis.insuranceRecognised,'expenses',refs.missing,adoptedBasis.insurancePolicy),
   l('operating-known','Operating profit — provisional',a.knownOperatingProfit,'expenses',refs.expenses,'Adopted model; expense completeness remains qualified.',true),
   l('interest','Interest expense',-facts.interestExpense,'debt',refs.debt),
   l('result-known','Corrected profit — provisional',a.knownResult,'expenses',refs.expenses,'Adopted reconstruction. VAT and corporate tax excluded. Insurance and other unquantified adjustments remain evidence limitations.',true),
  ]},
  cashFlow: {status:'PASS',method:'Direct; interest paid classified as operating consistently',lines:[
   l('cash-open','Opening cash',a.openingCash,'cash',refs.bank,'Opening balance is excluded from period receipts.'),
   l('customer-receipts','Current-period customer receipts',a.customerReceipts,'revenue',refs.bank),
   l('opening-ar','Opening-AR collection',a.openingARCollection,'revenue',refs.bank,'Not current-period revenue.'),
   l('deposits','Future-delivery customer deposits',a.deposits,'revenue',refs.deposits),
   l('suppliers','Supplier payments',-a.supplierPayments,'purchases',refs.purchases),
   l('payroll','Payroll payments',-a.payrollCash,'payroll',refs.payroll),
   ...a.operating.map(o=>l(`cf-${o.id}`,{RENT:'Rent paid',MKT:'Marketing paid',SOFT:'Software paid',UTIL:'Utilities paid',REPAIR:'Repairs paid'}[o.id]||o.id,-o.cash,'expenses',refs.expenses)),
   l('interest-paid','Interest paid',-a.interestPaid,'debt',refs.debt),
   l('cfo','Net operating cash flow',a.cfo,'cash',refs.bank,'',true),
   l('capex','Equipment acquisitions',a.cfi,'ppe',refs.ppe),
   l('cfi','Net investing cash flow',a.cfi,'ppe',refs.ppe,'Subtotal; do not add again.',true),
   l('borrowing','New borrowing',a.borrowing,'debt',refs.debt),
   l('principal','Principal repayments',-a.principalRepaid,'debt',refs.debt),
   l('owner','Owner distributions',-a.distributions,'equity',refs.owner,'Original cash movements only. Reclassification adds no cash flow.'),
   l('cff','Net financing cash flow',a.cff,'debt',refs.debt,'',true),
   l('cash-change','Net cash movement',a.cfo+a.cfi+a.cff,'cash',refs.bank,'',true),
   l('cash-close','Closing cash',a.closingCash,'cash',refs.bank,'Agrees with external bank confirmation.',true),
  ]},
  balanceSheet:{status:'QUALIFIED',date:'2026-08-31',lines:[
   l('cash','Cash',a.closingCash,'cash',refs.bank),
   l('ar','Receivables — identified balances, net',a.netAR,'revenue',refs.revenue,'Opening AR completeness unknown.'),
   l('inventory','Inventory — consumption roll-forward basis',a.inventory,'inventory',refs.inventory,'Opening inventory + purchases − recorded consumption − one damaged-stock write-off. The €9,000 physical-count excess remains unresolved; no separate adjustment posted.'),
   l('known-current-assets','Current assets — adopted subtotal',a.knownCurrentAssets,'inventory',refs.inventory,'No unsupported additional receivable or prepayment recognised.',true),
   l('ppe','PPE, net — adopted reconstruction',a.netPPE,'ppe',refs.ppe,'Opening PPE and depreciation are adopted assumptions not independently verified by the available original evidence; the supplied invoices support additions only.'),
   l('assets-total','Total assets — adopted',a.totalAssets,'equity',refs.missing,'Excludes unquantified insurance/prepayment and other completeness exposures.',true),
   l('ap','Trade payables',a.ap,'purchases',refs.purchases),
   l('payroll-accrual','Payroll accrual',a.payrollClosing,'payroll',refs.payroll),
   l('advances','Customer advances',a.deposits,'revenue',refs.deposits),
   l('legal-liability','Legal provision',a.basis.legal,'expenses',refs.legal),
   l('disposal-liability','Disposal provision',a.disposalProvision,'inventory',refs.inventory),
   l('interest-payable','Interest payable',facts.confirmedInterestPayable,'debt',refs.debt),
   l('loan','Bank loan principal',a.debtClosing,'debt',refs.debt,'Current/non-current split unknown: maturity terms absent.'),
   l('liabilities-total','Total liabilities — adopted',a.totalLiabilities,'debt',refs.debt,'Unquantified additional obligations remain an evidence limitation.',true),
   l('equity','Closing equity — adopted reconstruction',a.closingEquity,'equity',refs.missing,'Opening equity + adopted profit − owner distributions; opening equity is unverified.',true),
   l('liabilities-equity','Total liabilities and equity',a.totalLiabilities+a.closingEquity,'equity',refs.missing,'Arithmetic equality does not verify opening balances or evidence completeness.',true),
  ]}
 };
}

export function schedules(a:Accounts):Schedule[] {
 const l=line;
 return [
  {id:'revenue',title:'Revenue & receivables',status:'QUALIFIED',description:'Contract acceptances are corroborated. Web-sales delivery and opening receivable completeness are not. R-17 is part of WEB-NCB, not an additional sale.',rows:[
   ...a.revenueRows.flatMap(c=>[l(c.invoice,c.name+' — revenue',c.revenue,'revenue',refs.revenue,c.source+'; '+c.date),l(c.invoice+'-cash',c.name+' — collected',c.cash,'revenue',refs.bank),l(c.invoice+'-ar',c.name+' — gross outstanding',c.grossAR,'revenue',refs.revenue)]),
   l('ar-gross','Gross identified receivables',a.grossAR,'revenue',refs.revenue,'',true),l('ar-impairment','R-17 allowance',-facts.badDebt,'revenue',refs.impairment),l('ar-net','Net identified receivables',a.netAR,'revenue',refs.revenue,'',true),l('ar-opening','Minimum evidenced opening AR collected',a.openingARCollection,'revenue',refs.bank,'Does not prove complete opening AR.'),l('opening-ar-complete','Complete opening AR','UNKNOWN','revenue',refs.missing),l('deposits','September advances',a.deposits,'revenue',refs.deposits),
  ],formula:`Identified current-period AR: ${num(a.revenue)} − ${num(a.customerReceipts)} − ${num(facts.badDebt)} = ${num(a.netAR)}. Complete opening AR remains unknown.`},
  {id:'inventory',title:'Inventory & COGS',status:'QUALIFIED',description:'The primary roll-forward retains materials consumed in the original warehouse record. The higher physical count is a conditional sensitivity, requiring additional reconciliation evidence before adoption. The unresolved difference is not an additional expense or a balancing journal.',rows:[
   l('inv-open','Opening inventory',facts.openingInventory,'inventory',refs.inventory),
   l('inv-in','Goods received',a.purchases,'inventory',refs.purchases),
   l('inv-use','Materials consumed — recorded',-a.materialsUsed,'inventory',refs.inventory,'Original warehouse consumption retained in the baseline; reconcile against the physical count.'),
   l('inv-write-down','Damaged stock — single write-off',-facts.damagedStock,'inventory',refs.inventory),
   l('inv-count-net','Closing inventory — primary baseline',a.inventory,'inventory',refs.inventory,'Roll-forward after the damaged-stock write-off.',true),
   l('warehouse-use','Original warehouse materials consumed',facts.materialsConsumed,'inventory',refs.inventory,'Cross-reference to the same consumption charge; not an additional expense.'),
   l('inv-move-net','Physical usable count — sensitivity only',a.physicalInventory,'inventory',refs.inventory,a.physicalCountAlternative.condition),
   l('inv-alt-use','Alternative materials consumed — sensitivity only',a.physicalCountAlternative.materialsUsed,'inventory',refs.inventory,'Derived from the physical count; not used in the primary statements.'),
   l('inv-gap','Unresolved warehouse-record conflict',a.inventoryDifference,'inventory',refs.inventory,'Disclosed once; no further expense or balancing adjustment.',true),
   l('direct-event','Direct event payroll in cost of sales',a.directPayroll,'payroll',refs.payroll),
   l('cogs-total','Total adopted cost of sales',a.costOfSales,'inventory',refs.inventory,'Recorded materials consumed + direct event payroll + stock write-off.',true),
   l('disposal-quote','Future disposal quote',facts.disposalQuote,'inventory',refs.inventory,'No provision: present obligation not established.')
  ],formula:`${num(facts.openingInventory)} + ${num(a.purchases)} − ${num(a.materialsUsed)} − ${num(facts.damagedStock)} = ${num(a.inventory)}. Physical usable count ${num(a.physicalInventory)} − primary closing inventory ${num(a.inventory)} = unresolved ${num(a.inventoryDifference)}.`},
  {id:'purchases',title:'Purchases & payables',status:'QUALIFIED',description:'All goods-received stamps precede 31 August. Closing AP independently confirmed. Opening AP is inferred, conditional on these flows being complete.',rows:a.supplierRows.flatMap(s=>[l(s.payment+'-opening',s.name+' — inferred opening AP',s.inferredOpening,'purchases',refs.purchases,'INFERRED, not directly confirmed.'),l(s.payment+'-received',s.name+' — purchases',s.received,'purchases',refs.purchases),l(s.payment+'-paid',s.name+' — paid',-s.paid,'purchases',refs.bank),l(s.payment+'-closing',s.name+' — confirmed closing AP',s.payable,'purchases',refs.purchases)]),formula:`Inferred opening AP ${num(a.inferredOpeningAP)} + purchases ${num(a.purchases)} − payments ${num(a.supplierPayments)} = closing AP ${num(a.ap)}.`},
  {id:'payroll',title:'Payroll',status:'QUALIFIED',description:'Expense classification follows employee function. Monthly allocation is not supported by the available evidence. Opening accrual is not assigned to departments without evidence.',rows:[...payroll.flatMap(p=>[l('pay-'+p.row,p.name+' — incurred',p.expense,'payroll',[ref('E11',`Payroll!A${p.row}:E${p.row}`)]),l('cash-'+p.row,p.name+' — cash',p.paid,'payroll',refs.payroll)]),l('pay-open','Opening accrual',facts.openingPayroll,'payroll',refs.payroll),l('pay-close','Closing accrual',a.payrollClosing,'payroll',refs.payroll,'',true),l('owner-excluded','Founder “bonus” excluded from employee payroll',a.distributions,'equity',refs.owner,'Same villa / card spending; never add to payroll cash.')],formula:`${num(facts.openingPayroll)} + ${num(a.payrollExpense)} − ${num(a.payrollCash)} = ${num(a.payrollClosing)}.`},
  {id:'expenses',title:'Operating expenses & estimates',status:'QUALIFIED',description:'Identified cash outlays are provisionally used for period expenses. Insurance has no supported amount recognised; zero recognised is not evidence of zero actual expense.',rows:[...a.operating.map(o=>l(o.id,o.id,o.cash,'expenses',refs.expenses)),l('legal-best','Selected legal estimate',a.basis.legal,'expenses',refs.legal,'Counsel best estimate; no cash paid.'),l('insurance','Insurance — recognised amount',adoptedBasis.insuranceRecognised,'expenses',refs.missing,adoptedBasis.insurancePolicy),l('insurance-exposure','Actual insurance expense / prepayment','UNKNOWN','expenses',refs.missing,'Unquantified exposure, excluded from adopted totals.'),l('other-accruals','Other accrued / prepaid exposures','UNKNOWN','expenses',refs.missing,'Unquantified; not established as zero.')],formula:`Rent + marketing + software + utilities + repairs = ${num(a.operatingCashCosts)}. Owner distributions excluded.`},
  {id:'ppe',title:'PPE & depreciation',status:'QUALIFIED',description:adoptedBasis.provenance,rows:[
   l('ppe-open-cost','Opening gross PPE — adopted',a.openingGrossPPE,'ppe',refs.missing,'Adopted assumption not independently verified from the available original evidence; original asset workbook missing.'),
   l('machine','A-910 packaging machine',facts.packagingMachine,'ppe',refs.ppe,'Installed 10 May; original invoice supports this addition.'),
   l('booth','P-404 photo booth',facts.photoBooth,'ppe',refs.ppe,'Available for use 10 May.'),
   l('ppe-add','Capital additions',a.capex,'ppe',refs.ppe,'',true),
   l('ppe-close-cost','Closing gross PPE',a.closingGrossPPE,'ppe',refs.ppe,'Opening assumption + evidenced additions.',true),
   l('ppe-open-ad','Opening accumulated depreciation — adopted',a.openingAccumulatedDepreciation,'ppe',refs.missing,'Adopted assumption not independently verified from the available original evidence.'),
   l('dep','Period depreciation — adopted',a.depreciation,'ppe',refs.missing,'Adopted estimate not independently verified from the available original evidence; useful lives remain unconfirmed.'),
   l('ppe-close-ad','Closing accumulated depreciation',a.closingAccumulatedDepreciation,'ppe',refs.missing,'Opening accumulated depreciation + adopted period charge.',true),
   l('ppe-close','Closing net PPE — adopted',a.netPPE,'ppe',refs.ppe,'Closing gross PPE less accumulated depreciation.',true),
   l('repair','R-771 restoration — expense',a.operating.find(o=>o.id==='REPAIR')!.cash,'expenses',refs.ppe,'Excluded from additions; restored normal output.')
  ],formula:`Gross: ${num(a.openingGrossPPE)} + ${num(facts.packagingMachine)} + ${num(facts.photoBooth)} = ${num(a.closingGrossPPE)}. Accumulated depreciation: ${num(a.openingAccumulatedDepreciation)} + ${num(a.depreciation)} = ${num(a.closingAccumulatedDepreciation)}. Net: ${num(a.netPPE)}.`},
  {id:'debt',title:'Debt & interest',status:'QUALIFIED',description:'Principal and closing interest payable externally confirmed. Maturity and security terms have not been supplied.',rows:[l('loan-open','Opening confirmed principal',facts.openingLoan,'debt',refs.debt),l('loan-in','New borrowing',a.borrowing,'debt',refs.debt),l('loan-out','Principal repaid',-a.principalRepaid,'debt',refs.bank),l('loan-close','Closing principal',a.debtClosing,'debt',refs.debt,'',true),l('interest-open','Inferred opening interest payable',a.inferredOpeningInterest,'debt',refs.debt,'Inferred from full-period expense, cash and confirmed closing accrual.'),l('interest-expense','Interest incurred',facts.interestExpense,'debt',refs.debt),l('interest-paid','Interest paid',-a.interestPaid,'debt',refs.bank),l('interest-close','Confirmed interest payable',facts.confirmedInterestPayable,'debt',refs.debt)],formula:`Principal ${num(facts.openingLoan)} + ${num(a.borrowing)} − ${num(a.principalRepaid)} = ${num(a.debtClosing)}. Interest ${num(a.inferredOpeningInterest)} + ${num(facts.interestExpense)} − ${num(a.interestPaid)} = ${num(facts.confirmedInterestPayable)}.`},
  {id:'equity',title:'Equity & distributions',status:'QUALIFIED',description:'Opening equity follows the adopted reference-based reconstruction, pending original opening records. Closing equity follows this roll-forward and is not independently verified. No unsupported additional capital movement is recognised.',rows:[l('eq-open','Opening equity — adopted',a.openingEquity,'equity',refs.missing,'Unverified opening reconstruction assumption.'),l('eq-result','Corrected profit — provisional',a.knownResult,'equity',refs.missing,'Adopted accounting basis.'),l('villa','Villa distribution',-bank.find(b=>b.reference==='VILLA')!.debit,'equity',refs.owner,'2024 photograph dates conflict with 2026 bank payment.'),l('card','Other owner-card distribution',-bank.find(b=>b.reference==='OWNERCARD')!.debit,'equity',refs.owner),l('eq-close','Closing equity — adopted',a.closingEquity,'equity',refs.missing,'Opening + profit − distributions.',true)],formula:`${num(a.openingEquity)} + ${num(a.knownResult)} − ${num(a.distributions)} = ${num(a.closingEquity)}. Original opening capital records remain required.`},
 ];
}
