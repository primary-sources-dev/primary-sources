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

    const el = e.detail.element;
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
 * Hides breadcrumbs on homepage, shows current section elsewhere
 */
document.addEventListener("componentLoaded", (e) => {
    if (e.detail.name !== 'header') return;

    const breadcrumbNav = document.getElementById('breadcrumb-nav');
    const breadcrumb = document.getElementById('breadcrumb-current');

    // Detect homepage by path or title
    const path = window.location.pathname;
    const isHomepage = path === '/' || path.endsWith('/index.html') || path === '/index.html';

    if (isHomepage && breadcrumbNav) {
        breadcrumbNav.style.display = 'none';
    } else if (breadcrumb) {
        let title = document.title.split(' — ')[0];
        if (title.startsWith('Browse ')) title = title.replace('Browse ', '');
        if (title === 'Primary Sources') title = 'Browse';
        breadcrumb.textContent = title;
    }
});

/**
 * Layout Observer: Dynamic Height Detection
 * Measures real-world height of Header and Navbar to eliminate hardcoded CSS guesses.
 * Updates CSS variables --header-height and --navbar-height on :root.
 */
const updateLayoutHeights = () => {
    const header = document.querySelector('header');
    const navbar = document.querySelector('nav[data-component="bottom-nav"]');

    if (header) {
        document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    }
    if (navbar) {
        document.documentElement.style.setProperty('--navbar-height', `${navbar.offsetHeight}px`);
    }
};

// Use ResizeObserver for high-precision tracking (handles font scaling/zoom)
const layoutObserver = new ResizeObserver(() => {
    updateLayoutHeights();
});

document.addEventListener("componentLoaded", (e) => {
    if (e.detail.name === 'header' || e.detail.name === 'bottom-nav') {
        const el = e.detail.element;
        layoutObserver.observe(el);
        updateLayoutHeights();
    }
});

// Initial run to catch pre-built or fast-loading elements
window.addEventListener('load', updateLayoutHeights);
