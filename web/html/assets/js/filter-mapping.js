// File: assets/js/filter-mapping.js
// Filter label mapping system for UI to database code conversion

/**
 * Filter mappings for display labels to database codes
 */
const filterMappings = {
    'Witness Hierarchy': {
        'Primary Witness': 'PRIMARY_WITNESS',
        'Secondary Witness': 'SECONDARY_WITNESS',
        'Investigator': 'INVESTIGATOR',
        'Expert': 'EXPERT'
    },
    'Event Hierarchy': {
        'Main Events': 'CATEGORY_1',
        'Investigations': 'CATEGORY_2',
        'Documentation': 'CATEGORY_3'
    },
    'Event Level': {
        'Primary': 'PRIMARY',
        'Secondary': 'SECONDARY'
    }
};

/**
 * Map filter display value to database code
 * @param {string} filterKey - The filter category
 * @param {string} displayValue - The display value from UI
 * @returns {string} Database code or original value if no mapping found
 */
function mapFilterValue(filterKey, displayValue) {
    return filterMappings[filterKey]?.[displayValue] || displayValue;
}

/**
 * Get all available options for a filter
 * @param {string} filterKey - The filter category
 * @returns {Array} Array of display options
 */
function getFilterOptions(filterKey) {
    const mapping = filterMappings[filterKey];
    return mapping ? Object.keys(mapping) : [];
}

/**
 * Reverse map database code to display value
 * @param {string} filterKey - The filter category
 * @param {string} code - Database code
 * @returns {string} Display value or original code if no mapping found
 */
function mapCodeToDisplay(filterKey, code) {
    const mapping = filterMappings[filterKey];
    if (!mapping) return code;
    
    for (const [display, dbCode] of Object.entries(mapping)) {
        if (dbCode === code) {
            return display;
        }
    }
    return code;
}

/**
 * Validate filter value against allowed options
 * @param {string} filterKey - The filter category
 * @param {string} value - Value to validate
 * @returns {boolean} True if valid
 */
function isValidFilterValue(filterKey, value) {
    const options = getFilterOptions(filterKey);
    return options.includes(value) || value === 'All';
}

/**
 * Get filter metadata for debugging
 * @param {string} filterKey - The filter category
 * @returns {Object} Filter metadata
 */
function getFilterMetadata(filterKey) {
    return {
        key: filterKey,
        options: getFilterOptions(filterKey),
        mappings: filterMappings[filterKey] || {},
        hasMappings: !!filterMappings[filterKey]
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        filterMappings,
        mapFilterValue,
        getFilterOptions,
        mapCodeToDisplay,
        isValidFilterValue,
        getFilterMetadata
    };
}
