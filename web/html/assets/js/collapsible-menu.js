/**
 * Mega Menu Logic
 * Handles the interaction for the upgraded navigation header.
 */

let menuInitialized = false;

// Initialize when header component loads (modular component system)
document.addEventListener('componentLoaded', (e) => {
    if (e.detail.name === 'header' && !menuInitialized) {
        initMegaMenu();
    }
});

// Fallback: Initialize on DOMContentLoaded if header is already in DOM (pre-built)
document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.getElementById('header-dropdown');
    if (!menuInitialized && dropdown) {
        initMegaMenu();
    }
});

function initMegaMenu() {
    if (menuInitialized) return;
    menuInitialized = true;

    const menuToggle = document.getElementById('menu-toggle');
    const dropdown = document.getElementById('header-dropdown');

    if (!menuToggle || !dropdown) return;

    // Toggle on click (Mobile / Touch support)
    menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle('mega-menu-active');

        // Update ARIA for accessibility
        const isActive = dropdown.classList.contains('mega-menu-active');
        menuToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#header-dropdown') && !e.target.closest('#menu-toggle')) {
            dropdown.classList.remove('mega-menu-active');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dropdown.classList.remove('mega-menu-active');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });

    // Optional: Log initialization
    console.log("Mega Menu Initialized — UX Upgraded");
}
