/**
 * Lightweight Component Loader
 * 
 * Supports two modes:
 * 1. Pre-built: Components injected by build.py — just fire events
 * 2. Runtime: Fetch components dynamically (dev mode fallback)
 */
document.addEventListener("DOMContentLoaded", () => {
    const components = document.querySelectorAll("[data-component]");

    components.forEach(async (el) => {
        const componentName = el.getAttribute("data-component");

        // Check if component was pre-built (has content with BUILD marker)
        const isPreBuilt = el.innerHTML.includes("BUILD:INJECTED");
        
        if (isPreBuilt) {
            // Pre-built: just mark as loaded and fire event
            el.classList.add("component-loaded");
            document.dispatchEvent(new CustomEvent("componentLoaded", {
                detail: { name: componentName, element: el }
            }));
            return;
        }

        // Runtime fallback: fetch component dynamically
        try {
            const getBasePath = () => {
                const scripts = document.getElementsByTagName('script');
                for (let i = 0; i < scripts.length; i++) {
                    const src = scripts[i].src;
                    if (src.includes('assets/js/components.js')) {
                        return src.split('assets/js/components.js')[0];
                    }
                }
                return '';
            };
            const basePath = getBasePath();
            const response = await fetch(`${basePath}components/${componentName}.html`);
            if (!response.ok) throw new Error(`Failed to load ${componentName} from ${basePath}components/`);

            const html = await response.text();
            const updatedHtml = html.replace(/href="\//g, `href="${basePath}`);
            el.innerHTML = updatedHtml;

            el.classList.add("component-loaded");
            document.dispatchEvent(new CustomEvent("componentLoaded", {
                detail: { name: componentName, element: el }
            }));

        } catch (err) {
            console.error(err);
        }
    });
});
