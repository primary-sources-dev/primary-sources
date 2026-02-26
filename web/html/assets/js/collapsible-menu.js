/**
 * Mega Menu Logic
 * Handles the interaction for the refined 95% width navigation modal.
 */

let menuInitialized = false;

// Initialize when header component loads
document.addEventListener('componentLoaded', (e) => {
    if (e.detail.name === 'header' && !menuInitialized) {
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

    // Close Card Action (Bottom Right)
    if (closeContainer) {
        closeContainer.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeMenuAction();
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
