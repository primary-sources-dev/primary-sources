/**
 * Handles search and filtering logic for browse pages
 */
document.addEventListener("componentLoaded", (e) => {
    if (e.detail.name === 'search-filter-bar') {
        const input = document.getElementById("search-input");
        if (input) {
            input.addEventListener("input", (event) => {
                const query = event.target.value.toLowerCase();
                const cards = document.querySelectorAll("[data-data-source] a");

                cards.forEach(card => {
                    const text = card.textContent.toLowerCase();
                    if (text.includes(query)) {
                        card.style.display = "flex";
                    } else {
                        card.style.display = "none";
                    }
                });
            });
        }
    }
});
