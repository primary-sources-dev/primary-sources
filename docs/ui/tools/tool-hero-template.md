# Tool Page Hero Section Template

## Purpose
The hero section establishes the tool's identity and value proposition within the first 3 seconds of page load. It answers: "What is this tool, what does it do, and why should I use it?"

---

## Hero Structure

### 1. Status Badge (Top)
**Format:** `[Icon] [Category] · [Status]`

**Examples:**
- `🎯 Analytical Tool · Live`
- `⚡ Processing Tool · Beta`
- `🔬 Forensic Tool · Active`
- `📊 Diagnostic Tool · Experimental`

**Purpose:** Sets expectations for tool maturity and category

---

### 2. Tool Name (H1)
**Style:** Large, uppercase, display font (Oswald)

**Pattern:** `[Action/Noun] + [Object/Context]`

**Examples:**
- Citation Generator
- Document Layout Analyzer
- Classification Review Tool
- Entity Matcher
- Extraction Workbench

**Guidelines:**
- Keep under 4 words
- Use descriptive nouns (not generic terms like "Tool" or "System")
- Emphasize the PRIMARY function

---

### 3. Value Proposition (Subtitle)
**Length:** 1-2 sentences (max 150 characters)

**Formula:** `[What it does] + [For whom/what purpose] + [Key differentiator]`

**Examples:**

**Good:**
> "Visual review interface for validating document classification results with PDF rendering, text layer highlighting, and confidence scoring."

> "Intelligent document classification engine that automatically identifies document types from scanned archival materials and extracts structured metadata."

> "Academic citation formatter for archival research. Generate properly formatted citations from source metadata in Chicago, MLA, APA, and NARA archival styles."

**Bad (too vague):**
> "A tool for documents."

> "Helps you work with files."

> "Makes research easier."

**Pattern Breakdown:**
- **Action Verb:** Visual review / Intelligent classification / Academic formatting
- **Target:** document classification results / archival materials / source metadata
- **Unique Value:** PDF rendering + text highlighting / automatic type identification / multi-format export

---

### 4. Feature Tags (Pills)
**Count:** 2-4 tags

**Purpose:** Scannable technical highlights that reinforce credibility

**Format:** Small uppercase pills with emerald/green accent (for live tools)

**Types:**

**Performance Metrics:**
- `78.2% Classification Rate`
- `99.3% Accuracy`
- `<2s Processing Time`

**Capability Highlights:**
- `20 Document Types`
- `4 Citation Formats`
- `PDF.js Rendering`

**Technology Stack:**
- `Levenshtein Matching`
- `Zone-Specific Extraction`
- `Text Layer Sync`

**Scale/Coverage:**
- `Multi-Format Support`
- `Batch Processing`
- `Real-Time Validation`

---

## Writing Guidelines

### DO ✅
- **Be specific:** "Extracts RIF numbers from NARA headers" vs. "Gets metadata"
- **Use active voice:** "Transforms raw OCR text" vs. "Raw OCR text is transformed"
- **Highlight uniqueness:** What makes this tool different from alternatives?
- **Front-load value:** Most important information in first 5 words
- **Use researcher language:** "Archival materials" not "files", "Source citation" not "reference"

### DON'T ❌
- **Use jargon without context:** Avoid unexplained acronyms in the subtitle
- **Oversell:** "Revolutionary AI-powered" → just describe what it does
- **Bury the lede:** Don't start with implementation details
- **Use passive voice:** "Is designed to help" → "Helps"
- **Generic claims:** "Easy to use" / "Powerful" / "Advanced" without specifics

---

## Examples from Primary Sources Tools

### Example 1: Citation Generator
```
Status Badge: 🔖 Analytical Tool · Live
Title: Citation Generator
Subtitle: Academic citation formatter for archival research. Generate properly formatted citations from source metadata in Chicago, MLA, APA, and NARA archival styles.
Tags: Chicago 17th | MLA 9th | APA 7th | NARA
```

**Why it works:**
- Immediately clear what it outputs (citations)
- Specifies audience (academic researchers)
- Lists all supported formats upfront

---

### Example 2: Document Layout Analyzer
```
Status Badge: ✨ Analytical Tool · Live
Title: Document Layout Analyzer
Subtitle: Intelligent document classification engine that automatically identifies document types from scanned archival materials and extracts structured metadata.
Tags: 20 Document Types | 78.2% Classification Rate
```

**Why it works:**
- "Intelligent" + "automatically" = automation value
- "Scanned archival materials" = clear input type
- Metrics in tags prove real-world performance

---

### Example 3: Classification Review Tool
```
Status Badge: 🎯 Analytical Tool · Live
Title: Classification Review Tool
Subtitle: Visual review interface for validating document classification results with PDF rendering, text layer highlighting, and confidence scoring.
Tags: PDF.js Rendering | Text Layer Sync | Live Validation
```

**Why it works:**
- "Visual review" immediately signals UI-focused tool
- Three concrete features (PDF rendering, highlighting, scoring)
- Technical tags show depth without overwhelming

---

## Color Coding for Status

### Active/Live (Green)
```
bg-emerald-500/20 text-emerald-400 border-emerald-500/30
```
Use for: Tools in production, fully tested, documented

### Beta/Testing (Orange)
```
bg-orange-500/20 text-orange-400 border-orange-500/30
```
Use for: Tools functional but undergoing refinement

### Planned/In Development (Gray)
```
bg-archive-secondary/20 text-archive-secondary border-archive-secondary/30
```
Use for: Roadmap items, not yet functional

### Experimental (Purple)
```
bg-purple-500/20 text-purple-400 border-purple-500/30
```
Use for: Research prototypes, proof-of-concept

---

## Icon Selection (Material Symbols)

### Document Processing
- `document_scanner` — OCR, text extraction
- `view_quilt` — Layout analysis, classification
- `analytics` — Data extraction, workbench tools
- `pageview` — PDF viewing, rendering

### Data Operations
- `format_quote` — Citations, references
- `tag` — Metadata extraction, labeling
- `link` — Entity matching, linking
- `database` — Data commit, persistence

### Quality/Validation
- `fact_check` — Validation, verification
- `spellcheck` — Fuzzy matching, correction
- `verified` — Confidence scoring, accuracy

### Research/Analysis
- `psychology` — Intelligence layer, AI extraction
- `travel_explore` — Discovery, browsing
- `history_edu` — Historical analysis

---

## Template Checklist

Before finalizing a tool hero section, verify:

- [ ] Status badge matches tool maturity (don't mark beta tools as "Live")
- [ ] Tool name is under 4 words and action-oriented
- [ ] Subtitle answers "What?" and "Why?" in under 150 characters
- [ ] Feature tags are specific and technical (not marketing fluff)
- [ ] Icon matches primary tool function
- [ ] Color scheme matches status (emerald for live, orange for beta, etc.)
- [ ] No unexplained jargon in subtitle (save technical details for body)
- [ ] Value proposition would make sense to a non-expert researcher

---

## Final Note

The hero section is NOT the place to explain implementation details, dependencies, or technical architecture. That belongs in the "Technical Details" or "How It Works" sections below the fold.

**Goal:** Get researchers to scroll down and explore the tool documentation, not bounce because they couldn't figure out what it does in 3 seconds.
