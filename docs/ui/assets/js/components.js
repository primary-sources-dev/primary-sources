/**
 * Lightweight Component Loader
 */
document.addEventListener("DOMContentLoaded", () => {
    const components = document.querySelectorAll("[data-component]");

    components.forEach(async (el) => {
        const componentName = el.getAttribute("data-component");

        try {
            const response = await fetch(`components/${componentName}.html`);
            if (!response.ok) throw new Error(`Failed to load ${componentName}`);

            const html = await response.text();
            el.innerHTML = html;

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
