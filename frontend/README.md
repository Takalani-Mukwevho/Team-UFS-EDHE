# AbsaFlow — SME Invoice Financing Platform (React + Tailwind)

Converted from the Stitch mockup into a real React app. All 5 pipeline screens are wired
together with shared state so the "judge demo" scenario switcher on screen 1, the
OCR edit/highlight interactions on screen 2, the drawdown slider on screen 4, and the
toast alerts on screen 5 all actually work.

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## What's inside

```
src/
  App.jsx                 — layout shell + tab-based navigation between the 5 screens
  components/
    Sidebar.jsx            — fixed left nav rail
    Header.jsx              — fixed top bar / breadcrumb
  pages/
    UploadIngestion.jsx      — Screen 1: upload + judge quick-scenarios (A/B/C)
    OcrExtractionReview.jsx  — Screen 2: document viewer + editable extracted fields
    BuyerRiskEngine.jsx      — Screen 3: 3-pillar underwriting breakdown
    InstantFundingOffer.jsx  — Screen 4: interactive advance slider + disbursement
    RiskExceptions.jsx       — Screen 5: duplicate-fraud + restricted-financing alerts
  data/
    scenarios.js             — shared mock data + currency formatter
  index.css                  — Tailwind directives + font imports
tailwind.config.js            — the AbsaFlow design tokens (colors, spacing, type scale)
```

## Notes

- **Icons**: the design uses Google's Material Symbols Outlined font
  (`<span className="material-symbols-outlined">icon_name</span>`). The font is linked in
  `index.html`. If you'd rather use `lucide-react` or another icon set already in your app,
  swap those spans out — every icon name used (e.g. `upload_file`, `verified`, `bolt`) maps
  1:1 to a Material Symbols glyph name, so you can look each one up at
  https://fonts.google.com/icons.
- **Navigation** is simple `useState` tab-switching in `App.jsx`, not `react-router`. If your
  app already uses a router, swap `activeTab` for route params and `goTo()` for `navigate()`.
- **Fonts**: Hanken Grotesk (UI text) and JetBrains Mono (currency/data cells) are imported
  in `src/index.css`. Self-host them if you'd rather not depend on Google Fonts at runtime.
- All monetary figures are demo/mock data (`src/data/scenarios.js`) — wire up your real API
  calls where the `onContinue` handlers currently just switch tabs.
- Drop `tailwind.config.js`'s `theme.extend` into an existing Tailwind config instead of
  replacing the whole file if this is going into a project that already has Tailwind set up.
