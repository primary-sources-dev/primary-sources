/**
 * Global Search Engine
 * Collects data from all archive sources and provides a unified search interface.
 */
(function () {
    let allRecords = [];
    const searchInput = document.getElementById("global-search-input");
    const resultsContainer = document.getElementById("search-results");
    const placeholder = document.getElementById("search-placeholder");

    // List of data sources to search through
    const sources = [
        '/docs/ui/assets/data/events.json',
        '/docs/ui/assets/data/people.json',
        '/docs/ui/assets/data/organizations.json',
        '/docs/ui/assets/data/places.json',
        '/docs/ui/assets/data/objects.json',
        '/docs/ui/assets/data/sources.json'
    ];

    async function loadAllData() {
        try {
            const promises = sources.map(src => fetch(src).then(res => res.json()));
            const results = await Promise.all(promises);
            allRecords = results.flat();
            console.log(`Global Search ready with ${allRecords.length} records.`);
        } catch (err) {
            console.error("Failed to load archive data for global search:", err);
        }
    }

    function search(query) {
        if (!query || query.length < 2) {
            resultsContainer.innerHTML = '';
            resultsContainer.appendChild(placeholder);
            return;
        }

        const q = query.toLowerCase();

        // Use the same buildCard logic from db-logic.js (must be loaded in the page)
        // We look for any match in title, label, or body.
        const filtered = allRecords.filter(item => {
            const text = `${item.title} ${item.name} ${item.label} ${item.body} ${(item.tags || []).join(' ')}`.toLowerCase();
            return text.includes(q);
        });

        resultsContainer.innerHTML = '';

        if (filtered.length === 0) {
            resultsContainer.innerHTML = `
                <div class="col-span-full py-20 text-center opacity-30">
                    <p class="text-xs uppercase tracking-[0.3em]">No records found for "${query}"</p>
                </div>
            `;
            return;
        }

        filtered.forEach(item => {
            const cardHTML = typeof buildCard === 'function' ? buildCard(item) : `<div>${item.title}</div>`;
            const wrapper = document.createElement('div');
            wrapper.innerHTML = cardHTML.trim();
            resultsContainer.appendChild(wrapper.firstChild);
        });
    }

    // Initialize
    loadAllData();

    // Handle breadcrumb for Search page
    document.addEventListener("componentLoaded", (e) => {
        if (e.detail.name === 'header') {
            const breadcrumbNav = document.getElementById("breadcrumb-nav");
            const currentEl = document.getElementById("breadcrumb-current");
            if (breadcrumbNav && currentEl) {
                currentEl.textContent = "Search";
                breadcrumbNav.classList.remove("hidden");
                breadcrumbNav.classList.add("md:flex");
            }
        }
    });

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            search(e.target.value.trim());
        });
    }

})();
