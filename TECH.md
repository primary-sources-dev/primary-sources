# Tech Stack & Entity-Driven Architecture

This document explains the technology powering **Primary Sources** and how our **Entity-Driven** approach enables the advanced goals outlined in our [Roadmap](./roadmap.md).

---

## 1. The Core Philosophy: Everything is an Entity
Unlike traditional databases that store static text, our system treats history as a **Knowledge Graph**. Every person, place, object, and event is a unique "Entity" with its own ID.

### How it works now:
- **4NF Normalization**: We use a highly organized database structure (Fourth Normal Form). This means we don't repeat data. If a person has five different aliases, we store the person once and link the aliases to them.
- **The Assertion Model**: We don't store "facts." We store **Assertions** (Claims) made by **Sources**. 
  - *Logic:* [Source A] says [Entity 1] was at [Location B] on [Date].
  - This allows us to handle **conflicting evidence** without the system breaking.

---

## 2. Our Current Tech Stack
We use a "Lightweight but Powerful" stack designed for high-speed research and archival integrity.

- **Database**: PostgreSQL (via Supabase) — Handles the complex relationships between entities.
- **Frontend**: HTML5/CSS3/JavaScript — A clean, dark-themed "Archive" interface that works in any browser.
- **OCR Engine**: Tesseract & OCRmyPDF — Converts scanned "pictures of paper" into searchable text.
- **Document Viewer**: PDF.js — A custom in-browser viewer that allows us to deep-link to specific pages of evidence.

---

## 3. The "Entity-Driven" Future
To reach the goals in our roadmap (like AI simulations and network maps), we are evolving our tech in three key areas:

### A. Intelligent Extraction (The "Extraction Assistant")
Currently, a human has to read a document and type in names. 
- **How it will work**: The tool will use **Named Entity Recognition (NER)** to scan OCR text. It will "highlight" names it recognizes from our database and suggest new ones. 
- **Goal Impact**: Speeds up data entry by 10x, enabling the **Digital Vault (14)**.

### B. Spatial & Temporal Intelligence
By tagging every entity with **Coordinates (Lat/Lon)** and **Timestamps**.
- **How it will work**: We map the "movement" of entities over time. 
- **Goal Impact**: Enables **AR Spatial Overlays (12)** where you can stand on a street corner and see historical entities projected in their exact historical positions via your phone.

### C. Predictive Analysis & Simulations
Because we use the **Assertion Model**, we can feed our data into AI models.
- **How it will work**: AI reads 1,000 assertions about an event. It identifies where the "Network" is strongest and where the "Conflict" is highest.
- **Goal Impact**: Powers the **Conflict Heatmap (02)** and **Witness POV Video (11)** by generating visual recreations based on the most supported assertions.

---

## 4. Why This Tech Scales
Our tech is **Subject-Agnostic**. While we are starting with the JFK/Yates data, the "Entity-Driven" logic works for:
1. **True Crime**: Reconstructing cold cases from police logs.
2. **Sports**: Recreating historical games (The game is the `Event`, the players are `Entities`, the box score is the `Assertion`).
3. **Journalism**: Tracking complex corporate or political networks.

---

## 5. Implementation Summary
| Goal | Technology Needed |
| :--- | :--- |
| **Search & Browse** | Current JS/JSON Engine |
| **Deep Research** | PostgreSQL + Assertion Triggers |
| **Automation** | Python + SpaCy (AI Entity Extraction) |
| **Immersion** | Unity/Three.js + Coordinate Mapping |

**Primary Sources** isn't just a website—it's a high-integrity engine for reconstructing the past through the lens of verifiable evidence.
