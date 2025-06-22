/**
 * Intelligent Action Item Generator for Management Reviews
 * Analyzes review inputs and generates action items based on ISO 13485:2016 requirements
 */

export interface ReviewInput {
  id: number;
  category: string;
  title: string;
  description: string;
  data: string;
  source: string;
  createdAt: string;
}

export interface GeneratedAction {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  category: string;
  assignedDepartment: string;
  dueDate: string;
  sourceInputIds: number[];
  isoClause: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

// ISO 13485:2016 Management Review Input Categories
const INPUT_CATEGORIES = {
  AUDIT_RESULTS: 'audit_results',
  CUSTOMER_FEEDBACK: 'customer_feedback',
  PROCESS_PERFORMANCE: 'process_performance',
  PRODUCT_CONFORMITY: 'product_conformity',
  CORRECTIVE_PREVENTIVE: 'corrective_preventive_actions',
  CHANGES: 'changes_affecting_qms',
  RECOMMENDATIONS: 'recommendations_improvement',
  REGULATORY: 'regulatory_requirements',
  RESOURCE_NEEDS: 'resource_needs',
  RISK_MANAGEMENT: 'risk_management'
};

// Action generation rules based on ISO 13485:2016 Clause 5.6.3
const ACTION_GENERATION_RULES = {
  // Audit Results Analysis
  [INPUT_CATEGORIES.AUDIT_RESULTS]: {
    keywords: {
      nonconformity: { priority: 'High', department: 'Quality', clause: '8.5.2' },
      finding: { priority: 'Medium', department: 'Quality', clause: '8.2.2' },
      observation: { priority: 'Low', department: 'Operations', clause: '8.2.2' },
      deficiency: { priority: 'High', department: 'Quality', clause: '8.5.2' },
      improvement: { priority: 'Medium', department: 'Process Owner', clause: '8.5.1' }
    },
    defaultAction: {
      title: 'Review Audit Findings Implementation',
      priority: 'Medium' as const,
      department: 'Quality',
      clause: '8.2.2'
    }
  },

  // Customer Feedback Analysis
  [INPUT_CATEGORIES.CUSTOMER_FEEDBACK]: {
    keywords: {
      complaint: { priority: 'High', department: 'Quality', clause: '8.2.1' },
      satisfaction: { priority: 'Medium', department: 'Customer Service', clause: '8.2.1' },
      return: { priority: 'High', department: 'Quality', clause: '8.3' },
      feedback: { priority: 'Medium', department: 'Product Management', clause: '8.2.1' },
      requirement: { priority: 'Medium', department: 'Design', clause: '7.2.1' }
    },
    defaultAction: {
      title: 'Analyze Customer Feedback Trends',
      priority: 'Medium' as const,
      department: 'Quality',
      clause: '8.2.1'
    }
  },

  // Process Performance Analysis
  [INPUT_CATEGORIES.PROCESS_PERFORMANCE]: {
    keywords: {
      deviation: { priority: 'High', department: 'Process Owner', clause: '8.1' },
      trend: { priority: 'Medium', department: 'Quality', clause: '8.4' },
      metric: { priority: 'Medium', department: 'Operations', clause: '8.1' },
      target: { priority: 'Medium', department: 'Management', clause: '8.1' },
      efficiency: { priority: 'Low', department: 'Operations', clause: '8.5.1' }
    },
    defaultAction: {
      title: 'Review Process Performance Metrics',
      priority: 'Medium' as const,
      department: 'Quality',
      clause: '8.1'
    }
  },

  // Product Conformity Analysis
  [INPUT_CATEGORIES.PRODUCT_CONFORMITY]: {
    keywords: {
      nonconforming: { priority: 'High', department: 'Quality', clause: '8.3' },
      specification: { priority: 'Medium', department: 'Engineering', clause: '7.3.3' },
      testing: { priority: 'Medium', department: 'Quality', clause: '7.5.1' },
      validation: { priority: 'High', department: 'Validation', clause: '7.5.2' },
      verification: { priority: 'High', department: 'Verification', clause: '7.5.2' }
    },
    defaultAction: {
      title: 'Review Product Conformity Status',
      priority: 'Medium' as const,
      department: 'Quality',
      clause: '8.3'
    }
  },

  // CAPA Analysis
  [INPUT_CATEGORIES.CORRECTIVE_PREVENTIVE]: {
    keywords: {
      effectiveness: { priority: 'High', department: 'Quality', clause: '8.5.2' },
      implementation: { priority: 'High', department: 'Process Owner', clause: '8.5.2' },
      overdue: { priority: 'Critical', department: 'Management', clause: '8.5.2' },
      trend: { priority: 'Medium', department: 'Quality', clause: '8.5.2' },
      closure: { priority: 'Medium', department: 'Quality', clause: '8.5.2' }
    },
    defaultAction: {
      title: 'Review CAPA Effectiveness',
      priority: 'High' as const,
      department: 'Quality',
      clause: '8.5.2'
    }
  },

  // Changes Affecting QMS
  [INPUT_CATEGORIES.CHANGES]: {
    keywords: {
      regulatory: { priority: 'High', department: 'Regulatory', clause: '4.1.1' },
      process: { priority: 'Medium', department: 'Process Owner', clause: '4.1.1' },
      organizational: { priority: 'Medium', department: 'Management', clause: '5.5' },
      technology: { priority: 'Medium', department: 'Engineering', clause: '7.3.7' },
      supplier: { priority: 'Medium', department: 'Purchasing', clause: '7.4.1' }
    },
    defaultAction: {
      title: 'Assess QMS Change Impact',
      priority: 'Medium' as const,
      department: 'Quality',
      clause: '4.1.1'
    }
  },

  // Resource Needs
  [INPUT_CATEGORIES.RESOURCE_NEEDS]: {
    keywords: {
      personnel: { priority: 'Medium', department: 'HR', clause: '6.2' },
      training: { priority: 'Medium', department: 'Training', clause: '6.2' },
      infrastructure: { priority: 'High', department: 'Facilities', clause: '6.3' },
      equipment: { priority: 'Medium', department: 'Engineering', clause: '6.3' },
      budget: { priority: 'High', department: 'Finance', clause: '6.1' }
    },
    defaultAction: {
      title: 'Review Resource Adequacy',
      priority: 'Medium' as const,
      department: 'Management',
      clause: '6.1'
    }
  }
};

/**
 * Analyzes review inputs and generates intelligent action items
 */
export function generateActionItemsFromInputs(inputs: ReviewInput[]): GeneratedAction[] {
  const actions: GeneratedAction[] = [];
  const processedCategories = new Set<string>();

  // Group inputs by category
  const inputsByCategory = inputs.reduce((acc, input) => {
    if (!acc[input.category]) {
      acc[input.category] = [];
    }
    acc[input.category].push(input);
    return acc;
  }, {} as Record<string, ReviewInput[]>);

  // Generate actions for each category
  Object.entries(inputsByCategory).forEach(([category, categoryInputs]) => {
    const rules = ACTION_GENERATION_RULES[category];
    if (!rules) return;

    processedCategories.add(category);

    // Analyze each input for specific action triggers
    categoryInputs.forEach(input => {
      const analysisText = `${input.title} ${input.description} ${input.data}`.toLowerCase();
      
      // Check for keyword matches
      Object.entries(rules.keywords).forEach(([keyword, config]) => {
        if (analysisText.includes(keyword)) {
          const action = generateSpecificAction(input, keyword, config, category);
          if (action) {
            actions.push(action);
          }
        }
      });
    });

    // Generate default category action if no specific actions were created
    const categoryActions = actions.filter(a => a.sourceInputIds.some(id => 
      categoryInputs.some(input => input.id === id)
    ));

    if (categoryActions.length === 0) {
      const defaultAction = generateDefaultAction(categoryInputs, rules.defaultAction, category);
      if (defaultAction) {
        actions.push(defaultAction);
      }
    }
  });

  // Generate cross-category analysis actions
  const crossCategoryActions = generateCrossCategoryActions(inputs, processedCategories);
  actions.push(...crossCategoryActions);

  return actions;
}

/**
 * Generates a specific action based on keyword analysis
 */
function generateSpecificAction(
  input: ReviewInput, 
  keyword: string, 
  config: any, 
  category: string
): GeneratedAction | null {
  const dueDate = calculateDueDate(config.priority);
  const riskLevel = assessRiskLevel(input, keyword);

  return {
    title: generateActionTitle(keyword, input.title),
    description: generateActionDescription(keyword, input, category),
    priority: config.priority,
    category: mapCategoryToActionCategory(category),
    assignedDepartment: config.department,
    dueDate,
    sourceInputIds: [input.id],
    isoClause: config.clause,
    riskLevel
  };
}

/**
 * Generates a default action for a category
 */
function generateDefaultAction(
  inputs: ReviewInput[], 
  defaultConfig: any, 
  category: string
): GeneratedAction | null {
  const dueDate = calculateDueDate(defaultConfig.priority);
  const combinedRisk = assessCombinedRiskLevel(inputs);

  return {
    title: defaultConfig.title,
    description: `Comprehensive review of ${mapCategoryToDisplayName(category)} based on management review inputs. Analysis should include trend identification, risk assessment, and improvement opportunities.`,
    priority: defaultConfig.priority,
    category: mapCategoryToActionCategory(category),
    assignedDepartment: defaultConfig.department,
    dueDate,
    sourceInputIds: inputs.map(i => i.id),
    isoClause: defaultConfig.clause,
    riskLevel: combinedRisk
  };
}

/**
 * Generates cross-category analysis actions
 */
function generateCrossCategoryActions(inputs: ReviewInput[], processedCategories: Set<string>): GeneratedAction[] {
  const actions: GeneratedAction[] = [];

  // QMS Effectiveness Review (required by ISO 13485:2016 Clause 5.6.3)
  if (inputs.length >= 3) {
    actions.push({
      title: 'Comprehensive QMS Effectiveness Review',
      description: 'Conduct systematic analysis of QMS effectiveness based on management review inputs. Evaluate overall system performance, identify systemic issues, and recommend strategic improvements.',
      priority: 'High',
      category: 'Strategic Review',
      assignedDepartment: 'Management',
      dueDate: calculateDueDate('High'),
      sourceInputIds: inputs.map(i => i.id),
      isoClause: '5.6.3',
      riskLevel: 'Medium'
    });
  }

  // Risk-based thinking integration
  const riskInputs = inputs.filter(i => 
    i.description.toLowerCase().includes('risk') || 
    i.title.toLowerCase().includes('risk') ||
    i.category === INPUT_CATEGORIES.RISK_MANAGEMENT
  );

  if (riskInputs.length > 0) {
    actions.push({
      title: 'Risk Management Integration Review',
      description: 'Review risk management integration across QMS processes. Ensure risk-based thinking is effectively implemented and maintained.',
      priority: 'Medium',
      category: 'Risk Management',
      assignedDepartment: 'Quality',
      dueDate: calculateDueDate('Medium'),
      sourceInputIds: riskInputs.map(i => i.id),
      isoClause: '4.1.4',
      riskLevel: 'High'
    });
  }

  return actions;
}

/**
 * Utility functions
 */
function generateActionTitle(keyword: string, inputTitle: string): string {
  const titleMap: Record<string, string> = {
    nonconformity: `Address Nonconformity: ${inputTitle}`,
    complaint: `Investigate Customer Complaint: ${inputTitle}`,
    deviation: `Correct Process Deviation: ${inputTitle}`,
    overdue: `Resolve Overdue Items: ${inputTitle}`,
    effectiveness: `Verify Effectiveness: ${inputTitle}`,
    trend: `Analyze Trend: ${inputTitle}`,
    default: `Review and Address: ${inputTitle}`
  };

  return titleMap[keyword] || titleMap.default;
}

function generateActionDescription(keyword: string, input: ReviewInput, category: string): string {
  const baseDescription = `Based on management review input from ${mapCategoryToDisplayName(category)}: ${input.description}`;
  
  const actionMap: Record<string, string> = {
    nonconformity: `${baseDescription}\n\nRequired Actions:\n- Root cause analysis\n- Corrective action implementation\n- Effectiveness verification\n- Process improvement`,
    complaint: `${baseDescription}\n\nRequired Actions:\n- Customer complaint investigation\n- Impact assessment\n- Corrective measures\n- Customer communication`,
    deviation: `${baseDescription}\n\nRequired Actions:\n- Process analysis\n- Control implementation\n- Monitoring enhancement\n- Training if required`,
    default: `${baseDescription}\n\nRequired Actions:\n- Detailed analysis\n- Risk assessment\n- Implementation plan\n- Follow-up verification`
  };

  return actionMap[keyword] || actionMap.default;
}

function calculateDueDate(priority: string): string {
  const now = new Date();
  const daysToAdd = {
    'Critical': 7,
    'High': 30,
    'Medium': 60,
    'Low': 90
  }[priority] || 60;

  const dueDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return dueDate.toISOString();
}

function assessRiskLevel(input: ReviewInput, keyword: string): 'Low' | 'Medium' | 'High' {
  const riskKeywords = {
    high: ['critical', 'major', 'safety', 'regulatory', 'compliance', 'patient'],
    medium: ['moderate', 'significant', 'process', 'quality', 'customer'],
    low: ['minor', 'administrative', 'documentation', 'training']
  };

  const text = `${input.title} ${input.description} ${keyword}`.toLowerCase();

  if (riskKeywords.high.some(k => text.includes(k))) return 'High';
  if (riskKeywords.medium.some(k => text.includes(k))) return 'Medium';
  return 'Low';
}

function assessCombinedRiskLevel(inputs: ReviewInput[]): 'Low' | 'Medium' | 'High' {
  const riskLevels = inputs.map(input => assessRiskLevel(input, ''));
  
  if (riskLevels.includes('High')) return 'High';
  if (riskLevels.filter(r => r === 'Medium').length >= 2) return 'High';
  if (riskLevels.includes('Medium')) return 'Medium';
  return 'Low';
}

function mapCategoryToDisplayName(category: string): string {
  const nameMap: Record<string, string> = {
    [INPUT_CATEGORIES.AUDIT_RESULTS]: 'Audit Results',
    [INPUT_CATEGORIES.CUSTOMER_FEEDBACK]: 'Customer Feedback',
    [INPUT_CATEGORIES.PROCESS_PERFORMANCE]: 'Process Performance',
    [INPUT_CATEGORIES.PRODUCT_CONFORMITY]: 'Product Conformity',
    [INPUT_CATEGORIES.CORRECTIVE_PREVENTIVE]: 'CAPA Status',
    [INPUT_CATEGORIES.CHANGES]: 'QMS Changes',
    [INPUT_CATEGORIES.RECOMMENDATIONS]: 'Improvement Recommendations',
    [INPUT_CATEGORIES.REGULATORY]: 'Regulatory Requirements',
    [INPUT_CATEGORIES.RESOURCE_NEEDS]: 'Resource Needs',
    [INPUT_CATEGORIES.RISK_MANAGEMENT]: 'Risk Management'
  };

  return nameMap[category] || 'General Review';
}

function mapCategoryToActionCategory(category: string): string {
  const actionCategoryMap: Record<string, string> = {
    [INPUT_CATEGORIES.AUDIT_RESULTS]: 'Quality Assurance',
    [INPUT_CATEGORIES.CUSTOMER_FEEDBACK]: 'Customer Experience',
    [INPUT_CATEGORIES.PROCESS_PERFORMANCE]: 'Process Improvement',
    [INPUT_CATEGORIES.PRODUCT_CONFORMITY]: 'Product Quality',
    [INPUT_CATEGORIES.CORRECTIVE_PREVENTIVE]: 'CAPA Management',
    [INPUT_CATEGORIES.CHANGES]: 'Change Management',
    [INPUT_CATEGORIES.RECOMMENDATIONS]: 'Continuous Improvement',
    [INPUT_CATEGORIES.REGULATORY]: 'Regulatory Compliance',
    [INPUT_CATEGORIES.RESOURCE_NEEDS]: 'Resource Management',
    [INPUT_CATEGORIES.RISK_MANAGEMENT]: 'Risk Management'
  };

  return actionCategoryMap[category] || 'General';
}