/**
 * Lightweight Component Loader
 */
document.addEventListener("DOMContentLoaded", () => {
    const components = document.querySelectorAll("[data-component]");

    components.forEach(async (el) => {
        const componentName = el.getAttribute("data-component");

        try {
            // Use root-relative path to ensure components load from any directory depth
            const response = await fetch(`/components/${componentName}.html`);
            if (!response.ok) throw new Error(`Failed to load ${componentName} from root-relative path`);

            const html = await response.text();
            el.innerHTML = html;

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
