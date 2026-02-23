It has been a pleasure helping you architect this. This project has evolved from a database into a universal "Historical Engine."

Below is the compiled master roadmap, encompassing every feature from the 4NF core to the immersive AI simulations and the business toolset. I have organized these into a logical hierarchy that reflects the "Primary Sources" vision.

---

# Primary Sources: Master Feature & Product Roadmap

**Project Principle:** A subject-agnostic chronological engine that transforms raw primary sources into structured metadata for research, simulation, and immersive education.

### **Total Feature Count: 26**

| ID | Category | Feature Name | Underlying Data Logic | User Experience / Value |
| --- | --- | --- | --- | --- |
| **01** | **Utility (Phase 1)** | **Member-Only OCR** | Tesseract-as-a-Service | **Primary Hook:** Free transcription for members; seeds the global `source_excerpt` table. |
| **02** | **Forensic** | **Conflict Heatmap** | `assertion_support` (Contradicts/Supports) | Visualizes "Hot Zones" in evidence where sources disagree (Red = High Conflict). |
| **03** | **Forensic** | **Network Explorer** | `event_participant` junction tables | Reveals "Six Degrees of Separation" between any two entities in the database. |
| **04** | **Forensic** | **3D Print Replicas** | `object.file_url` (STL/OBJ) | Downloadable historical artifacts (bullets, exhibits) for physical 3D printing. |
| **05** | **Narrative** | **POV "Shadow" Timelines** | `assertion.subject_id` filtering | View the world's chronology strictly through the claims of a single witness. |
| **06** | **Narrative** | **11.22 Cultural Portal** | `culture_metadata` table | Immersive "Time Machine" showing 1963 music, TV, and commodity prices. |
| **07** | **Narrative** | **"Slow Reveal" Mode** | `event.start_ts` sequencing | A pedagogical tool for classrooms to reveal evidence step-by-step to test theories. |
| **08** | **Narrative** | **Regional Pulse** | `place.lat/lon` + Regional Metadata | Browse a map to see what the jukebox, theater, and prices were at that exact spot. |
| **09** | **Sports** | **Game Reconstructor** | `event` (Game) + `assertion` (Plays) | Reconstructs historical sports games as "live" events from text box scores or radio. |
| **10** | **Sports** | **Radio-to-Visual AI** | AI Gen + Audio Archives | Uses AI to "film" games or events that only exist as radio broadcasts or text logs. |
| **11** | **Simulation** | **Witness POV Video** | `place.lat/lon` + `person` roles | Generates AI video of exactly what a witness saw from their specific location. |
| **12** | **Simulation** | **AR Spatial Overlays** | GPS + `place` coordinates | Projects historical entities (motorcades, people) onto real-world modern streets. |
| **13** | **Simulation** | **Synthetic Case Files** | AI + `assertion` attributes | Generates FBI-style reports that automatically highlight and debate conflicting data. |
| **14** | **Membership** | **Digital Vault Access** | `member_status` permissions | Access to high-resolution raw document scans and proprietary 3D/research files. |
| **15** | **Membership** | **Onboarding State** | `user_preferences` table | Customizes the initial dashboard view (e.g., Forensics vs. Culture) based on a quiz. |
| **16** | **Engagement** | **Quizzes & Achievement Badges** | `user_badges` + `assertion` logic | Earn forensic "Badges" (e.g., *Pathologist*, *Ballistics Expert*) by completing source-based quizzes. |
| **17** | **Engagement** | **Contribution Missions** | `source_excerpt` + `reputation_score` | High-accuracy contributors earn status badges and priority access to new primary sources. |
| **18** | **Engagement** | **Infinite Evidence Canvas** | `canvas_state` + `z-index` | An interactive drag-and-drop workbench to visually arrange and link evidence with causal "threads." |
| **19** | **Research** | **Private Forensic Notes** | `user_entity_notes` (Subject-linked) | Attach private, encrypted research notes directly to any person, place, or object. |
| **20** | **Research** | **Self-Service Vault** | `user_sources` + `member_id` | Upload your own primary scans to your private digital workbench for automatic OCR/Analysis. |
| **21** | **Research** | **Custom Field Guides** | `resource_sheet_templates` | Export entities and timelines into "Resource Sheets" or custom research pages for publication. |
| **22** | **Genealogy** | **Lineage Engine** | `person_relation` Recursive CTEs | Track bloodlines and family trees across centuries by mapping births, marriages, and migrations. |
| **23** | **Genealogy** | **Ancestral Chronology** | `assertion` (Family Claims) | Compare conflicting family legends against verified primary source records (Censuses, Deeds). |
| **24** | **Assistant** | **"On This Day" (OTD)** | Date extraction from `event` | Daily/Weekly/Monthly reports and downloadable resource sheets for researchers. |
| **25** | **Assistant** | **Age-at-Event Badge** | `birth_date` + `event.start_ts` | Automatically labels every entity with their exact age at the time of the record. |
| **26** | **Assistant** | **Inflation Converter** | CPI Reference + `assertion.value` | Real-time conversion of historical USD to modern (2026) purchasing power. |

---

### **System Architecture Visualization**

### **The "Subject-Agnostic" Vision**

This master table represents the **Primary Sources Engine**. While we are seeding it with **JFK / Yates** data first, the system is designed to handle:

1. **Any Historical Event** (e.g., The Civil Rights Movement).
2. **Any True Crime Investigation** (Cold case chronology).
3. **Any Sports Era** (Recreating the 1927 Yankees season from box scores).
4. **Any Cultural Movement** (Mapping the spread of 1960s Jazz).
5. **Genealogy & Lineage** (reconstructing family histories from disparate primary records).
