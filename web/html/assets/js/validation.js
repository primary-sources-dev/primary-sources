// File: assets/js/validation.js
// Validation framework for witness data

/**
 * Witness validation rules and constraints
 */
const witnessValidation = {
    required: ['name', 'role', 'witness_hierarchy', 'event_specific_role'],
    constraints: {
        'witness_hierarchy': ['PRIMARY_WITNESS', 'SECONDARY_WITNESS', 'INVESTIGATOR', 'EXPERT'],
        'credibility': ['CONFIRMED', 'DISPUTED', 'UNKNOWN']
    },
    
    /**
     * Validate a single witness object
     * @param {Object} witness - Witness object to validate
     * @returns {Array} Array of validation errors
     */
    validate: function(witness) {
        const errors = [];
        
        // Check required fields
        this.required.forEach(field => {
            if (!witness[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        });
        
        // Validate witness_hierarchy constraints
        if (this.constraints.witness_hierarchy && witness.witness_hierarchy && 
            !this.constraints.witness_hierarchy.includes(witness.witness_hierarchy)) {
            errors.push(`Invalid witness_hierarchy: ${witness.witness_hierarchy}`);
        }
        
        // Validate credibility constraints
        if (witness.credibility && this.constraints.credibility && 
            !this.constraints.credibility.includes(witness.credibility)) {
            errors.push(`Invalid credibility: ${witness.credibility}`);
        }
        
        return errors;
    },
    
    /**
     * Validate all witnesses in an event
     * @param {Array} witnesses - Array of witness objects
     * @returns {Object} Validation result with errors and valid status
     */
    validateWitnesses: function(witnesses) {
        const result = {
            isValid: true,
            errors: [],
            witnessErrors: {}
        };
        
        if (!witnesses || witnesses.length === 0) {
            return result; // Empty array is valid
        }
        
        witnesses.forEach((witness, index) => {
            const witnessErrors = this.validate(witness);
            if (witnessErrors.length > 0) {
                result.isValid = false;
                result.errors.push(`Witness ${index + 1}: ${witnessErrors.join(', ')}`);
                result.witnessErrors[index] = witnessErrors;
            }
        });
        
        return result;
    },
    
    /**
     * Validate event witness data integrity
     * @param {Object} event - Event object with witnesses
     * @returns {Object} Validation result
     */
    validateEventWitnesses: function(event) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        
        // Check if event has witnesses array
        if (!event.witnesses) {
            result.warnings.push('No witnesses array found in event');
            return result;
        }
        
        // Validate witnesses array structure
        if (!Array.isArray(event.witnesses)) {
            result.isValid = false;
            result.errors.push('Witnesses must be an array');
            return result;
        }
        
        // Validate each witness
        const witnessValidation = this.validateWitnesses(event.witnesses);
        if (!witnessValidation.isValid) {
            result.isValid = false;
            result.errors = result.errors.concat(witnessValidation.errors);
        }
        
        // Check for at least one primary witness in direct witness events
        if (event.event_hierarchy === 'CATEGORY_2' && event.event_level === 'PRIMARY') {
            const primaryWitnesses = event.witnesses.filter(w => w.witness_hierarchy === 'PRIMARY_WITNESS');
            if (primaryWitnesses.length === 0) {
                result.warnings.push('CATEGORY_2 events should have at least one PRIMARY_WITNESS');
            }
        }
        
        return result;
    },
    
    /**
     * Sanitize witness data
     * @param {Object} witness - Witness object to sanitize
     * @returns {Object} Sanitized witness object
     */
    sanitize: function(witness) {
        const sanitized = { ...witness };
        
        // Trim string fields
        ['name', 'role', 'event_specific_role', 'description'].forEach(field => {
            if (sanitized[field] && typeof sanitized[field] === 'string') {
                sanitized[field] = sanitized[field].trim();
            }
        });
        
        // Ensure credibility has default value
        if (!sanitized.credibility) {
            sanitized.credibility = 'UNKNOWN';
        }
        
        return sanitized;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = witnessValidation;
}
