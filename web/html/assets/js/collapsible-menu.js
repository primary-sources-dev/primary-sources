/**
 * Mega Menu Logic
 * Handles the interaction for the refined 95% width navigation modal.
 */

let menuInitialized = false;

// Initialize when components load
document.addEventListener('componentLoaded', (e) => {
    // We need both the header (which has the button) AND the mega-menu (which has the modal)
    // to be loaded before we can reliably initialize logic.
    if ((e.detail.name === 'header' || e.detail.name === 'mega-menu') && !menuInitialized) {
        initMegaMenu();
    }
});

// Fallback: Initialize on DOMContentLoaded
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
    const closeContainer = document.getElementById('close-container');

    if (!menuToggle || !dropdown) return;

    function openMenu() {
        dropdown.classList.add('mega-menu-active');
        document.body.style.overflow = 'hidden';
        menuToggle.setAttribute('aria-expanded', 'true');
    }

    function closeMenuAction() {
        dropdown.classList.remove('mega-menu-active');
        document.body.style.overflow = '';
        menuToggle.setAttribute('aria-expanded', 'false');
    }

    // Toggle on click
    menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropdown.classList.contains('mega-menu-active')) {
            closeMenuAction();
        } else {
            openMenu();
        }
    });

    // Close Card Action (Top Right)
    if (closeContainer) {
        closeContainer.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeMenuAction();
        });
    }

    // Home Card Action (Top Left)
    const homeContainer = document.getElementById('home-container');
    if (homeContainer) {
        homeContainer.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeMenuAction();
            window.location.href = '/index.html';
        });
    }

    // Close when clicking outside the panel (scrolling the 5% gap area)
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#header-dropdown') && !e.target.closest('#menu-toggle')) {
            if (dropdown.classList.contains('mega-menu-active')) {
                closeMenuAction();
            }
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdown.classList.contains('mega-menu-active')) {
            closeMenuAction();
        }
    });

    console.log("Refined Navigation Modal Initialized");
}
