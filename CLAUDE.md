# Team-UFS-EDHE — AbsaFlow

EDHE x Absa Hackathon, Track 1: Access to Finance — Invoice to Cash.

**AbsaFlow** is an invoice financing product. An SME that has completed work and is
waiting 60 days for a large buyer to pay uploads the invoice; AbsaFlow verifies it,
scores how safe it is to advance against, and releases most of the value immediately.
The bank collects from the buyer on the due date.

```
Invoice value      R185,000
Advance @ 80%      R148,000
Fee @ 2%         -   R2,960
Net cash today     R145,040    (instead of waiting until 31 Oct)
```

The product is the **risk decision**, not the OCR. The question everything serves is:
*how safe is it to advance money against this specific invoice?* Never call the output
a generic SME credit score.

---

## Repo layout

```
frontend/
  credit-desk/     bank-side underwriting console   (built — see its CLAUDE.md)
  sme-app/         SME upload and offer flow        (teammate's, may not exist yet)
backend/           ASP.NET Core API                 (not started)
```

**Each subproject has its own CLAUDE.md.** Before working in one, read that file —
`frontend/credit-desk/CLAUDE.md` carries the risk engine numbers, the demo cases and
the rules about what not to change.

## Running anything

There is no `package.json` at the repo root. Commands run inside a subproject:

```bash
cd frontend/credit-desk
npm install
npm run dev      # http://localhost:5174
npm test
```

## The one cross-cutting rule

`frontend/credit-desk/src/engine/policy.js` holds the risk weights, band thresholds
and advance rates. The SME app has its own copy on purpose — two front ends over the
same API. **If you change a value in one, change it in the other**, or the two screens
will quote different numbers to the judges.

```js
WEIGHTS = { buyer: 0.55, settlement: 0.20, sme: 0.15, invoice: 0.10 }
BANDS   = { low: 80, medium: 65 }
POLICY  = { Low: 0.80, Medium: 0.60, High: 0, feeRate: 0.02, maxOverride: 0.85 }
```

## Scope

24-hour build. Do not build a full lending platform, real corporate integrations, a
trained ML model, an accounting product, or real-time settlement. Make
`upload → extraction → verification → risk → funding offer` flawless instead.

All demo data is fictional. All pricing and risk values are illustrative and the UI
says so; that disclaimer stays.
