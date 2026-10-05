import bankData from './bank.json';
export const bank = bankData;
// Transcribed case facts. These are EUR, not cents. Locators travel with the schedules.
export const customers = [
 {name:'NorthStar Events', invoice:'INV-26012', revenue:180000, receipt:'RCPT-NS', date:'2026-02-12', source:'E08 p. 1 / E07 row 4', confidence:'High'},
 {name:'Freedom Festivals', invoice:'INV-26031', revenue:200000, receipt:'RCPT-FF', date:'2026-03-18', source:'E08 p. 1 / E07 row 5', confidence:'High'},
 {name:'Phoenix HR', invoice:'INV-26047', revenue:100000, receipt:'RCPT-PHX', date:'2026-04-29', source:'E08 p. 1 / E07 row 6', confidence:'High'},
 {name:'Liberty Hotels', invoice:'INV-26063', revenue:120000, receipt:'RCPT-LIB', date:'2026-06-20', source:'E08 p. 1 / E07 row 7', confidence:'High'},
 {name:'Web — Finally Single', invoice:'WEB-FSB', revenue:270000, receipt:'PLAT-FSB', date:'Jan–Aug aggregate', source:'E07 row 8', confidence:'Medium'},
 {name:'Web — Never Call Back', invoice:'WEB-NCB', revenue:90000, receipt:'PLAT-NCB', date:'Jan–Aug aggregate', source:'E07 row 9', confidence:'Medium'},
];
export const suppliers = [
 {name:'BoxWorks', received:130000, payable:25000, payment:'SUP-BOX'},
 {name:'Glass & Drama', received:120000, payable:28000, payment:'SUP-GLS'},
 {name:'Print Again', received:95000, payable:14000, payment:'SUP-PRT'},
 {name:'Event Things Europe', received:114000, payable:59000, payment:'SUP-EVT'},
];
export const payroll = [
 {name:'Direct event/service staff', expense:80000, paid:75000, row:4},
 {name:'Sales and partnerships', expense:72000, paid:68000, row:5},
 {name:'Office and finance', expense:96000, paid:88000, row:6},
];
export const facts = {
 openingInventory:80000, materialsConsumed:405000, physicalGoodFSB:79000, physicalGoodNCB:42000, damagedStock:22000, disposalQuote:2000,
 openingPayroll:15000, badDebt:18000, packagingMachine:60000, photoBooth:20000,
 openingLoan:100000, interestExpense:12000, confirmedCash:60000, confirmedLoan:131000, confirmedInterestPayable:2000,
 legalLow:20000, legalBest:25000, legalHigh:30000, managementProfit:312000, managementSales:1050000, managementBankIncome:50000,
 managementMaterialsWages:620000, managementOpex:168000, managementCash:186000, managementInventory:143000, managementAR:186000,
};
