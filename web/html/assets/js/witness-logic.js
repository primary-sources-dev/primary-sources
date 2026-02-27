// File: assets/js/witness-logic.js
// Enhanced witness hierarchy determination logic

/**
 * Determine witness hierarchy based on multi-factor analysis
 * @param {string} person - Person's name
 * @param {Object} event - Event object
 * @param {string} role - Person's role
 * @param {Object} context - Additional context
 * @returns {string} Witness hierarchy code
 */
function determineWitnessHierarchy(person, event, role, context = {}) {
    // Multi-factor analysis with event context
    const factors = {
        directExperience: isDirectWitness(person, event),
        officialRole: isOfficialInvestigator(role),
        expertise: hasSpecialExpertise(role),
        informationSource: getInformationSource(person, event)
    };
    
    // Apply precedence rules
    if (factors.directExperience) return 'PRIMARY_WITNESS';
    if (factors.officialRole) return 'INVESTIGATOR';
    if (factors.expertise) return 'EXPERT';
    return 'SECONDARY_WITNESS';
}

/**
 * Check if person is a direct witness to the event
 * @param {string} person - Person's name
 * @param {Object} event - Event object
 * @returns {boolean} True if direct witness
 */
function isDirectWitness(person, event) {
    // Check if person is in witnesses array with Witness role
    if (event.witnesses && event.witnesses.some(w => 
        w.name === person && w.event_specific_role && w.event_specific_role.includes('Witness')
    )) {
        return true;
    }
    
    // Check legacy participants for backward compatibility
    if (event.participants && event.participants.some(p => 
        p.name === person && p.role && p.role.includes('Witness')
    )) {
        return true;
    }
    
    return false;
}

/**
 * Check if role indicates official investigator
 * @param {string} role - Person's role
 * @returns {boolean} True if official investigator
 */
function isOfficialInvestigator(role) {
    const investigatorRoles = [
        'FBI Agent', 'Police', 'Detective', 'SA ', 'Special Agent',
        'FBI Special Agent', 'Dallas Police', 'Investigator'
    ];
    return investigatorRoles.some(ir => role.includes(ir));
}

/**
 * Check if role indicates special expertise
 * @param {string} role - Person's role
 * @returns {boolean} True if has special expertise
 */
function hasSpecialExpertise(role) {
    const expertRoles = [
        'Examiner', 'Analyst', 'Expert', 'Specialist',
        'Medical Examiner', 'Ballistics Expert', 'Forensic Analyst'
    ];
    return expertRoles.some(er => role.includes(er));
}

/**
 * Determine how person learned about the event
 * @param {string} person - Person's name
 * @param {Object} event - Event object
 * @returns {string} Information source type
 */
function getInformationSource(person, event) {
    // Check if person is in witnesses array
    if (event.witnesses && event.witnesses.some(w => w.name === person)) {
        const witness = event.witnesses.find(w => w.name === person);
        if (witness.witness_hierarchy === 'PRIMARY_WITNESS') {
            return 'DIRECT';
        }
    }
    
    // Check legacy participants for backward compatibility
    if (event.participants && event.participants.some(p => p.name === person)) {
        const participant = event.participants.find(p => p.name === person);
        if (participant && participant.role && participant.role.includes('Witness')) {
            return 'DIRECT';
        }
    }
    
    return 'SECONDARY';
}

/**
 * Determine event-specific role from generic role
 * @param {Object} person - Person object with role
 * @param {Object} event - Event context
 * @returns {string} Event-specific role
 */
function determineEventSpecificRole(person, event) {
    const roleMappings = {
        'FBI Agent': 'Lead Investigator',
        'FBI Special Agent': 'Lead Investigator',
        'SA ': 'Lead Investigator',
        'Special Agent': 'Lead Investigator',
        'Witness': 'Reporting Witness',
        'Relative': 'Family Witness',
        'Family': 'Family Witness',
        'Examiner': 'Expert Analyst',
        'Analyst': 'Expert Analyst',
        'Expert': 'Subject Matter Expert',
        'Medical Examiner': 'Medical Expert',
        'Ballistics Expert': 'Ballistics Expert'
    };
    
    // Find matching role mapping
    for (const [genericRole, specificRole] of Object.entries(roleMappings)) {
        if (person.role && person.role.includes(genericRole)) {
            return specificRole;
        }
    }
    
    // Return original role if no mapping found
    return person.role || 'Unknown';
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        determineWitnessHierarchy,
        isDirectWitness,
        isOfficialInvestigator,
        hasSpecialExpertise,
        getInformationSource,
        determineEventSpecificRole
    };
}
