# Primary Sources: Historical Engine

**Primary Sources** is a subject-agnostic chronological engine designed to transform raw historical data and physical artifacts into a structured, relational network of metadata. It moves beyond simple "search" by enabling forensic research, immersive simulations, and narrative-driven exploration of historical events.

---

## 🏛️ Project Vision
While currently seeded with data from the **1963 Yates / JFK investigation**, the underlying architecture is built to reconstruct *any* historical era, cold case, or cultural movement by mapping the relationship between:
- **Events**: What happened and when? (Chronology)
- **People**: Who was involved and in what role? (Actors)
- **Places**: Where did it occur? (Spatial Metadata)
- **Sources**: Where is the evidence? (Provenance)
- **Assertions**: What claims are made by specific sources? (Contradiction/Support)

---

## 🚀 Getting Started

### 1. Main Archive UI
The primary discovery portal for researchers to browse the structured database.
- **Path**: `docs/ui/index.html`
- **Command**: `python -m http.server 8000 --directory docs/ui/`
- **URL**: [http://localhost:8000](http://localhost:8000)

### 2. OCR Analytical Tool
A specialized utility for batch processing and transcribing PDF documents into searchable text layers.
- **Path**: `docs/ui/ocr/index.html`
- **Command**: `python tools/ocr-server.py`
- **URL**: [http://localhost:5000](http://localhost:5000)
- **Dependencies**: Requires Tesseract OCR installed on the system (and optionally `ocrmypdf` in WSL for high-quality backend).

---

## 📂 Project Structure

- `docs/ui/`: The responsive frontend built with HTML, Tailwind CSS, and vanilla JS.
- `tools/`: Python-based backend services and data transformation scripts.
- `supabase/`: Database schema definitions and migration configurations.
- `raw-material/`: Unprocessed historical artifacts (PDFs, Images).
- `processed/`: Output directory for OCR and data cleaning results.

---

## 🗺️ Roadmap
The project is currently in **Phase 1: Utility & Core Structure**. Our long-term mission includes 21 signature features such as:
- **Conflict Heatmaps**: Visualizing where witness testimonies disagree.
- **3D Print Replicas**: Physical manifestations of historical evidence.
- **Radio-to-Visual AI**: Reconstructing events from audio/text archives.
- **Inflation Converters**: Real-time historical-to-modern value mapping.

*See [roadmap.md](roadmap.md) for the full detailed vision.*

---

## 🛠️ Technical Stack
- **Database**: Supabase / PostgreSQL (4NF Relational Architecture)
- **Backend**: Python (Flask, Tesseract, pypdf)
- **Frontend**: Vanilla JS, Tailwind CSS, Google Fonts (Oswald, Roboto Mono)
- **Icons**: Material Symbols Outlined

---
*Created with care by the Primary Sources project team.*
