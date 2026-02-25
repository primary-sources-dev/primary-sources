/**
 * Lightweight Component Loader
 */
document.addEventListener("DOMContentLoaded", () => {
    const components = document.querySelectorAll("[data-component]");

    components.forEach(async (el) => {
        const componentName = el.getAttribute("data-component");

        try {
            // Find the base path relative to this script
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

            // Prefix all root-relative links (starting with /) with basePath
            // This ensures nav components work correctly at any directory depth
            const updatedHtml = html.replace(/href="\//g, `href="${basePath}`);
            el.innerHTML = updatedHtml;

            // Add loaded class to prevent FOUC
            el.classList.add("component-loaded");

            // Dispatch event for other scripts to handle post-load logic
            const event = new CustomEvent("componentLoaded", {
                detail: { name: componentName, element: el }
            });
            document.dispatchEvent(event);

        } catch (err) {
            console.error(err);
        }
    });
});
