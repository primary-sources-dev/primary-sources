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
            // Remove existing group headers
            container.querySelectorAll(".group-header").forEach(h => h.remove());

            const cards = Array.from(container.querySelectorAll("a"));
            const isEventFiltered = activeFilters['Event'] && activeFilters['Event'] !== 'All';

            // 1. Filter
            cards.forEach(card => {
                const searchIndex = (card.getAttribute("data-search-index") || "").toLowerCase();
                const filterTags = (card.getAttribute("data-filter-tags") || "").toLowerCase().split('|');

                const matchesSearch = searchIndex.includes(searchQuery);

                const matchesAllFilters = Object.values(activeFilters).every(val => {
                    if (val === 'All') return true;
                    return filterTags.includes(val.toLowerCase());
                });

                if (matchesSearch && matchesAllFilters) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });

            // 2. Sort / Group
            if (isEventFiltered) {
                // When event is filtered, sort by Org then Title
                cards.sort((a, b) => {
                    const orgA = (a.getAttribute("data-org") || "Independent").toLowerCase();
                    const orgB = (b.getAttribute("data-org") || "Independent").toLowerCase();
                    if (orgA !== orgB) return orgA.localeCompare(orgB);

                    const titleA = (a.getAttribute("data-title") || "").toLowerCase();
                    const titleB = (b.getAttribute("data-title") || "").toLowerCase();
                    return titleA.localeCompare(titleB);
                });
            } else if (activeSort === 'a-z' || activeSort === 'z-a') {
                cards.sort((a, b) => {
                    const valA = (a.getAttribute("data-title") || "").toLowerCase();
                    const valB = (b.getAttribute("data-title") || "").toLowerCase();
                    return activeSort === 'z-a' ? valB.localeCompare(valA) : valA.localeCompare(valB);
                });
            } else if (activeSort === 'chrono-asc' || activeSort === 'chrono-desc') {
                cards.sort((a, b) => {
                    const valA = a.getAttribute("data-date") || "";
                    const valB = b.getAttribute("data-date") || "";
                    // Push entries without dates to the end
                    if (!valA && !valB) return 0;
                    if (!valA) return 1;
                    if (!valB) return -1;
                    return activeSort === 'chrono-desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
                });
            }

            // 3. Re-append in sorted order and add Headers if event filtered
            let lastOrg = null;
            cards.forEach(card => {
                if (isEventFiltered && card.style.display !== 'none') {
                    const currentOrg = card.getAttribute("data-org") || "Independent";
                    if (currentOrg !== lastOrg) {
                        const header = document.createElement("div");
                        header.className = "group-header col-span-full border-b border-primary/30 mt-8 mb-4 pb-1";
                        header.innerHTML = `<span class="text-[11px] font-bold text-primary uppercase tracking-[0.3em] font-display">${currentOrg}</span>`;
                        container.appendChild(header);
                        lastOrg = currentOrg;
                    }
                }
                container.appendChild(card);
            });

            // 4. Update Main Heading if filtered
            const pageHeader = document.querySelector("main h2, main h3");
            if (pageHeader) {
                const activeFilterValue = Object.entries(activeFilters).find(([k, v]) => v !== 'All');
                const baseTitle = document.querySelector("[data-component='facet-bar']")?.getAttribute("data-title") || "Browse";

                if (activeFilterValue) {
                    pageHeader.textContent = `${baseTitle}: ${activeFilterValue[1]}`;
                } else if (searchQuery) {
                    pageHeader.textContent = `${baseTitle}: "${searchQuery}"`;
                } else {
                    const defaultTitle = container.getAttribute("data-default-title") || baseTitle;
                    pageHeader.textContent = defaultTitle;
                }
            }
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
            if (opt === 'a-z') o.textContent = 'A-Z (Name)';
            else if (opt === 'z-a') o.textContent = 'Z-A (Name)';
            else if (opt === 'chrono-asc') o.textContent = 'Date (Oldest First)';
            else if (opt === 'chrono-desc') o.textContent = 'Date (Newest First)';
            else o.textContent = opt;

            if (isSort && opt === activeSort) o.selected = true;
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

    async function initializeFilters(container, filterDataAttr, customTitle) {
        try {
            let filterGroups;
            try {
                filterGroups = JSON.parse(filterDataAttr);
            } catch (e) {
                filterGroups = JSON.parse(filterDataAttr.replace(/'/g, '"'));
            }
            container.innerHTML = '';
            activeFilters = {};

            for (const [label, options] of Object.entries(filterGroups)) {
                if (typeof options === 'string' && options.endsWith('.json')) {
                    // Fetch dynamic options from JSON
                    try {
                        const response = await fetch(options);
                        const data = await response.json();

                        let filteredData = data;
                        // For events, only show top-level (parent) events in the filter dropdown
                        if (options.includes('events.json')) {
                            filteredData = data.filter(item => !item.parent_event_id);
                        }

                        const dynamicOptions = ['All', ...filteredData.map(item => item.title || item.name)];
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
            const sortOptions = ["a-z", "z-a"];
            const isEvents = customTitle === "Events" || filterDataAttr.includes("events.json");
            
            if (isEvents) {
                sortOptions.unshift("chrono-asc", "chrono-desc");
                activeSort = 'chrono-asc';
            }

            createDropdown(container, "Sort Order", sortOptions, true);
            
            // Apply immediately after setup
            applyFilters();

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
                initializeFilters(container, filterDataAttr, customTitle);
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
    document.addEventListener("entitiesRendered", () => {
        applyFilters();
    });

    document.addEventListener("componentLoaded", (e) => {
        if (e.detail.element.hasAttribute("data-data-source")) {
            setTimeout(applyFilters, 100);
        }
    });
})();
