/**
 * Collapsible Navigation Menu
 * Handles expand/collapse of category and subcategory sections in the header dropdown
 *
 * MODULAR COMPONENT INTEGRATION:
 * - Automatically initializes when header component is loaded
 * - Listens for 'componentLoaded' event from components.js
 * - No need to manually include this script on every page
 */

// Initialize when header component loads (modular component system)
document.addEventListener('componentLoaded', (e) => {
    if (e.detail.name === 'header') {
        initCollapsibleMenu();
    }
});

// Fallback: Initialize on DOMContentLoaded if header is already in DOM (static HTML)
document.addEventListener('DOMContentLoaded', () => {
    // Only init if header exists and componentLoaded hasn't fired yet
    if (document.querySelector('.category-toggle')) {
        initCollapsibleMenu();
    }
});

function initCollapsibleMenu() {
    // Handle category toggles
    const categoryToggles = document.querySelectorAll('.category-toggle');
    categoryToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCategory(toggle);
        });

        // Keyboard navigation
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCategory(toggle);
            } else if (e.key === 'Escape') {
                collapseAll();
            }
        });
    });

    // Handle subcategory toggles
    const subcategoryToggles = document.querySelectorAll('.subcategory-toggle');
    subcategoryToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleSubcategory(toggle);
        });

        // Keyboard navigation
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSubcategory(toggle);
            } else if (e.key === 'Escape') {
                collapseAll();
            }
        });
    });

    // Close all categories when clicking outside menu
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#header-dropdown') && !e.target.closest('#menu-toggle')) {
            collapseAll();
        }
    });

    // Optional: Restore last opened category
    // restoreState();
}

function toggleCategory(toggleButton) {
    const targetId = toggleButton.dataset.target;
    const targetElement = document.getElementById(targetId);

    if (!targetElement) return;

    // Check if already expanded
    const isExpanded = targetElement.classList.contains('expanded');

    // Collapse all other categories first (accordion behavior)
    collapseAllCategories();

    if (!isExpanded) {
        // Expand this category
        targetElement.classList.add('expanded');
        toggleButton.classList.add('expanded');
        toggleButton.setAttribute('aria-expanded', 'true');

        // Store state in sessionStorage (optional - for persistence)
        sessionStorage.setItem('activeCategory', targetId);
    } else {
        // Collapse this category
        targetElement.classList.remove('expanded');
        toggleButton.classList.remove('expanded');
        toggleButton.setAttribute('aria-expanded', 'false');
        sessionStorage.removeItem('activeCategory');
    }
}

function toggleSubcategory(toggleButton) {
    const targetId = toggleButton.dataset.target;
    const targetElement = document.getElementById(targetId);

    if (!targetElement) return;

    // Toggle expanded state
    const isExpanded = targetElement.classList.contains('expanded');

    if (!isExpanded) {
        targetElement.classList.add('expanded');
        toggleButton.classList.add('expanded');
        toggleButton.setAttribute('aria-expanded', 'true');
    } else {
        targetElement.classList.remove('expanded');
        toggleButton.classList.remove('expanded');
        toggleButton.setAttribute('aria-expanded', 'false');
    }
}

function collapseAllCategories() {
    const allCategoryItems = document.querySelectorAll('.category-items');
    const allCategoryToggles = document.querySelectorAll('.category-toggle');

    allCategoryItems.forEach(item => item.classList.remove('expanded'));
    allCategoryToggles.forEach(toggle => {
        toggle.classList.remove('expanded');
        toggle.setAttribute('aria-expanded', 'false');
    });
}

function collapseAll() {
    collapseAllCategories();

    const allSubcategoryItems = document.querySelectorAll('.subcategory-items');
    const allSubcategoryToggles = document.querySelectorAll('.subcategory-toggle');

    allSubcategoryItems.forEach(item => item.classList.remove('expanded'));
    allSubcategoryToggles.forEach(toggle => {
        toggle.classList.remove('expanded');
        toggle.setAttribute('aria-expanded', 'false');
    });

    sessionStorage.removeItem('activeCategory');
}

// Optional: Restore last opened category on page load
function restoreState() {
    const activeCategory = sessionStorage.getItem('activeCategory');
    if (activeCategory) {
        const targetElement = document.getElementById(activeCategory);
        const toggleButton = document.querySelector(`[data-target="${activeCategory}"]`);

        if (targetElement && toggleButton) {
            targetElement.classList.add('expanded');
            toggleButton.classList.add('expanded');
            toggleButton.setAttribute('aria-expanded', 'true');
        }
    }
}
