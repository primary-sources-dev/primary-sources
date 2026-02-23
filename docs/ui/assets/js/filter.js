/**
 * Handles search, dynamic multi-dropdown filtering, and sorting logic for browse pages
 */
(function () {
    let activeFilters = {};
    let activeSort = 'a-z';
    let searchQuery = '';

    function applyFilters() {
        const containers = document.querySelectorAll("[data-data-source]");

        // Toggle Clear button visibility
        const clearWrapper = document.getElementById("clear-filters-wrapper");
        if (clearWrapper) {
            const hasActiveFilters = Object.values(activeFilters).some(v => v !== 'All');
            const isVisible = hasActiveFilters || searchQuery !== '';
            clearWrapper.style.display = isVisible ? "flex" : "none";
        }

        containers.forEach(container => {
            const cards = Array.from(container.querySelectorAll("a"));

            // 1. Filter
            cards.forEach(card => {
                const searchIndex = (card.getAttribute("data-search-index") || "").toLowerCase();
                const filterTags = (card.getAttribute("data-filter-tags") || "").toLowerCase().split('|');

                const matchesSearch = searchIndex.includes(searchQuery);

                const matchesAllFilters = Object.values(activeFilters).every(val => {
                    if (val === 'All') return true;
                    // Check if any tag exactly matches the filter value
                    return filterTags.includes(val.toLowerCase());
                });

                if (matchesSearch && matchesAllFilters) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });

            // 2. Sort
            if (activeSort === 'a-z' || activeSort === 'z-a') {
                cards.sort((a, b) => {
                    const valA = (a.getAttribute("data-title") || "").toLowerCase();
                    const valB = (b.getAttribute("data-title") || "").toLowerCase();

                    if (activeSort === 'z-a') {
                        return valB.localeCompare(valA);
                    }
                    return valA.localeCompare(valB);
                });
            }

            // 3. Re-append in sorted order
            cards.forEach(card => container.appendChild(card));
        });
    }

    function createDropdown(container, labelText, options, isSort = false) {
        const wrapper = document.createElement("div");
        wrapper.className = "flex flex-col gap-1.5 min-w-[140px]";

        const label = document.createElement("label");
        label.className = "text-[9px] font-bold uppercase tracking-[0.2em] text-primary/80 ml-1";
        label.textContent = labelText;

        const selectWrapper = document.createElement("div");
        selectWrapper.className = "relative";

        const select = document.createElement("select");
        select.className = "w-full appearance-none bg-archive-bg border border-archive-secondary/20 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-archive-heading focus:border-primary focus:ring-0 outline-none transition-colors cursor-pointer pr-8";

        const arrow = document.createElement("span");
        arrow.className = "material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-primary pointer-events-none text-base";
        arrow.textContent = "expand_more";

        options.forEach(opt => {
            const o = document.createElement("option");
            o.value = opt;
            o.textContent = opt === 'a-z' ? 'A-Z (Name)' : opt === 'z-a' ? 'Z-A (Name)' : opt;
            if (isSort && opt === 'a-z') o.selected = true;
            select.appendChild(o);
        });

        if (isSort) {
            select.onchange = (e) => {
                activeSort = e.target.value;
                applyFilters();
            };
        } else {
            activeFilters[labelText] = 'All';
            select.onchange = (e) => {
                const val = e.target.value;
                activeFilters[labelText] = val;
                // Update button visibility based on selection
                applyFilters();
            };
        }

        selectWrapper.appendChild(select);
        selectWrapper.appendChild(arrow);
        wrapper.appendChild(label);
        wrapper.appendChild(selectWrapper);
        container.appendChild(wrapper);
    }

    async function initializeFilters(container, filterDataAttr) {
        try {
            const filterGroups = JSON.parse(filterDataAttr.replace(/'/g, '"'));
            container.innerHTML = '';
            activeFilters = {};

            for (const [label, options] of Object.entries(filterGroups)) {
                if (typeof options === 'string' && options.endsWith('.json')) {
                    // Fetch dynamic options from JSON
                    try {
                        const response = await fetch(options);
                        const data = await response.json();
                        const dynamicOptions = ['All', ...data.map(item => item.title || item.name)];
                        createDropdown(container, label, dynamicOptions);
                    } catch (e) {
                        console.error(`Failed to fetch dynamic options for ${label}:`, e);
                        createDropdown(container, label, ['All']);
                    }
                } else {
                    createDropdown(container, label, options);
                }
            }

            // Always add Sort dropdown
            createDropdown(container, "Sort Order", ["a-z", "z-a"], true);

        } catch (err) {
            console.error("Failed to parse data-filters JSON:", err);
        }
    }

    document.addEventListener("componentLoaded", (e) => {
        if (e.detail.name === 'facet-bar') {
            const container = document.getElementById("filter-container");
            const filterDataAttr = e.detail.element.getAttribute("data-filters");
            const breadcrumbNav = document.getElementById("breadcrumb-nav");
            const currentEl = document.getElementById("breadcrumb-current");

            const customTitle = e.detail.element.getAttribute("data-title");

            if (customTitle && currentEl) {
                currentEl.textContent = customTitle;
                if (breadcrumbNav) breadcrumbNav.classList.remove("hidden");
                if (breadcrumbNav) breadcrumbNav.classList.add("md:flex");
            } else if (breadcrumbNav) {
                // If it's the home page or no title, typically we hide breadcrumbs
                breadcrumbNav.classList.add("hidden");
                breadcrumbNav.classList.remove("md:flex");
            }

            if (container && filterDataAttr) {
                initializeFilters(container, filterDataAttr);
            }

            // Handle Clear action
            const clearBtn = document.getElementById("clear-filters");
            if (clearBtn) {
                clearBtn.onclick = () => {
                    // Reset memory state
                    Object.keys(activeFilters).forEach(k => activeFilters[k] = 'All');
                    searchQuery = '';

                    // Reset UI dropdowns
                    const selects = container.querySelectorAll("select");
                    selects.forEach(s => {
                        // Only reset if it's a filter (has 'All' option)
                        const hasAll = Array.from(s.options).some(o => o.value === 'All');
                        if (hasAll) s.value = 'All';
                    });

                    applyFilters();
                };
            }
        }
    });

    // Re-apply filters/sort when cards are rendered
    document.addEventListener("componentLoaded", (e) => {
        if (e.detail.element.hasAttribute("data-data-source")) {
            setTimeout(applyFilters, 100);
        }
    });
})();
