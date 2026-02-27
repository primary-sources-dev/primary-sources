---
description: Witness Hierarchy Implementation Plan
---

# Witness Hierarchy Implementation Plan

## **🎯 Overview**
Implement deterministic witness categorization based on event-specific roles, creating a hierarchy from primary witnesses through secondary witnesses, investigators, to experts.

## **📋 Implementation Plan**

### **Phase 1: Schema & Vocabulary Updates**

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

### **Phase 2: Data Structure Updates**

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

#### **2.2 Migrate Existing Participants**
- Move Yates, FBI agents from `participants` to `witnesses` array
- Add `witness_hierarchy` and `event_specific_role` fields
- Add relationship information

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

#### **3.3 Add Witness Role Determination**
```javascript
// In db-logic.js or separate file
function determineWitnessHierarchy(person, event, role) {
  // Primary witness = person who directly experienced the event
  if (event.witnesses && event.witnesses.some(w => w.name === person)) {
    const witness = event.witnesses.find(w => w.name === person);
    return witness.witness_hierarchy || 'SECONDARY_WITNESS';
  }
  
  // Investigator = official investigation roles
  if (role.includes('FBI Agent') || role.includes('Police') || role.includes('SA ')) {
    return 'INVESTIGATOR';
  }
  
  // Expert = specialist analysis roles  
  if (role.includes('Examiner') || role.includes('Analyst') || role.includes('Expert')) {
    return 'EXPERT';
  }
  
  // Default to secondary witness
  return 'SECONDARY_WITNESS';
}
```

### **Phase 4: UI Updates**

#### **4.1 Update Event Cards**
```javascript
// Add witness information to event cards
function addWitnessInfo(event) {
  if (!event.witnesses || event.witnesses.length === 0) return '';
  
  const primaryWitness = event.witnesses.find(w => w.witness_hierarchy === 'PRIMARY_WITNESS');
  const witnessCount = event.witnesses.length;
  
  return `
    <div class="witness-info mt-2 p-3 bg-archive-dark/30 border-l-2 border-primary/50">
      <div class="flex items-center gap-2 mb-2">
        <span class="material-symbols-outlined text-xs text-primary">person</span>
        <span class="text-xs font-bold uppercase tracking-wider">${witnessCount} Witnesses</span>
      </div>
      ${primaryWitness ? `
        <div class="text-xs">
          <span class="text-primary font-bold">${primaryWitness.name}</span>
          <span class="text-archive-secondary/60"> (${primaryWitness.event_specific_role})</span>
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

### **Phase 5: Documentation Updates**

#### **5.1 Update claude.md**
```markdown
### 6. Witness Compliance
   1. Verify all witnesses have required fields:
      - `name`, `role`, `witness_hierarchy`, `event_specific_role`
   2. Verify `witness_hierarchy` in controlled vocabulary:
      - PRIMARY_WITNESS, SECONDARY_WITNESS, INVESTIGATOR, EXPERT
   3. Verify `event_specific_role` is specific to the event context
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

## **⏱️ Timeline**

1. **Week 1**: Schema & vocabulary updates
2. **Week 2**: Data migration and JavaScript implementation  
3. **Week 3**: UI updates and documentation
4. **Week 4**: Testing and refinement

## **📋 Implementation Checklist**

### **Phase 1: Schema & Vocabulary**
- [ ] Create 009_witness_hierarchy.sql
- [ ] Update 002_seed_vocab.sql
- [ ] Create 010_witnesses_array.sql
- [ ] Test schema changes

### **Phase 2: Data Structure**
- [ ] Update events.json structure
- [ ] Migrate existing participants to witnesses array
- [ ] Add witness hierarchy fields
- [ ] Validate data integrity

### **Phase 3: JavaScript**
- [ ] Update buildCard function
- [ ] Add witness filtering logic
- [ ] Implement witness role determination
- [ ] Test filtering functionality

### **Phase 4: UI Updates**
- [ ] Update event card display
- [ ] Add witness hierarchy filters
- [ ] Update section descriptions
- [ ] Test UI functionality

### **Phase 5: Documentation**
- [ ] Update claude.md
- [ ] Update event template documentation
- [ ] Create witness hierarchy guide
- [ ] Review and finalize documentation

## **🔍 Key Principles**

1. **Deterministic categorization** based on event-specific roles
2. **Clear hierarchy** from primary witnesses through experts
3. **Event specificity** - roles defined within event context
4. **Backward compatibility** - maintain existing participants array
5. **Enhanced filtering** - multiple filter dimensions

## **🎯 Success Metrics**

- All events have properly categorized witnesses
- Witness filtering works correctly
- UI displays witness information clearly
- Documentation is complete and accurate
- No breaking changes to existing functionality

**This creates a comprehensive witness analysis system that reflects real investigative hierarchies and provides deterministic categorization based on event-specific roles.**
