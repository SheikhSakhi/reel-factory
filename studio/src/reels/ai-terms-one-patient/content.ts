// Fictional, illustrative content shown on screen. No real patients.

export const RECORD_CARDS = [
  { dx: "COPD exacerbation", labs: "Na 134 · Cr 1.3", hx: "heart failure", outcome: "returned", returned: true },
  { dx: "Pneumonia", labs: "WBC 14.2 · CRP 88", hx: "type 2 diabetes", outcome: "did not return", returned: false },
  { dx: "Heart failure", labs: "BNP 980 · K 4.9", hx: "CKD stage 3", outcome: "returned", returned: true },
] as const;

/** Documented information the draft is generated from. */
export const SOURCES = [
  { key: "ADMISSION", text: "shortness of breath" },
  { key: "TREATMENT", text: "IV antibiotics → oral, day 3" },
  { key: "OBSERVATIONS", text: "SpO₂ 96% on room air" },
  { key: "MEDICATION", text: "oral antibiotics, 5 days" },
  { key: "FOLLOW-UP", text: "GP review in 1 week" },
] as const;

export const INSTRUCTION = "Draft a discharge summary for the GP." as const;

/** Generated draft sentences and the sources each one is supported by (none = not in record). */
export const DRAFT = [
  { text: "Admitted with shortness of breath; treated with IV antibiotics, switched to oral on day 3.", src: [0, 1] },
  { text: "Oxygen saturation 96% on room air at discharge.", src: [2] },
  { text: "Complete 5 days of oral antibiotics; GP review in 1 week.", src: [3, 4] },
  { text: "No further chest imaging needed.", src: [] },
] as const;
