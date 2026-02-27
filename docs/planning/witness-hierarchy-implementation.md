---
description: Witness Hierarchy Implementation Plan - Phased Approach
---

# Witness Hierarchy Implementation Plan

## **🎯 Overview**
Implement deterministic witness categorization based on event-specific roles, creating a hierarchy from primary witnesses through secondary witnesses, investigators, to experts.

## **🏗️ Architecture Strategy**

### **Data Architecture**
- **Development Source**: events.json (for rapid iteration)
- **Production Source**: PostgreSQL (for data integrity)
- **Sync Strategy**: JSON → PostgreSQL migration
- **API Layer**: Single source abstraction for both formats

### **Integration Approach**
```javascript
// Data abstraction layer
function getWitnessData(event) {
  // Returns consistent format regardless of source
  return {
    witnesses: normalizeWitnesses(event.witnesses || event.participants),
    hierarchy: determineWitnessHierarchy(event)
  };
}
```

## **📋 Implementation Phases**

### **Phase 1: Schema & Vocabulary Foundation**

#### **1.1 Add Witness Hierarchy Vocabulary**
```sql
-- File: 009_witness_hierarchy.sql
create table if not exists v_witness_hierarchy (
  code text primary key, 
  label text not null
);

insert into v_witness_hierarchy values
  ('PRIMARY_WITNESS', 'Primary Witness - Directly experienced the event'),
  ('SECONDARY_WITNESS', 'Secondary Witness - Learned about the event from others'),
  ('INVESTIGATOR', 'Investigator - Official investigation role'),
  ('EXPERT', 'Expert - Specialist analysis role')
on conflict (code) do nothing;

-- Add witness_hierarchy column to event table
alter table event 
add column if not exists witness_hierarchy text 
references v_witness_hierarchy(code);
```

#### **1.2 Update Vocabulary Seed**
```sql
-- File: 002_seed_vocab.sql (add to existing)
-- 1.3. Witness hierarchy
insert into v_witness_hierarchy values
  ('PRIMARY_WITNESS', 'Primary Witness - Directly experienced the event'),
  ('SECONDARY_WITNESS', 'Secondary Witness - Learned about the event from others'),
  ('INVESTIGATOR', 'Investigator - Official investigation role'),
  ('EXPERT', 'Expert - Specialist analysis role')
on conflict (code) do nothing;
```

#### **1.3 Add Witnesses Array to Event Schema**
```sql
-- File: 010_witnesses_array.sql
alter table event 
add column if not exists witnesses jsonb;
```

#### **1.4 Add Validation Framework**
```sql
-- File: 011_witness_validation.sql
-- Add constraints for witness data integrity
alter table event 
add constraint if not exists chk_witnesses_json 
check (witnesses is null or jsonb_typeof(witnesses) = 'array');

-- Add validation function
create or replace function validate_witness_data(witnesses jsonb) 
returns boolean as $$
begin
  -- Validation logic for witness array
  return true;
end;
$$ language plpgsql;
```

### **Phase 2: Data Structure & Migration**

#### **2.1 Update events.json Structure**
```json
{
  "id": "yates-incident",
  "event_type": "SIGHTING",
  "event_hierarchy": "CATEGORY_2",
  "event_level": "PRIMARY",
  "witnesses": [
    {
      "name": "Ralph Leon Yates",
      "role": "PRIMARY_WITNESS",
      "witness_hierarchy": "PRIMARY_WITNESS",
      "event_specific_role": "Reporting Witness",
      "description": "Refrigeration mechanic who reported hitchhiker sighting",
      "credibility": "DISPUTED",
      "contact_info": {
        "phone": "unknown",
        "address": "Dallas, TX"
      }
    },
    {
      "name": "J.O. Smith",
      "role": "SECONDARY_WITNESS",
      "witness_hierarchy": "SECONDARY_WITNESS", 
      "event_specific_role": "Family Witness",
      "description": "Yates' uncle who accompanied him to FBI office",
      "relationship_to_primary": "Uncle of Ralph Yates"
    },
    {
      "name": "SA Arthur Carter",
      "role": "INVESTIGATOR",
      "witness_hierarchy": "INVESTIGATOR",
      "event_specific_role": "Lead Investigator",
      "description": "FBI Special Agent conducting Yates interviews",
      "agency": "FBI Dallas Office"
    }
  ],
  "participants": []  // Keep for backward compatibility
}
```

#### **2.2 Complete Migration Script**
```sql
-- File: 012_witness_data_migration.sql
-- Migrate participants to witnesses array with hierarchy classification

-- Migration function
create or replace function migrate_participants_to_witnesses()
returns void as $$
declare
  event_record record;
  witness_array jsonb;
begin
  for event_record in select * from event loop
    -- Build witnesses array from participants
    witness_array := build_witnesses_from_participants(event_record.participants);
    
    -- Update event with new witnesses data
    update event 
    set witnesses = witness_array
    where id = event_record.id;
  end loop;
end;
$$ language plpgsql;

-- Execute migration
select migrate_participants_to_witnesses();
```

#### **2.3 Enhanced Role Determination Logic**
```javascript
// File: assets/js/witness-logic.js
function determineWitnessHierarchy(person, event, role, context) {
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

function isDirectWitness(person, event) {
  return event.witnesses && event.witnesses.some(w => 
    w.name === person && w.event_specific_role.includes('Witness')
  );
}

function isOfficialInvestigator(role) {
  const investigatorRoles = ['FBI Agent', 'Police', 'Detective', 'SA ', 'Special Agent'];
  return investigatorRoles.some(ir => role.includes(ir));
}

function hasSpecialExpertise(role) {
  const expertRoles = ['Examiner', 'Analyst', 'Expert', 'Specialist'];
  return expertRoles.some(er => role.includes(er));
}
```

### **Phase 3: JavaScript Implementation**

#### **3.1 Update buildCard Function**
```javascript
// In db-logic.js
function buildCard(item) {
  // ... existing code ...
  
  // Add witness information to search index
  const witnessInfo = item.witnesses ? item.witnesses.map(w => 
    `${w.name} ${w.role} ${w.event_specific_role}`
  ).join(' ') : '';
  
  const searchIndex = [
    item.label,
    item.title,
    item.name,
    item.description,
    item.notes,
    item.body,
    witnessInfo,
    ...(item.tags || [])
  ].filter(Boolean).join(' ').toLowerCase();
  
  // ... rest of function
}
```

#### **3.2 Add Witness Filtering Logic**
```javascript
// In db-logic.js, add witness hierarchy filtering
if (dataSource === 'events' && filterKey === 'Witness Hierarchy') {
  if (filterValue && filterValue !== 'All') {
    filteredData = filteredData.filter(item => 
      item.witnesses && item.witnesses.some(w => w.witness_hierarchy === filterValue)
    );
  }
}
```

#### **3.3 Add Data Abstraction Layer**
```javascript
// File: assets/js/data-abstraction.js
class DataAbstraction {
  static getWitnessData(event) {
    // Normalize witness data regardless of source
    const witnesses = event.witnesses || this.migrateParticipants(event.participants);
    return {
      witnesses: this.normalizeWitnesses(witnesses),
      hierarchy: this.determineHierarchy(witnesses),
      primaryWitness: this.findPrimaryWitness(witnesses),
      witnessCount: witnesses.length
    };
  }
  
  static normalizeWitnesses(participants) {
    return participants.map(p => ({
      name: p.name,
      role: p.role,
      witness_hierarchy: determineWitnessHierarchy(p.name, event, p.role),
      event_specific_role: this.determineEventSpecificRole(p),
      description: p.description
    }));
  }
}
```

### **Phase 4: UI Updates**

#### **4.1 Update Event Cards**
```javascript
// Add witness information to event cards
function addWitnessInfo(event) {
  const witnessData = DataAbstraction.getWitnessData(event);
  
  if (!witnessData.witnesses || witnessData.witnesses.length === 0) return '';
  
  return `
    <div class="witness-info mt-2 p-3 bg-archive-dark/30 border-l-2 border-primary/50">
      <div class="flex items-center gap-2 mb-2">
        <span class="material-symbols-outlined text-xs text-primary">person</span>
        <span class="text-xs font-bold uppercase tracking-wider">${witnessData.witnessCount} Witnesses</span>
      </div>
      ${witnessData.primaryWitness ? `
        <div class="text-xs">
          <span class="text-primary font-bold">${witnessData.primaryWitness.name}</span>
          <span class="text-archive-secondary/60"> (${witnessData.primaryWitness.event_specific_role})</span>
        </div>
      ` : ''}
    </div>
  `;
}
```

#### **4.2 Update Filter Configuration**
```html
data-filters='{
  "Event Hierarchy": ["All", "CATEGORY_1", "CATEGORY_2", "CATEGORY_3"],
  "Witness Hierarchy": ["All", "Primary Witness", "Secondary Witness", "Investigator", "Expert"],
  "Event Level": ["All", "Primary", "Secondary"], 
  "Type": ["All", "SIGHTING", "SHOT", "TRANSFER", "REPORT_WRITTEN", "INTERVIEW", "PHONE_CALL"]
}'
```

#### **4.3 Update Section Descriptions**
```html
<!-- CATEGORY 2: DIRECT WITNESS EVENTS -->
<section class="p-6 border-b border-archive-secondary/20">
    <div class="mb-8 border-l-4 border-primary pl-4 uppercase">
        <h2 class="text-2xl font-bold text-archive-heading tracking-widest uppercase font-display">Direct Witness
            Events</h2>
        <p class="text-[10px] text-archive-secondary/60 uppercase tracking-[0.2em] mt-1">Primary witness observations and direct experiences</p>
    </div>
    <!-- CATEGORY 2 Event Cards -->
</section>
```

### **Phase 5: Documentation & Validation**

#### **5.1 Update claude.md**
```markdown
### 6. Witness Compliance
   1. Verify all witnesses have required fields:
      - `name`, `role`, `witness_hierarchy`, `event_specific_role`
   2. Verify `witness_hierarchy` in controlled vocabulary:
      - PRIMARY_WITNESS, SECONDARY_WITNESS, INVESTIGATOR, EXPERT
   3. Verify `event_specific_role` is specific to the event context
   4. Validate witness relationships and hierarchy consistency
```

#### **5.2 Update Event Template Documentation**
```markdown
## Witness Data Structure
```json
{
  "witnesses": [
    {
      "name": "Witness Name",
      "role": "Role in Event",
      "witness_hierarchy": "PRIMARY_WITNESS|SECONDARY_WITNESS|INVESTIGATOR|EXPERT",
      "event_specific_role": "Event-specific role description",
      "description": "Detailed description",
      "credibility": "CONFIRMED|DISPUTED|UNKNOWN"
    }
  ]
}
```

#### **5.3 Add Validation Rules**
```javascript
// File: assets/js/validation.js
const witnessValidation = {
  required: ['name', 'role', 'witness_hierarchy', 'event_specific_role'],
  constraints: {
    'witness_hierarchy': ['PRIMARY_WITNESS', 'SECONDARY_WITNESS', 'INVESTIGATOR', 'EXPERT'],
    'credibility': ['CONFIRMED', 'DISPUTED', 'UNKNOWN']
  },
  validate: function(witness) {
    const errors = [];
    this.required.forEach(field => {
      if (!witness[field]) errors.push(`Missing required field: ${field}`);
    });
    if (this.constraints.witness_hierarchy && !this.constraints.witness_hierarchy.includes(witness.witness_hierarchy)) {
      errors.push(`Invalid witness_hierarchy: ${witness.witness_hierarchy}`);
    }
    return errors;
  }
};
```

## **🎯 Expected Results**

### **Before:**
- Generic "Witness" role
- No witness hierarchy
- Limited witness information

### **After:**
- **4-level witness hierarchy**: Primary → Secondary → Investigator → Expert
- **Event-specific roles**: "Reporting Witness", "Lead Investigator", "Family Witness"
- **Clear relationships**: Who learned from whom
- **Better filtering**: Filter by witness type/hierarchy
- **Enhanced UI**: Witness count, primary witness highlighted
- **Data integrity**: Validation rules and constraints

## **📋 Implementation Checklist**

### **Phase 1: Schema & Vocabulary**
- [ ] Create 009_witness_hierarchy.sql
- [ ] Update 002_seed_vocab.sql
- [ ] Create 010_witnesses_array.sql
- [ ] Create 011_witness_validation.sql
- [ ] Test schema changes

### **Phase 2: Data Structure**
- [ ] Update events.json structure
- [ ] Create 012_witness_data_migration.sql
- [ ] Implement enhanced role determination logic
- [ ] Add data abstraction layer
- [ ] Validate data integrity

### **Phase 3: JavaScript**
- [ ] Update buildCard function
- [ ] Add witness filtering logic
- [ ] Implement data abstraction layer
- [ ] Add validation framework
- [ ] Test filtering functionality

### **Phase 4: UI Updates**
- [ ] Update event card display
- [ ] Add witness hierarchy filters
- [ ] Update section descriptions
- [ ] Test UI functionality
- [ ] Optimize performance

### **Phase 5: Documentation & Validation**
- [ ] Update claude.md
- [ ] Update event template documentation
- [ ] Create witness hierarchy guide
- [ ] Add validation rules
- [ ] Review and finalize documentation

## **🔍 Key Principles**

1. **Deterministic categorization** based on event-specific roles
2. **Clear hierarchy** from primary witnesses through experts
3. **Event specificity** - roles defined within event context
4. **Backward compatibility** - maintain existing participants array
5. **Enhanced filtering** - multiple filter dimensions
6. **Data integrity** - validation rules and constraints
7. **Architecture clarity** - single source abstraction layer
8. **Scalability & Liquid Lists** - ensure UI components are architected for variable list lengths

## **📂 UI Scalability (Future-Proofing)**

While immediate vertical constraints are not required, the implementation must follow these extensibility principles:
- **Container Isolation**: Witness info blocks must be decoupled from the core card layout so they can expand vertically without breaking the card's structural integrity.
- **Hook for Overflow Logic**: The `addWitnessInfo` function (Phase 4.1) will be built with a pre-defined threshold variable (`WITNESS_DISPLAY_LIMIT`).
- **Liquid List Pattern**: Data structures will support paged or "Show More" interaction patterns natively in the abstraction layer, allowing for future UX polish if lists become exceptionally long.

## **🎯 Success Metrics**

- All events have properly categorized witnesses
- Witness filtering works correctly
- UI displays witness information clearly
- Documentation is complete and accurate
- No breaking changes to existing functionality
- Data validation passes all constraints
- Architecture abstraction layer functions correctly

**This creates a comprehensive witness analysis system that reflects real investigative hierarchies and provides deterministic categorization based on event-specific roles, with clear architecture strategy and complete technical specifications.**
