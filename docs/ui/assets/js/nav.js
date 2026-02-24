/**
 * nav.js — Navigation active-state highlighting
 *
 * Bug fix: Tailwind opacity utilities like "text-archive-secondary/40" cannot be
 * removed with classList.remove() because Tailwind generates them as atomic classes
 * and the slash is a valid CSS class character but classList treats the string exactly.
 * Solution: Use inline style / data attribute approach instead.
 */
document.addEventListener("componentLoaded", (e) => {
    if (e.detail.name !== 'bottom-nav') return;

    const activeItem = (el.getAttribute("data-active") || "").toLowerCase();

    el.querySelectorAll('a').forEach(link => {
        const labelEl = link.querySelector('span:last-child');
        const label = labelEl?.textContent?.trim().toLowerCase() || '';

        if (label === activeItem) {
            link.style.color = 'var(--primary)';
            const iconEl = link.querySelector('.material-symbols-outlined');
            if (iconEl) iconEl.style.fontVariationSettings = "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24";
        } else {
            link.style.color = 'rgba(212,207,199,0.4)';
        }
    });
});

/**
 * Handle Header logic: Dynamic Breadcrumbs
 */
document.addEventListener("componentLoaded", (e) => {
    if (e.detail.name !== 'header') return;

    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) {
        let title = document.title.split(' — ')[0];
        if (title.startsWith('Browse ')) title = title.replace('Browse ', '');
        if (title === 'Primary Sources') title = 'Browse'; // Default to Browse for Home
        breadcrumb.textContent = title;
    }
});
