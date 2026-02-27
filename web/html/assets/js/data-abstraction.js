// File: assets/js/data-abstraction.js
// Data abstraction layer for consistent witness data handling

/**
 * Data abstraction class for witness data normalization
 */
class DataAbstraction {
    /**
     * Get normalized witness data from event
     * @param {Object} event - Event object
     * @returns {Object} Normalized witness data
     */
    static getWitnessData(event) {
        // Normalize witness data regardless of source
        const witnesses = event.witnesses || this.migrateParticipants(event.participants);
        
        return {
            witnesses: this.normalizeWitnesses(witnesses),
            hierarchy: this.determineHierarchy(witnesses),
            primaryWitness: this.findPrimaryWitness(witnesses),
            witnessCount: witnesses.length,
            investigatorCount: this.countByHierarchy(witnesses, 'INVESTIGATOR'),
            expertCount: this.countByHierarchy(witnesses, 'EXPERT'),
            secondaryWitnessCount: this.countByHierarchy(witnesses, 'SECONDARY_WITNESS')
        };
    }
    
    /**
     * Migrate legacy participants to witnesses format
     * @param {Array} participants - Legacy participants array
     * @returns {Array} Normalized witnesses array
     */
    static migrateParticipants(participants) {
        if (!participants || participants.length === 0) {
            return [];
        }
        
        return participants.map(p => ({
            name: p.name,
            role: p.role,
            witness_hierarchy: this.determineWitnessHierarchy(p.name, {}, p.role),
            event_specific_role: this.determineEventSpecificRole(p),
            description: p.description,
            credibility: p.credibility || 'UNKNOWN'
        }));
    }
    
    /**
     * Normalize witnesses array format
     * @param {Array} witnesses - Witnesses array
     * @returns {Array} Normalized witnesses
     */
    static normalizeWitnesses(witnesses) {
        if (!witnesses || witnesses.length === 0) {
            return [];
        }
        
        return witnesses.map(w => ({
            name: w.name,
            role: w.role,
            witness_hierarchy: w.witness_hierarchy || 'SECONDARY_WITNESS',
            event_specific_role: w.event_specific_role || w.role,
            description: w.description,
            credibility: w.credibility || 'UNKNOWN',
            contact_info: w.contact_info || {},
            relationship_to_primary: w.relationship_to_primary,
            agency: w.agency
        }));
    }
    
    /**
     * Determine hierarchy from witnesses array
     * @param {Array} witnesses - Witnesses array
     * @returns {Object} Hierarchy summary
     */
    static determineHierarchy(witnesses) {
        const hierarchy = {
            PRIMARY_WITNESS: 0,
            SECONDARY_WITNESS: 0,
            INVESTIGATOR: 0,
            EXPERT: 0
        };
        
        witnesses.forEach(w => {
            if (hierarchy[w.witness_hierarchy] !== undefined) {
                hierarchy[w.witness_hierarchy]++;
            }
        });
        
        return hierarchy;
    }
    
    /**
     * Find primary witness in witnesses array
     * @param {Array} witnesses - Witnesses array
     * @returns {Object|null} Primary witness or null
     */
    static findPrimaryWitness(witnesses) {
        if (!witnesses || witnesses.length === 0) {
            return null;
        }
        
        return witnesses.find(w => w.witness_hierarchy === 'PRIMARY_WITNESS') || null;
    }
    
    /**
     * Count witnesses by hierarchy type
     * @param {Array} witnesses - Witnesses array
     * @param {string} hierarchy - Hierarchy type
     * @returns {number} Count
     */
    static countByHierarchy(witnesses, hierarchy) {
        if (!witnesses || witnesses.length === 0) {
            return 0;
        }
        
        return witnesses.filter(w => w.witness_hierarchy === hierarchy).length;
    }
    
    /**
     * Determine witness hierarchy (simplified version)
     * @param {string} name - Person name
     * @param {Object} event - Event context
     * @param {string} role - Person role
     * @returns {string} Hierarchy code
     */
    static determineWitnessHierarchy(name, event, role) {
        // Import logic from witness-logic.js if available
        if (typeof determineWitnessHierarchy === 'function') {
            return determineWitnessHierarchy(name, event, role);
        }
        
        // Fallback logic
        if (role.includes('FBI') || role.includes('Agent') || role.includes('SA ')) {
            return 'INVESTIGATOR';
        }
        if (role.includes('Witness')) {
            return 'PRIMARY_WITNESS';
        }
        if (role.includes('Examiner') || role.includes('Expert') || role.includes('Analyst')) {
            return 'EXPERT';
        }
        return 'SECONDARY_WITNESS';
    }
    
    /**
     * Determine event-specific role (simplified version)
     * @param {Object} person - Person object
     * @returns {string} Event-specific role
     */
    static determineEventSpecificRole(person) {
        // Import logic from witness-logic.js if available
        if (typeof determineEventSpecificRole === 'function') {
            return determineEventSpecificRole(person, {});
        }
        
        // Fallback logic
        const roleMappings = {
            'FBI Agent': 'Lead Investigator',
            'Witness': 'Reporting Witness',
            'Relative': 'Family Witness',
            'Family': 'Family Witness',
            'Examiner': 'Expert Analyst'
        };
        
        for (const [genericRole, specificRole] of Object.entries(roleMappings)) {
            if (person.role && person.role.includes(genericRole)) {
                return specificRole;
            }
        }
        
        return person.role || 'Unknown';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataAbstraction;
}
