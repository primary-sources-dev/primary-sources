const fs = require('fs');
const jsPath = 'c:\\Users\\willh\\Desktop\\primary-sources\\web\\html\\assets\\js\\workbench.js';

let js = fs.readFileSync(jsPath, 'utf8');

const drawerHtml = `
            <div id="tab-info-modal" class="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
                <!-- Drawer Background (Solid) -->
                <div class="bg-[#0e0e0e] border-l border-white/10 w-full max-w-md h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-500">
                    
                    <!-- Header Area -->
                    <div class="p-8 border-b border-white/5 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary" style="font-size: 24px;">info</span>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-bold text-primary tracking-[0.2em] uppercase opacity-40">Reference</span>
                                <h2 class="text-xl font-bold tracking-tight text-white uppercase">\${content.title}</h2>
                            </div>
                        </div>
                        
                        <!-- Close Button -->
                        <button data-action="close-tab-info" class="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
                            <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
                        </button>
                    </div>

                    <!-- Scrollable Content -->
                    <div class="flex-1 overflow-y-auto p-8 space-y-8">
                        <!-- Section 1 -->
                        <div class="flex flex-col gap-3">
                            <span class="text-[10px] font-bold text-primary tracking-widest uppercase opacity-40">What it is</span>
                            <div class="p-5 rounded border border-white/5 bg-white/[0.02]">
                                <p class="text-sm leading-relaxed text-[#aaa] font-medium">\${content.section1}</p>
                            </div>
                        </div>

                        <!-- Section 2 -->
                        <div class="flex flex-col gap-3">
                            <span class="text-[10px] font-bold text-primary tracking-widest uppercase opacity-40">How to use</span>
                            <div class="p-5 rounded border border-white/5 bg-white/[0.02]">
                                <p class="text-sm leading-relaxed text-[#aaa] font-medium">\${content.section2}</p>
                            </div>
                        </div>

                        <!-- Section 3 -->
                        <div class="flex flex-col gap-3">
                            <span class="text-[10px] font-bold text-primary tracking-widest uppercase opacity-40">Technical Details</span>
                            <div class="p-5 rounded border border-white/5 bg-white/[0.02]">
                                <p class="text-sm leading-relaxed text-[#aaa] font-medium">\${content.section3}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="p-8 border-t border-white/5 bg-black/20">
                        <p class="text-[10px] text-white/20 uppercase tracking-widest">Workbench Documentation v1.2</p>
                    </div>
                </div>
            </div>
`;

// Replace the modalHtml variable content
const modalRegex = /const modalHtml = `[\s\S]*?`;/;
js = js.replace(modalRegex, `const modalHtml = \`${drawerHtml}\`;`);

fs.writeFileSync(jsPath, js);
console.log('JS Tab Info converted to Drawer');
