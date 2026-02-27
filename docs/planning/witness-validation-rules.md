# Witness Hierarchy Validation Rules

## Overview
This document defines the validation rules and constraints for the witness hierarchy system to ensure data integrity and consistency across the Primary Sources:JFK archive.

## Required Field Validation

### Witnesses Array
- Every event may have a `witnesses` array
- If present, must be an array (not null or object)
- Empty arrays are valid
- All witnesses in array must pass individual validation

### Individual Witness Fields
```json
{
  "name": "required (string, non-empty)",
  "role": "required (string, non-empty)",
  "witness_hierarchy": "required (controlled vocabulary)",
  "event_specific_role": "required (string, non-empty)"
}
```

## Controlled Vocabulary Validation

### Witness Hierarchy Values
- `PRIMARY_WITNESS`: Directly experienced the event
- `SECONDARY_WITNESS`: Learned about the event from others
- `INVESTIGATOR`: Official investigation role
- `EXPERT`: Specialist analysis role

### Credibility Values (Optional)
- `CONFIRMED`: Verified information
- `DISPUTED`: Contested or questionable
- `UNKNOWN`: Default when not specified

## Business Logic Validation

### Hierarchy Consistency
- PRIMARY_WITNESS should have direct experience description
- INVESTIGATOR should have agency information
- EXPERT should have specialization details
- SECONDARY_WITNESS should have relationship information

### Event Type Constraints
- CATEGORY_2 events should have at least one PRIMARY_WITNESS
- CATEGORY_3 events may have INVESTIGATOR or EXPERT witnesses
- CATEGORY_1 events typically have multiple witness types

### Role Mapping Validation
- "FBI Agent" must map to "INVESTIGATOR" hierarchy
- "Witness" should map to "PRIMARY_WITNESS" hierarchy
- "Relative" should map to "SECONDARY_WITNESS" hierarchy
- "Expert" must map to "EXPERT" hierarchy

## Data Format Validation

### String Fields
- All string fields must be trimmed of whitespace
- Empty strings are invalid for required fields
- Maximum length: 255 characters for most fields

### Contact Information
- Phone numbers: optional, format validation recommended
- Addresses: optional, free-form text allowed

### Timestamp Validation
- Not applicable to witness data (event-level only)

## Cross-Reference Validation

### Name Consistency
- Witness names should be consistent across events
- Consider person entity cross-referencing
- Alias handling for name variations

### Agency Validation
- Agency names should match organization vocabulary
- FBI, CIA, DPD, etc. should be standardized

## Migration Validation

### Legacy Participants
- All participants should be migrated to witnesses
- Empty participants array after migration
- No orphaned participant data

### Data Integrity
- Migration should preserve all original information
- Role mapping should be deterministic
- No data loss during migration

## Error Handling

### Validation Errors
- Missing required fields
- Invalid hierarchy values
- Incorrect data types
- Format violations

### Warning Conditions
- Missing optional but recommended fields
- Inconsistent naming conventions
- Potential data quality issues

## Performance Considerations

### Validation Overhead
- Database-level validation for critical constraints
- Application-level validation for business rules
- Client-side validation for user input

### Index Optimization
- Index on witness_hierarchy for filtering
- Index on witness names for search
- Consider composite indexes for common queries

## Testing Requirements

### Unit Tests
- Field validation functions
- Vocabulary compliance checks
- Business logic validation

### Integration Tests
- End-to-end validation workflows
- Migration script validation
- UI validation feedback

### Data Quality Tests
- Sample data validation
- Edge case handling
- Performance impact assessment

## Maintenance Guidelines

### Adding New Hierarchy Levels
1. Update controlled vocabulary
2. Modify validation rules
3. Update UI components
4. Test migration scenarios

### Updating Role Mappings
1. Review existing mappings
2. Update mapping logic
3. Validate data consistency
4. Update documentation

### Schema Evolution
1. Maintain backward compatibility
2. Provide migration paths
3. Update validation rules
4. Communicate changes

## Troubleshooting

### Common Validation Failures
- Missing required fields
- Invalid hierarchy codes
- Incorrect data types
- Format violations

### Debug Steps
1. Check validation logs
2. Review data structure
3. Verify vocabulary compliance
4. Test individual components

### Recovery Procedures
1. Identify root cause
2. Fix data issues
3. Re-run validation
4. Verify fixes
