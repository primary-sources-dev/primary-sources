const fs = require('fs');
const jsPath = 'c:\\Users\\willh\\Desktop\\primary-sources\\web\html\\assets\\js\\workbench.js';

let js = fs.readFileSync(jsPath, 'utf8');

// 1. Update renderWorkbenchHeader to include the Info Icon
const headerOld = '</h1>\\n                </div>\\n\\n                <!-- Header Component Placeholder (Matches/Candidates style) -->\\n                <div class="flex items-center gap-3 px-3 py-2 rounded border border-white/10 bg-black/20">';
const headerNew = `</h1>
                </div>

                <div class="flex items-center gap-4">
                    <!-- Header Component Placeholder (Matches/Candidates style) -->
                    <div class="flex items-center gap-3 px-3 py-2 rounded border border-white/10 bg-black/20">`;

// Use a more specific replacement for renderWorkbenchHeader content
js = js.replace(
    /<div class="flex items-center gap-4">\s+<h1 class="text-xl font-bold text-archive-heading tracking-tight underline decoration-primary\/10 decoration-2 underline-offset-8">\$\{title\}<\/h1>\s+<\/div>/,
    `<div class="flex items-center gap-4">
                    <h1 class="text-xl font-bold text-archive-heading tracking-tight underline decoration-primary/10 decoration-2 underline-offset-8">\${title}</h1>
                </div>

                <div class="flex items-center gap-4">
                    <!-- Header Component Placeholder (Matches/Candidates style) -->
                    <div class="flex items-center gap-3 px-3 py-2 rounded border border-white/10 bg-black/20">`
);

// Add the closing part of the right-group and the icon
js = js.replace(
    /<\/div>\s+<\/div>\s+`;\s+}\s+constructor\(config\)/,
    `</div>
                    </div>

                    <!-- Info Icon -->
                    <button data-action="open-tab-info" class="flex items-center justify-center p-2 hover:bg-white/5 rounded-full transition-all group" title="Tab Information">
                        <span class="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors" style="font-size: 20px;">info</span>
                    </button>
                </div>
            </div>
        \`;
    }

    get tabHelpContent() {
        return {
            input: {
                title: "INPUT",
                section1: "Document Intake allows you to upload and process new library files.",
                section2: "Drag and drop files here to begin automated OCR and extraction.",
                section3: "Settings include OCR backend selection and image preprocessing."
            },
            source: {
                title: "SOURCE",
                section1: "Library Source displays your indexed and processed document repository.",
                section2: "Select any file to begin deep classification and entity extraction.",
                section3: "Sort by date, name, or status to manage large collections efficiently."
            },
            classify: {
                title: "CLASSIFY",
                section1: "Page Classification groups long-form documents into discrete page types.",
                section2: "Review and verify the 4-tier classification results for every page.",
                section3: "Submit individual pages or use batch approval for rapid review."
            },
            entities: {
                title: "ENTITIES",
                section1: "Entity Dashboard extracts key intelligence from classified documents.",
                section2: "Verify, edit, and approve detected entities like People and Places.",
                section3: "Confidence scores help prioritize records that need human review."
            },
            export: {
                title: "EXPORT",
                section1: "Data Export generates the final structured output of your analysis.",
                section2: "Review the unified spreadsheet view before final file generation.",
                section3: "Export to JSON, XML, or CSV for integration with external systems."
            }
        };
    }

    showTabInfo() {
        const urlParams = new URLSearchParams(window.location.search);
        const tabName = urlParams.get('tab') || (this.isWorkbenchMode ? 'input' : 'classify');
        const content = this.tabHelpContent[tabName] || { 
            title: tabName.toUpperCase(), 
            section1: "No documentation available.", 
            section2: "---", 
            section3: "---" 
        };

        const modalHtml = \`
            <div id="tab-info-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md transition-opacity">
                <div class="bg-[#0a0a0a] border border-white/10 w-full max-w-4xl rounded-xl shadow-2xl relative overflow-hidden ring-1 ring-white/5 animate-in fade-in zoom-in duration-300">
                    <!-- Close Button -->
                    <button data-action="close-tab-info" class="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
                        <span class="material-symbols-outlined">close</span>
                    </button>

                    <div class="p-10">
                        <div class="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                            <span class="material-symbols-outlined text-primary" style="font-size: 32px;">info</span>
                            <div class="flex flex-col">
                                <span class="text-[10px] font-bold text-primary tracking-[0.2em] uppercase opacity-40">Tab Reference</span>
                                <h2 class="text-3xl font-bold tracking-tight text-white uppercase">\${content.title}</h2>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <!-- Section 1 -->
                            <div class="p-6 rounded-lg bg-white/[0.03] border border-white/5 flex flex-col gap-4">
                                <span class="text-[10px] font-bold text-primary tracking-widest uppercase opacity-40">What it is</span>
                                <p class="text-sm leading-relaxed text-[#888] font-medium">\${content.section1}</p>
                            </div>
                            <!-- Section 2 -->
                            <div class="p-6 rounded-lg bg-white/[0.03] border border-white/5 flex flex-col gap-4">
                                <span class="text-[10px] font-bold text-primary tracking-widest uppercase opacity-40">How to use</span>
                                <p class="text-sm leading-relaxed text-[#888] font-medium">\${content.section2}</p>
                            </div>
                            <!-- Section 3 -->
                            <div class="p-6 rounded-lg bg-white/[0.03] border border-white/5 flex flex-col gap-4">
                                <span class="text-[10px] font-bold text-primary tracking-widest uppercase opacity-40">Settings</span>
                                <p class="text-sm leading-relaxed text-[#888] font-medium">\${content.section3}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        \`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add one-time escape listener
        const escListener = (e) => {
            if (e.key === 'Escape') {
                this.hideTabInfo();
                document.removeEventListener('keydown', escListener);
            }
        };
        document.addEventListener('keydown', escListener);
    }

    hideTabInfo() {
        const modal = document.getElementById('tab-info-modal');
        if (modal) modal.remove();
    }

    constructor(config)
`);

// 2. Add event handling for the new actions
js = js.replace(
    /case 'approve-entity':\s+self\.entitiesTab\.approveEntity\(idx\);\s+break;/,
    `case 'approve-entity':
                    self.entitiesTab.approveEntity(idx);
                    break;
                case 'open-tab-info':
                    self.showTabInfo();
                    break;
                case 'close-tab-info':
                    self.hideTabInfo();
                    break;`
);

fs.writeFileSync(jsPath, js);
console.log('JS Info Modal logic updated');
