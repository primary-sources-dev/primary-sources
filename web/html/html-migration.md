# HTML Prototype: Domain-Driven Master Restructuring Plan

**Status**: � APPROVED & READY FOR EXECUTION
**Objective**: Finalize the "Forensic Archive" UI architecture by consolidating all views into a nested, domain-oriented directory structure and moving the functional code to the `web/html/` root.

---

## 🏛 The Vision: Multi-Stack Repository

This plan isolates the **HTML Prototype** into a dedicated technology root (`web/html/`), prepares the repository for a future **Next.js Stack** (`web/next/`), and reclaims the `docs/` folder for technical specifications and standards.

### 🔳 The Final Structure Tree
```text
primary-sources/
├── archived/              <-- GLOBAL LEGACY (Root level isolation)
├── web/
│   ├── html/              <-- HTML PROTOTYPE ROOT
│   │   ├── index.html     (Main Hub)
│   │   ├── entities/      (6 Domain Modules: Person, Event, Place, Org, Object, Source)
│   │   ├── tools/         (Research Toolbox)
│   │   │   ├── tools-index.html (Launcher Hub)
│   │   │   ├── ocr/       (UI + Specs)
│   │   │   ├── classifier/ (UI + Specs)
│   │   │   ├── [others]/  (Specs only)
│   │   ├── exploration/   (Discovery tools: Atlas, OTD)
│   │   ├── pages/         (Static info/blog)
│   │   ├── assets/        (CSS/JS/JSON)
│   │   └── components/    (Header/Nav)
│   └── next/              (Future production app)
├── docs/                  <-- TECHNICAL SPECS ONLY
├── supabase/
├── tools/                 <-- PYTHON TERMINAL TOOLS ONLY
└── data/
```

---

## 📂 Physical Transformation Map

### 1. Entity Domains (Consolidating Browse + Profiles)
All entities follow the **[entity]-index.html** (List) and **[entity]-details.html** (Profile) convention.

| Hub | New Directory | New Index Page | New Details Page |
| :--- | :--- | :--- | :--- |
| **People** | `entities/person/` | `person-index.html` | `person-details.html` |
| **Events** | `entities/event/` | `event-index.html` | `event-details.html` |
| **Places** | `entities/place/` | `place-index.html` | `place-details.html` |
| **Objects** | `entities/object/` | `object-index.html` | `object-details.html` |
| **Orgs** | `entities/organization/` | `org-index.html` | `org-details.html` |
| **Sources** | `entities/source/` | `source-index.html` | `source-details.html` |

### 2. Research Toolbox (UI vs. Specs)
All tools reside in category folders. Only **OCR** and **Classifier** have active `.html` UIs; others are specs.

| Tool | Category Folder | Index/Details File | Active UI File |
| :--- | :--- | :--- | :--- |
| **All Tools** | `tools/` | `tools-index.html` | - |
| **OCR** | `tools/ocr/` | `ocr-details.html` | `ocr-ui.html` |
| **Classifier**| `tools/classifier/`| `classifier-details.html`| `classifier-ui.html` |
| **Citation** | `tools/citation/` | `citation-details.html` | - |
| **Matching** | `tools/matcher/` | `matcher-details.html` | - |
| **Analysis** | `tools/analyzer/` | `analyzer-details.html` | - |
| **Research** | `tools/research/` | `research-details.html` | - |

### 3. Special Folders
- **Exploration**: `features/` ➔ `exploration/` (Witness Atlas, OTD, Random Entry).
- **Archive**: `docs/ui/archived/` ➔ `primary-sources/archived/`.

---

## 🛠 Execution Phases

### Phase 1: The Great Shift (Physical Moves)
1. Initialize the root-level `archived/` directory.
2. Initialize the `web/html/` technology hub.
3. Perform the bulk move from `docs/ui/` ➔ `web/html/`.
4. Implement the domain-nested structure within `entities/` and `tools/`.

### Phase 2: Path & Link Healing
1. **Automated Refactor**: Global search/replace changing `/docs/ui/` ➔ `/web/html/`.
2. **Entity Logic Update**: Update `db-logic.js` and components to use the new nested routing names.

### Phase 3: Cleanup
1. Verify all relative assets (images, CSS) resolve correctly.
2. Update the main `README.md` to reflect the new structure.

---
*Verified for the Primary Sources Technical Foundation.*
