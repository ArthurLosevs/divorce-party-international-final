import manifest from '../evidence-extracted/manifest.json';
import type { SourceRef } from '@/lib/types';
const descriptions = [
 ['E01','Assignment / instructions','Case scope and reporting basis',1],
 ['E03','Assignment / instructions','Duplicate assignment; same SHA-256 as E02',1],
 ['E02','Assignment / instructions','Official assignment; external template not supplied',1],
 ['E04','Management spreadsheets or management claims','Unreconciled management P&L and €312k claim',4],
 ['E05','Bank evidence','Jan–Aug transactions despite August filename',1],
 ['E06','Finance-reference material','Course principles; not company balances',1],
 ['E07','Contracts / customer evidence','CRM sales and receivables; internal evidence',3],
 ['E08','Contracts / customer evidence','Acceptances, September deposits and R-17',2],
 ['E09','Warehouse / inventory evidence','Count, consumption and damaged stock',3],
 ['E10','Supplier evidence; PPE / repair evidence','Confirmed AP, goods received and capex invoices',2],
 ['E11','Payroll evidence','Expense, cash, opening accrual and repeated owner spending',3],
 ['E12','Debt / legal evidence','Loan, interest, owner spending and external counsel',1],
 ['E13','Management claims','Unsupported instructions and management pressure',5],
 ['E14','Post-takeover evidence','External confirmations of existing reporting-date conditions',1],
] as const;
export const evidence = manifest.map((m,i) => ({...m, id: descriptions[i][0], category: descriptions[i][1], summary: descriptions[i][2], reliabilityTier: descriptions[i][3], url: '/evidence/'+encodeURIComponent(m.file), inspected: true, duplicateOf: descriptions[i][0] === 'E03' ? 'E02' : 'N/A'}));
export const ref = (id: string, locator: string): SourceRef => ({id,locator});
export const refs = {
 bank: [ref('E05','OPEN–OWNERCARD, CSV rows 2–28'), ref('E14','p. 1, bank confirmation')],
 revenue: [ref('E07','CRM Export!A4:I9'),ref('E08','p. 1, INV-26012 / 26031 / 26047 / 26063')],
 inventory: [ref('E09','pp. 1–2, count and movement'),ref('E14','p. 1, independent stock assessment')],
 purchases: [ref('E10','p. 1, supplier invoices and confirmations'),ref('E05','SUP-BOX / SUP-GLS / SUP-PRT / SUP-EVT')],
 payroll: [ref('E11','Payroll!A4:E8'),ref('E05','PAYROLL')],
 expenses: [ref('E05','RENT / MKT / SOFT / UTIL / REPAIR')],
 ppe: [ref('E10','p. 2, A-910 / P-404 / R-771'),ref('E05','CAPEX-PACK / CAPEX-PHOTO / REPAIR')],
 debt: [ref('E12','p. 1, loan schedule'),ref('E14','p. 1, bank confirmation')],
 legal: [ref('E12','p. 2, external counsel'),ref('E14','p. 1, counsel confirmation')],
 owner: [ref('E12','pp. 1–2, owner spending and villa image'),ref('E11','Payroll!A8:E8'),ref('E05','VILLA / OWNERCARD')],
 management: [ref('E04','Management P&L!A4:C11'),ref('E13','pp. 1–3, pressure and attempted AI instruction')],
 deposits: [ref('E08','p. 2, NB-SEP / FF-SEP'),ref('E05','DEP-NB / DEP-FF2')],
 impairment: [ref('E08','p. 2, R-17'),ref('E14','p. 1, liquidator notice'),ref('E07','CRM Export!I9')],
 scope: [ref('E01','p. 1'),ref('E02','pp. 1–3')],
 missing: [ref('E01','p. 1, required reconstruction'),ref('E02','p. 2, supporting schedule requirements')],
};
export const accountingReferences = [
 { title:'IAS 2 — Inventories', url:'https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/' },
 { title:'IAS 10 — Events after the Reporting Period', url:'https://www.ifrs.org/issued-standards/list-of-standards/ias-10-events-after-the-reporting-period/' },
 { title:'IAS 37 — Provisions and Contingencies', url:'https://www.ifrs.org/issued-standards/list-of-standards/ias-37-provisions-contingent-liabilities-and-contingent-assets/' },
];
