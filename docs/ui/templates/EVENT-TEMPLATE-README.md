# Event Template Documentation

## Overview
This document describes the event template structure, data schema, and implementation details for the Primary Sources:JFK archive.

## File Structure

### Core Files
- `assets/data/events.json` - Event data structure
- `entities/event/event-index.html` - Event browsing interface
- `entities/event/event-details.html` - Individual event detail pages
- `assets/js/db-logic.js` - Event rendering and filtering logic

## Event Schema

### Required Fields
```json
{
  "id": "string (unique slug)",
  "event_id": "string (UUID)",
  "event_type": "SIGHTING|SHOT|TRANSFER|INTERVIEW|REPORT_WRITTEN|PHONE_CALL|EMPLOYMENT|MEETING",
  "event_level": "PRIMARY|SECONDARY",
  "event_hierarchy": "CATEGORY_1|CATEGORY_2|CATEGORY_3",
  "title": "string (concise title)",
  "description": "string (detailed narrative)",
  "start_ts": "string (ISO 8601 timestamp)",
  "time_precision": "EXACT|APPROX|RANGE|UNKNOWN"
}
```

### Optional Fields
```json
{
  "icon": "string (Material Symbol name)",
  "label": "string (short summary)",
  "location": "string",
  "context": "string (background information)",
  "featured": "boolean",
  "is_conflict": "boolean",
  "end_ts": "string (ISO 8601 timestamp)",
  "status": "string",
  "url": "string (document link)",
  "parent_event_id": "string (UUID for sub-events)",
  "sub_events": "array (nested events)",
  "witnesses": "array (witness hierarchy data)",
  "participants": "array (legacy, should be empty)",
  "evidence": "array",
  "sources": "array",
  "locations": "array",
  "related_events": "array",
  "assertions": "array",
  "media": "array"
}
```

## Witness Hierarchy System

### Structure
```json
{
  "witnesses": [
    {
      "name": "string (required)",
      "role": "string (required)",
      "witness_hierarchy": "PRIMARY_WITNESS|SECONDARY_WITNESS|INVESTIGATOR|EXPERT (required)",
      "event_specific_role": "string (required)",
      "description": "string (optional)",
      "credibility": "CONFIRMED|DISPUTED|UNKNOWN (optional)",
      "contact_info": {
        "phone": "string",
        "address": "string"
      },
      "relationship_to_primary": "string",
      "agency": "string"
    }
  ]
}
```

### Hierarchy Definitions
- **PRIMARY_WITNESS**: Directly experienced the event
- **SECONDARY_WITNESS**: Learned about the event from others
- **INVESTIGATOR**: Official investigation role
- **EXPERT**: Specialist analysis role

## Event Hierarchy Categories

### CATEGORY_1: Main Political Violence Events
- Walker Incident
- JFK Assassination
- Tippit Murder
- Oswald Murder

### CATEGORY_2: Direct Investigations
- Witness events (sightings, reports)
- Direct investigation activities
- Primary witness testimony

### CATEGORY_3: Documentation & Reports
- Interviews
- Written reports
- Phone calls
- Secondary documentation

## Event Levels

### PRIMARY
- What actually happened
- Direct observations
- Core events

### SECONDARY
- Documentation about primary events
- Reports and interviews
- Analysis and commentary

## Implementation Details

### Card Rendering
- Events rendered as cards in grid layout
- Witness information displayed in cards
- Hierarchy badges and counts shown
- Search includes witness data

### Filtering System
- Event hierarchy filtering
- Event level filtering
- Event type filtering
- Witness hierarchy filtering
- Facet bar with dropdown filters

### Data Validation
- Required field validation
- Vocabulary compliance
- Timestamp format validation
- Witness hierarchy validation

## Migration Notes

### From Participants to Witnesses
- Legacy `participants` array replaced with `witnesses`
- Automatic role mapping applied
- Backward compatibility maintained
- Migration scripts available

### Data Integrity
- All events must have proper hierarchy
- Witnesses must have required fields
- Validation enforced at database level
- UI validation for user input

## UI Components

### Event Cards
- Display title, description, date, location
- Show witness count and hierarchy badges
- Visual indicators for featured events
- Responsive grid layout

### Detail Pages
- Complete event information
- Witness list with toggle functionality
- Related events and evidence
- Source documents and assertions

### Filtering Interface
- Facet bar with multiple filter options
- Real-time filtering
- Clear filters functionality
- Filter state persistence

## Performance Considerations

### Data Loading
- Skeleton loading states
- Progressive rendering
- Efficient filtering algorithms
- Optimized search indexing

### UI Optimization
- Lazy loading for large datasets
- Efficient DOM manipulation
- Minimal re-rendering
- Responsive design patterns

## Maintenance Guidelines

### Adding New Events
1. Follow schema requirements
2. Assign appropriate hierarchy
3. Include witness data
4. Validate vocabulary compliance
5. Test UI display

### Updating Existing Events
1. Maintain data integrity
2. Update witness hierarchy as needed
3. Verify filter functionality
4. Test search functionality
5. Update documentation

## Troubleshooting

### Common Issues
- Missing required fields
- Invalid hierarchy values
- Incorrect timestamp format
- Broken witness relationships

### Debug Steps
1. Check schema validation
2. Verify vocabulary compliance
3. Test filtering functionality
4. Review UI rendering
5. Check data migration status
