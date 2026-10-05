// Adopted PPE/equity values retained in both supplied analyses.
// They are not represented as verified facts from the original company documents.
export const adoptedBasis = {
  openingGrossPPE: 180000,
  openingAccumulatedDepreciation: 45000,
  periodDepreciation: 24000,
  openingEquity: 170000,
  insuranceRecognised: 0,
  insuranceActualAmount: 'UNKNOWN' as const,
  provenance: 'Both supplied independent analyses retain these PPE and equity values. Original evidence available in this project verifies additions of €60,000 and €20,000, but the asset workbook cited by both agents is absent, preventing independent verification here of opening PPE, accumulated depreciation and period depreciation. Opening equity remains an inferred reconstruction assumption.',
  inventoryPolicy: 'Use original recorded materials consumed and the inventory roll-forward for the primary baseline. Disclose the physical recoverable count and its unresolved difference as a conditional sensitivity only. Adopt that alternative only if additional reconciliation evidence substantiates the difference; no unexplained balancing entry is recognised.',
  insurancePolicy: 'No supported amount recognised. Reliable opening prepaid-insurance, premium and coverage evidence are unavailable. The actual expense and prepaid balance remain unknown; the adopted zero is not a proven factual zero.',
};
