const fs = require('fs');
const htmlPath = 'c:\\Users\\willh\\Desktop\\primary-sources\\web\\html\\tools\\workbench\\workbench.html';
const jsPath = 'c:\\Users\\willh\\Desktop\\primary-sources\\web\\html\\assets\\js\\workbench.js';

// HTML Injection
let html = fs.readFileSync(htmlPath, 'utf8');
if (!html.includes('id="workbench-active-header"')) {
    html = html.replace(
        '<div class="max-w-6xl mx-auto py-6 px-6">',
        '<div class="max-w-6xl mx-auto py-6 px-6">\n            <!-- WORKBENCH HEADER -->\n            <div id="workbench-active-header"></div>'
    );
    fs.writeFileSync(htmlPath, html);
    console.log('HTML updated');
}

// JS Injection
let js = fs.readFileSync(jsPath, 'utf8');
const headerMethod = `
    renderWorkbenchHeader(tabName) {
        const titles = {
            input: "DOCUMENT INTAKE",
            source: "LIBRARY SOURCE",
            classify: "PAGE CLASSIFICATION",
            entities: "ENTITY DASHBOARD",
            export: "DATA EXPORT"
        };
        const title = titles[tabName] || "WORKBENCH";

        return \`
            <div class="workbench-header flex items-center justify-between py-4 border-b border-white/10 mb-6 bg-archive-bg/95 backdrop-blur z-20">
                <div class="flex items-center gap-4">
                    <span class="text-[10px] font-bold text-primary tracking-widest uppercase opacity-40">Title</span>
                    <h1 class="text-xl font-bold text-archive-heading tracking-tight underline decoration-primary/30 decoration-2 underline-offset-8">\${title}</h1>
                </div>

                <!-- Header Component Placeholder (Matches/Candidates style) -->
                <div class="flex items-center gap-3 px-3 py-2 rounded border border-white/10 bg-black/20">
                    <span class="text-[10px] opacity-60 font-bold whitespace-nowrap uppercase tracking-widest">Workbench Context</span>
                    <div class="flex items-baseline gap-2">
                        <span class="text-xl font-bold text-archive-heading opacity-50">---</span>
                    </div>
                </div>
            </div>
        \`;
    }
`;

if (!js.includes('renderWorkbenchHeader')) {
    js = js.replace('class DocumentWorkbench {', 'class DocumentWorkbench {' + headerMethod);

    // Update switchTab
    const switchTabOld = "history.replaceState(null, '', url);\\n        }";
    const switchTabNew = "history.replaceState(null, '', url);\\n        }\\n\\n        // Update Dynamic Header\\n        const headerEl = document.getElementById('workbench-active-header');\\n        if (headerEl) {\\n            headerEl.innerHTML = this.renderWorkbenchHeader(tabName);\\n        }";

    // Using a more robust regex for switchTab update
    js = js.replace(/history\.replaceState\(null, '', url\);\s+\}/, (match) => {
        return match + `

        // Update Dynamic Header
        const headerEl = document.getElementById('workbench-active-header');
        if (headerEl) {
            headerEl.innerHTML = this.renderWorkbenchHeader(tabName);
        }`;
    });

    fs.writeFileSync(jsPath, js);
    console.log('JS updated');
}
