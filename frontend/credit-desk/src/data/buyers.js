// Fictional buyer settlement data. In production: GET /api/buyers/{name}
export const BUYERS = {
  "XYZ Corporation":          { historicalInvoices: 142, onTimeRate: 0.96, avgSettlementDays: 28, sector: "Property development",
    recent: [24,31,26,29,22,35,27,30,25,28,64,26] },
  "Highveld Mining Supplies": { historicalInvoices: 87,  onTimeRate: 0.91, avgSettlementDays: 34, sector: "Mining services",
    recent: [30,38,33,29,41,36,31,35,62,34,32,37] },
  "Nkosi Retail Group":       { historicalInvoices: 61,  onTimeRate: 0.86, avgSettlementDays: 41, sector: "Retail",
    recent: [38,45,52,36,44,61,40,39,47,66,42,43] },
  "Meridian Foods":           { historicalInvoices: 54,  onTimeRate: 0.79, avgSettlementDays: 52, sector: "Food manufacturing",
    recent: [48,57,63,45,71,52,49,58,44,68,55,50] },
  "Cape Union Freight":       { historicalInvoices: 43,  onTimeRate: 0.71, avgSettlementDays: 58, sector: "Logistics",
    recent: [55,72,49,64,81,57,60,53,77,62,58,66] },
  "ABC Holdings":             { historicalInvoices: 38,  onTimeRate: 0.64, avgSettlementDays: 71, sector: "Civil construction",
    recent: [68,84,59,92,73,66,101,70,58,88,76,79] },
};
