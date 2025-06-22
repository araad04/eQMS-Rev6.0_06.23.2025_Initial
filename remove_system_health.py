#!/usr/bin/env python3

def remove_system_health_components():
    # Read in the schema file
    with open('shared/schema.ts', 'r') as f:
        lines = f.readlines()

    # Fixed for complaints table duplicated declaration
    fixed_lines = []
    skip_next_complaints = False
    
    # Components to remove
    skip_sections = [
        ('processImpactLevelEnum', '[', ');'),
        ('processes = pgTable', '{', '});'),
        ('metrics = pgTable', '{', '});'),
        ('metricValues = pgTable', '{', '});'),
        ('riskScores = pgTable', '{', '});'),
        ('alertRules = pgTable', '{', '});'),
        ('alerts = pgTable', '{', '});'),
        ('alertConfigurations = pgTable', '{', '});'),
        ('alertHistory = pgTable', '{', '});'),
        ('healthScoreHistory = pgTable', '{', '});'),
        ('insertProcessSchema =', 'createInsertSchema', '});'),
        ('insertMetricSchema =', 'createInsertSchema', '});'),
        ('insertMetricValueSchema =', 'createInsertSchema', '});'),
        ('insertRiskScoreSchema =', 'createInsertSchema', '});'),
        ('insertAlertRuleSchema =', 'createInsertSchema', '});'),
        ('insertAlertSchema =', 'createInsertSchema', '});'),
        ('insertAlertConfigurationSchema =', 'createInsertSchema', '});'),
        ('insertHealthScoreHistorySchema =', 'createInsertSchema', '});'),
    ]
    
    # Types to remove
    type_removals = [
        'export type Process =',
        'export type InsertProcess =',
        'export type Metric =',
        'export type InsertMetric =',
        'export type MetricValue =',
        'export type InsertMetricValue =',
        'export type RiskScore =',
        'export type InsertRiskScore =',
        'export type AlertRule =',
        'export type InsertAlertRule =',
        'export type Alert =',
        'export type InsertAlert =',
        'export type AlertConfiguration =',
        'export type InsertAlertConfiguration =',
        'export type AlertHistoryEntry =',
        'export type HealthScoreHistoryEntry =',
        'export type InsertHealthScoreHistoryEntry =',
    ]
    
    # Relations to modify
    relations_sections = [
        ('// Relations for Risk-Based Analysis & Process Monitoring Module', 
         '// Relations for Customer Feedback & Complaints'),
    ]
    
    # Process file
    i = 0
    skipping = False
    current_section_end = None
    while i < len(lines):
        line = lines[i]
        
        # Skip duplicate complaints declaration (special case fix)
        if 'complaints = pgTable' in line and skip_next_complaints:
            i += 1
            continue
        elif 'complaints = pgTable' in line:
            skip_next_complaints = True
            fixed_lines.append(line)
            i += 1
            continue
        
        # Replace section headers
        for section_start, section_replacement in relations_sections:
            if section_start in line:
                fixed_lines.append(f"{section_replacement}\n")
                i += 1
                continue

        # Type removals - single line
        skip_type = False
        for type_removal in type_removals:
            if type_removal in line:
                skip_type = True
                break
        
        if skip_type:
            i += 1
            continue

        # Section removals
        if not skipping:
            for section_name, section_start, section_end in skip_sections:
                if section_name in line and section_start in line:
                    skipping = True
                    current_section_end = section_end
                    i += 1
                    break
            
            if not skipping:
                fixed_lines.append(line)
                i += 1
        else:
            if current_section_end in line:
                skipping = False
                current_section_end = None
            i += 1
    
    # Write the fixed file
    with open('shared/schema.ts', 'w') as f:
        f.writelines(fixed_lines)
    
    print("System health components removed from schema.ts")

if __name__ == "__main__":
    remove_system_health_components()