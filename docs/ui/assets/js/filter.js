/**
 * Handles search, dynamic multi-dropdown filtering, and sorting logic for browse pages
 */
(function () {
    let activeFilters = {};
    let activeSort = 'all';
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
                const tags = (card.getAttribute("data-tags") || "").toLowerCase();
                const matchesSearch = tags.includes(searchQuery);

                const matchesAllFilters = Object.values(activeFilters).every(val => {
                    return val === 'All' || tags.includes(val.toLowerCase());
                });

                if (matchesSearch && matchesAllFilters) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });

            // 2. Sort
            if (activeSort !== 'all') {
                cards.sort((a, b) => {
                    const valA = a.getAttribute("data-title") || "";
                    const valB = b.getAttribute("data-title") || "";

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
            o.textContent = opt;
            if (isSort && opt === 'all') o.selected = true;
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
                activeFilters[labelText] = e.target.value;
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
            createDropdown(container, "Sort Order", ["all", "a-z", "z-a"], true);

        } catch (err) {
            console.error("Failed to parse data-filters JSON:", err);
        }
    }

    document.addEventListener("componentLoaded", (e) => {
        if (e.detail.name === 'facet-bar') {
            const container = document.getElementById("filter-container");
            const filterDataAttr = e.detail.element.getAttribute("data-filters");
            const customTitle = e.detail.element.getAttribute("data-title");

            if (customTitle) {
                const titleEl = document.getElementById("page-title");
                if (titleEl) titleEl.textContent = customTitle;
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
