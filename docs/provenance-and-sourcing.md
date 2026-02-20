# Provenance Standards

This document defines the evidentiary bar for primary sources within the vault. In a research-grade system, "Provenance" is the record of custody and origin that proves a piece of evidence is authentic and provides the context necessary for academic citation.

## 1. The Evidence Hierarchy

To maintain integrity, the vault prioritizes sources based on their proximity to the event:

1. **Primary Source (Type: `DOCUMENT`, `MEDIA`, `TESTIMONY`):** Direct records created at the time of the event (e.g., FBI 302 reports, WFAA raw footage, Dallas Police radio logs).
2. **Secondary Source (Type: `REPORT`, `ARTICLE`):** Analytical works created after the fact that interpret primary data (e.g., The Warren Report, HSCA findings).
3. **Tertiary Source (Type: `BOOK`):** Comprehensive summaries or historical overviews.

## 2. Mandatory Metadata for Sources

Every entry in the `source` table must include the following to meet the vault's "Precise" standard:

* **`External_Ref`**: Must contain the official archival identifier. For JFK-related documents, this is the **NARA RIF Number** (e.g., `124-10001-10000`).
* **`Author`**: The specific individual responsible for the content. For FBI reports, this is the **Reporting Agent** (e.g., `SA James P. Hosty`).
* **`Published_Date`**: The date the record was finalized or the broadcast occurred.

## 3. Excerpt Protocol

An `assertion` is only as strong as its `source_excerpt`. Excerpts must follow these locator standards:

* **Written Documents:** Must include Page Number and Paragraph Number (e.g., `p. 14, para. 3`).
* **Audio/Visual Media:** Must include a precise start timestamp (e.g., `00:14:22`).
* **Exhibits:** Must include the official exhibit number (e.g., `CE-399` or `DPD Exhibit A`).

## 4. Digital Preservation and Link Rot

To prevent "Link Rot," the following protocols are enforced:

1. **Permanent URLs:** Whenever possible, link to stable archives (e.g., Mary Ferrell Foundation, National Archives, or Internet Archive).
2. **Checksums (Optional):** High-priority digital assets (photos/films) should have their hash stored in the `notes` field to ensure the file has not been altered.

## 5. Handling Redacted or Anonymous Sources

In cases where a source name is redacted or a witness is anonymous:

* **Entity Naming:** Use a standardized placeholder (e.g., `UNIDENTIFIED_WITNESS_01`).
* **Provenance Note:** The `source` notes must state: *"Identity redacted in original NARA RIF [Number]."*

