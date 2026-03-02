const fs = require('fs');
const jsPath = 'c:\\Users\\willh\\Desktop\\primary-sources\\web\\html\\assets\\js\\workbench.js';

let js = fs.readFileSync(jsPath, 'utf8');

if (!js.includes('this.switchTab(initialTab)')) {
    const initEnd = 'this.loadClassificationData();\\s+\\}\\s+\\}';
    const initInjection = `
        // Initial header render
        const initialTab = this.requestedTab || (this.isWorkbenchMode ? 'input' : 'classify');
        this.switchTab(initialTab);
    `;

    js = js.replace(/(this\.loadClassificationData\(\);\s+\}\s+)(\})/, (match, p1, p2) => {
        return p1 + `
        // Initial header render
        const initialTab = this.requestedTab || (this.isWorkbenchMode ? 'input' : 'classify');
        this.switchTab(initialTab);
    ` + p2;
    });

    fs.writeFileSync(jsPath, js);
    console.log('JS init updated');
}
