const fs = require('fs');
const jsPath = 'c:\\Users\\willh\\Desktop\\primary-sources\\web\\html\\assets\\js\\workbench.js';

let js = fs.readFileSync(jsPath, 'utf8');

// The messed up part
const messedUpRegex = /<div class="flex items-center gap-4">\s+<!-- Header Component Placeholder \(Matches\/Candidates style\) -->\s+<div class="flex items-center gap-3 px-3 py-2 rounded border border-white\/10 bg-black\/20">\s+<!-- Header Component Placeholder \(Matches\/Candidates style\) -->\s+<div class="flex items-center gap-3 px-3 py-2 rounded border border-white\/10 bg-black\/20">\s+<span class="text-\[10px\] opacity-60 font-bold whitespace-nowrap uppercase tracking-widest">Workbench Context<\/span>\s+<div class="flex items-baseline gap-2">\s+<span class="text-xl font-bold text-archive-heading opacity-50">---<\/span>\s+<\/div>\s+<\/div>\s+<\/div>/;

const cleanHeader = `<div class="flex items-center gap-4">
                    <!-- Header Component Placeholder (Matches/Candidates style) -->
                    <div class="flex items-center gap-3 px-3 py-2 rounded border border-white/10 bg-black/20">
                        <span class="text-[10px] opacity-60 font-bold whitespace-nowrap uppercase tracking-widest">Workbench Context</span>
                        <div class="flex items-baseline gap-2">
                            <span class="text-xl font-bold text-archive-heading opacity-50">---</span>
                        </div>
                    </div>`;

js = js.replace(messedUpRegex, cleanHeader);

fs.writeFileSync(jsPath, js);
console.log('JS Header fixed');
