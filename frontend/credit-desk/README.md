# AbsaFlow Credit Desk

The bank-side console for the AbsaFlow invoice-financing prototype.
EDHE x Absa Hackathon, Track 1: Access to Finance.

The SME-facing app (upload an invoice, receive an offer) is a separate front end.
This one is what the bank's invoice finance desk sees: submissions arrive, an
analyst reviews them, and a funding decision is recorded.

## Run it

```bash
npm install
npm run dev      # http://localhost:5174
npm test         # 6 passing
```

## The screen

- **Metric strip** — awaiting decision, advanced this session, live exposure, overrides on record.
- **Queue** — three tabs: awaiting, blocked at verification, decided. Each row carries the SME,
  buyer, amount and the engine's risk band.
- **Case detail** — extracted fields with per-field confidence (anything under 92% is flagged
  for the analyst to check against the document), verification checks, buyer settlement history,
  the weighted risk breakdown, and the engine's recommendation.
- **Decision** — accept the recommendation, override the advance rate, or decline. Any departure
  from the engine requires a written reason of at least 25 characters.
- **Audit trail** — every decision, what the engine said, what the analyst did, and why.

## The demo path

| Case | Buyer | Score | Engine says |
|---|---|---|---|
| INV-1042, ABC Construction | XYZ Corporation, 96% on-time | 96.3 Low | Approve at 80%, R145,040 net |
| INV-2087, ABC Construction | ABC Holdings, 64% on-time | 62.3 High | Decline |
| INV-8890, Thandi Textiles | Nkosi Retail Group, 86% on-time | 78.9 Medium | Approve at 60% (KYB pending costs it a band) |
| INV-1042 resubmitted | XYZ Corporation | not scored | Blocked as a duplicate |

The strongest thing to show a judge: open INV-2087, choose **Override the advance rate**, drop it
to 40%, write a reason, confirm. The decision lands in the audit trail marked as an override with
the reason attached. That is the governance answer.

Second strongest: open the blocked duplicate. It is a copy of INV-1042, so it would score 86.3 and
land in the Low band on its own merits. Verification stops it anyway. A good score is not a licence
to fund the same debt twice, and `scoring.test.js` asserts exactly that.

## Layout

```
src/
  engine/
    policy.js       WEIGHTS, BANDS, POLICY - shared with the SME app
    scoring.js      scoreCase() and offerFor() - pure, port these to C#
    format.js       currency and pill helpers
    scoring.test.js vitest suite over the whole queue
  data/
    buyers.js       six fictional buyers with settlement histories
    cases.js        the submission queue, seed audit entries, analyst identity
  components/       one per section of the case view
  App.jsx           queue state, selection, decision handling
  styles.css        tokens for light and dark, then components
```

## Keeping both front ends consistent

`src/engine/policy.js` is duplicated between this app and the SME app on purpose - the two are
separate front ends over the same API. If you change a weight or a band here, change it there too,
or move both to a shared package before the demo. The numbers the judge sees on one screen must
match the other.

## Wiring up the real backend

```
GET   /api/cases?status=awaiting     the queue
GET   /api/cases/{id}                extracted fields, checks, risk breakdown
POST  /api/cases/{id}/decision       { outcome, advancePercent, reason }
GET   /api/buyers/{name}             profile and settlement history
GET   /api/audit                     decision log
```

Vite proxies `/api` to `http://localhost:5000` in dev.
