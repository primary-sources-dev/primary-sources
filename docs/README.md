# Documentation Index: Research Methodology and Standards

This directory contains the authoritative technical specifications, ontological definitions, and operational procedures for the Primary Sources research vault. All data entry and schema modifications must align with the standards documented herein.

## 1. Navigational Index

### Schema & Standards

* **[Architecture and Schema](./architecture-and-schema.md)**
  Detailed blueprint of the 4NF PostgreSQL engine, including table structures, UUID strategy, and referential integrity triggers.
* **[Ontology and Controlled Vocabulary](./ontology-and-controlled-vocab.md)**
  Precise definitions for all reference codes (v_ tables). Defines the functional boundaries for event types, participant roles, and assertion predicates.
* **[Provenance Standards](./provenance-and-sourcing.md)**
  The evidentiary bar for primary sources. Protocols for archival referencing, RIF formatting, and digital artifact preservation.

### Operational Guides

* **[Data Entry SOP](./data-entry-sop.md)**
  Standard Operating Procedure for contributors. The step-by-step workflow for decomposing a primary source into normalized relational records.
* **[OCR Pipeline Guide](./ocr-pipeline-guide.md)**
  Complete workflow for processing scanned PDFs into searchable text. Covers tool installation, batch processing scripts, quality control, and database integration.

## 2. Core Logic: The Assertion Framework

To maintain academic and professional standards, this project utilizes a decoupled claim model. We do not store "Facts" as static database values. Instead, we store **Assertions** linked to **Excerpts** from **Sources**.

This architecture specifically supports:

* **Conflicting Timelines:** Multiple sources can make contradictory assertions about a single event without breaking the database.
* **Traceability:** Every data point in a generated timeline or resource can be traced back to its specific source excerpt.
* **4NF Compliance:** Multi-valued attributes (e.g., a person with multiple aliases or an event with multiple locations) are handled through junction tables to prevent data redundancy.

## 3. Preservation Standards

* **Normalization:** All data must be decomposed to the Fourth Normal Form (4NF).
* **Immutability:** Primary keys (UUIDs) must remain constant.
* **Computability:** All types must be selected from the Controlled Vocabulary to ensure the data is ready for algorithmic timeline generation and link analysis.
