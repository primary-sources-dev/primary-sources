# UI Directory Structure & Path Conventions

## Directory Structure

```text
/docs/ui/
├── assets/
│   ├── css/
│   ├── js/
│   └── data/
├── browse/          # Search & Faceted Navigation
│   ├── people.html
│   ├── events.html
│   └── ...
├── entities/        # Profile Pages
│   ├── person.html
│   ├── event.html
│   └── ...
├── features/        # Specialized Tools & Views
│   ├── otd.html
│   └── ...
├── ocr/             # OCR Tooling & Viewer
│   ├── pdf-viewer.html
│   └── index.html
├── pages/           # Content Pages
│   ├── about.html
│   ├── blog.html
│   └── ...
├── components/      # Partial HTML Templates
└── index.html       # Landing Page
```

## Path Conventions

### 1. Root-Relative Absolute Paths
All internal links, asset references, and script imports **MUST** use absolute, root-relative paths starting with a leading slash `/`.

*   **Bad**: `../../assets/js/main.js`
*   **Good**: `/assets/js/main.js`
*   **Good**: `/index.html`
*   **Good**: `/browse/people.html`

### 2. Component Loading
The `components.js` script loads partials from the `/components/` directory using root-relative paths. 

```javascript
// Inside components.js
const response = await fetch(`/components/${componentName}.html`);
```

### 3. Entity Links
Entities are linked using the following pattern:
`/entities/[type].html?id=[id]`

### 4. PDF Viewer
All PDF documents should be routed through the forensic viewer:
`/ocr/pdf-viewer.html?file=[path]`

### 5. Backend Logic (JS)
JavaScript files in `/assets/js/` should always use absolute paths when fetching data or navigating. 

```javascript
// Inside db-logic.js
if (item.person_id) itemLink = `/entities/person.html?id=${item.person_id}`;
```
