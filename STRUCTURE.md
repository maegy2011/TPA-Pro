# TPA Pro — Structure

```
TPA/
├── index.html              # Entry: links CSS + loads JS in dependency order
├── STRUCTURE.md
├── css/
│   ├── fonts.css           # Tajawal (local woff2)
│   ├── variables.css       # :root CSS variables + base reset
│   ├── screens.css         # splash / loading / lock
│   ├── layout.css          # shell / sidebar / topbar
│   ├── components.css      # buttons / inputs / cards / KPI
│   ├── tables-1.css, tables-2.css
│   └── modals-1..3.css
├── js/
│   ├── shell-*.js          # HTML shell fragments (splash/loading/lock/app/modals)
│   ├── shell-loader.js     # Injects shell into #root
│   ├── html-page-*.js      # Per-page HTML templates (PAGE_*)
│   ├── html-modal-*.js     # Per-modal HTML templates (MODAL_*)
│   ├── utils*.js           # General helpers, dates, numbers, Arabic, DOM
│   ├── constants.js        # App constants & settings
│   ├── data-*.js           # Models, seed data, claims
│   ├── entities.js         # Entity helpers
│   ├── storage.js          # Persistence layer
│   ├── engine-*.js         # Field extraction, rules engine
│   ├── compute-patient.js  # Core computePatient
│   ├── dialog.js           # Unified dialog
│   ├── navigation.js       # Screen navigation
│   ├── pages-build.js      # buildPages()
│   ├── modals-build.js     # buildModals()
│   ├── export.js           # Excel/PDF/Print export
│   ├── render*.js          # Rendering functions
│   ├── review-*.js         # Review modal logic
│   ├── editors.js, item-editor.js
│   ├── claims-view*.js
│   ├── intake*.js
│   ├── providers*.js       # providers/contracts/tariffs
│   ├── trash.js, deduction-rules.js, rule-wizard*.js
│   ├── sessions*.js, backup*.js
│   ├── auth-settings.js, notifications.js
│   ├── app.js              # initApp, renderAll
│   └── init.js             # Loading + bootstrap
└── assets/fonts/           # Tajawal woff2 (10 files)
```

All files ≤ 150 lines. No external dependencies (fully offline).
Load order is defined in index.html (82 script tags).
