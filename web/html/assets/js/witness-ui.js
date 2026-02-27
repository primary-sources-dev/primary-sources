// File: assets/js/witness-ui.js
// UI enhancements for witness display with toggle functionality

/**
 * Enhanced witness display with "Show All Witnesses" toggle
 */
class WitnessUI {
    static MAX_VISIBLE_WITNESSES = 3;
    
    /**
     * Render witness list with toggle for long lists
     * @param {Array} witnesses - Array of witness objects
     * @param {string} containerId - Container element ID
     */
    static renderWitnessList(witnesses, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !witnesses || witnesses.length === 0) return;
        
        const hasMany = witnesses.length > this.MAX_VISIBLE_WITNESSES;
        const visible = hasMany ? witnesses.slice(0, this.MAX_VISIBLE_WITNESSES) : witnesses;
        
        let html = '<div class="witness-list">';
        
        // Render visible witnesses
        visible.forEach(witness => {
            html += this.renderWitnessCard(witness);
        });
        
        // Add toggle if many witnesses
        if (hasMany) {
            html += `
                <div class="witness-toggle-container mt-3">
                    <button onclick="WitnessUI.toggleAllWitnesses('${containerId}')" 
                            class="text-xs text-primary hover:text-archive-heading transition-colors">
                        Show All ${witnesses.length} Witnesses 
                        <span class="material-symbols-outlined text-xs">expand_more</span>
                    </button>
                </div>
            `;
        }
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    /**
     * Render individual witness card
     * @param {Object} witness - Witness object
     * @returns {string} HTML string
     */
    static renderWitnessCard(witness) {
        const hierarchyIcon = this.getHierarchyIcon(witness.witness_hierarchy);
        const credibilityColor = this.getCredibilityColor(witness.credibility);
        
        return `
            <div class="witness-card border border-archive-secondary/20 bg-[#252021]/60 p-3 mb-2">
                <div class="flex items-start gap-3">
                    <span class="material-symbols-outlined text-primary text-sm">${hierarchyIcon}</span>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-bold text-archive-heading">${witness.name}</span>
                            <span class="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                                ${witness.event_specific_role}
                            </span>
                        </div>
                        <div class="text-xs text-archive-secondary/60 mb-1">
                            ${witness.description}
                        </div>
                        <div class="flex items-center gap-2 text-xs">
                            <span class="text-archive-secondary/40">Credibility:</span>
                            <span class="${credibilityColor}">${witness.credibility}</span>
                            ${witness.agency ? `<span class="text-archive-secondary/40">• ${witness.agency}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Toggle showing all witnesses
     * @param {string} containerId - Container element ID
     */
    static toggleAllWitnesses(containerId) {
        const container = document.getElementById(containerId);
        const button = container.querySelector('.witness-toggle-container button');
        const witnessList = container.querySelector('.witness-list');
        
        if (!container || !button) return;
        
        const isExpanded = button.textContent.includes('Show Fewer');
        
        if (isExpanded) {
            // Collapse
            const witnesses = Array.from(witnessList.querySelectorAll('.witness-card'));
            witnesses.forEach((card, index) => {
                if (index >= this.MAX_VISIBLE_WITNESSES) {
                    card.style.display = 'none';
                }
            });
            button.innerHTML = `Show All ${witnesses.length} Witnesses <span class="material-symbols-outlined text-xs">expand_more</span>`;
        } else {
            // Expand
            const hiddenCards = witnessList.querySelectorAll('.witness-card[style*="display: none"]');
            hiddenCards.forEach(card => card.style.display = 'block');
            button.innerHTML = `Show Fewer <span class="material-symbols-outlined text-xs">expand_less</span>`;
        }
    }
    
    /**
     * Get icon for witness hierarchy
     * @param {string} hierarchy - Witness hierarchy code
     * @returns {string} Icon name
     */
    static getHierarchyIcon(hierarchy) {
        const icons = {
            'PRIMARY_WITNESS': 'person',
            'SECONDARY_WITNESS': 'person_outline',
            'INVESTIGATOR': 'search',
            'EXPERT': 'psychology'
        };
        return icons[hierarchy] || 'person';
    }
    
    /**
     * Get color for credibility rating
     * @param {string} credibility - Credibility rating
     * @returns {string} CSS class
     */
    static getCredibilityColor(credibility) {
        const colors = {
            'CONFIRMED': 'text-green-400',
            'DISPUTED': 'text-yellow-400',
            'UNKNOWN': 'text-archive-secondary/60'
        };
        return colors[credibility] || 'text-archive-secondary/60';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WitnessUI;
}
