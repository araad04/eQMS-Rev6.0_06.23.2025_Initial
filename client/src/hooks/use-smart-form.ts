import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

/**
 * Smart Form Auto-Fill Hook
 * Provides intelligent form completion based on user patterns and role-based defaults
 * 
 * Features:
 * - Remembers last 5 entries for each field
 * - Role-based default values
 * - Quick templates for common form combinations
 * - Auto-complete suggestions
 */

interface SmartFormOptions {
  formId: string;
  enableAutoComplete?: boolean;
  maxSuggestions?: number;
  saveUserPreferences?: boolean;
}

interface FormHistory {
  [fieldName: string]: string[];
}

interface UserDefaults {
  [fieldName: string]: string;
}

interface QuickTemplate {
  id: string;
  name: string;
  description: string;
  values: Record<string, any>;
}

export function useSmartForm(options: SmartFormOptions) {
  const { user } = useAuth();
  const { formId, enableAutoComplete = true, maxSuggestions = 5, saveUserPreferences = true } = options;
  
  const [formHistory, setFormHistory] = useState<FormHistory>({});
  const [userDefaults, setUserDefaults] = useState<UserDefaults>({});
  const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>([]);

  // Load form history and user preferences from localStorage
  useEffect(() => {
    if (!user || !saveUserPreferences) return;

    const historyKey = `form_history_${formId}_${user.id}`;
    const defaultsKey = `user_defaults_${user.id}`;
    const templatesKey = `quick_templates_${formId}`;

    try {
      const savedHistory = localStorage.getItem(historyKey);
      const savedDefaults = localStorage.getItem(defaultsKey);
      const savedTemplates = localStorage.getItem(templatesKey);

      if (savedHistory) {
        setFormHistory(JSON.parse(savedHistory));
      }
      
      if (savedDefaults) {
        setUserDefaults(JSON.parse(savedDefaults));
      }

      if (savedTemplates) {
        setQuickTemplates(JSON.parse(savedTemplates));
      } else {
        // Initialize with default templates based on form type
        initializeDefaultTemplates();
      }
    } catch (error) {
      console.error('Error loading form preferences:', error);
    }
  }, [user, formId, saveUserPreferences]);

  // Initialize default templates based on form type
  const initializeDefaultTemplates = () => {
    let defaultTemplates: QuickTemplate[] = [];

    if (formId === 'supplier-assessment') {
      defaultTemplates = [
        {
          id: 'routine-assessment',
          name: 'Routine Assessment',
          description: 'Standard quarterly supplier review',
          values: {
            assessmentType: 'Performance Review',
            status: 'Scheduled',
            suggestions: 'Review delivery performance and quality metrics'
          }
        },
        {
          id: 'critical-assessment',
          name: 'Critical Supplier Assessment',
          description: 'Enhanced review for critical suppliers',
          values: {
            assessmentType: 'Audit',
            status: 'Scheduled',
            suggestions: 'Focus on quality systems and regulatory compliance'
          }
        },
        {
          id: 'incident-assessment',
          name: 'Incident-Based Assessment',
          description: 'Assessment triggered by quality incident',
          values: {
            assessmentType: 'Risk Assessment',
            status: 'In Progress',
            suggestions: 'Investigate root cause and implement corrective actions'
          }
        }
      ];
    } else if (formId === 'regulatory-reportability') {
      defaultTemplates = [
        {
          id: 'device-malfunction',
          name: 'Device Malfunction',
          description: 'Standard device failure assessment',
          values: {
            isDeviceFailure: true,
            isFieldAction: false,
            patientHarm: 'None',
            reportabilityDecision: 'Under Review'
          }
        },
        {
          id: 'field-action',
          name: 'Field Action',
          description: 'Product recall or field correction',
          values: {
            isFieldAction: true,
            isDeviceFailure: true,
            patientHarm: 'Minor',
            reportabilityDecision: 'Reportable'
          }
        }
      ];
    }

    setQuickTemplates(defaultTemplates);
    if (saveUserPreferences && user) {
      localStorage.setItem(`quick_templates_${formId}`, JSON.stringify(defaultTemplates));
    }
  };

  // Get role-based default values
  const getRoleDefaults = (fieldName: string): string => {
    if (!user) return '';

    const roleDefaults: Record<string, Record<string, string>> = {
      admin: {
        createdBy: user.firstName + ' ' + user.lastName,
        department: user.department || 'Quality Assurance',
        assignedTo: user.username
      },
      manager: {
        createdBy: user.firstName + ' ' + user.lastName,
        department: user.department || 'Quality Management',
        reviewedBy: user.username
      },
      qa: {
        createdBy: user.firstName + ' ' + user.lastName,
        department: 'Quality Assurance',
        qualityReviewer: user.username
      }
    };

    return roleDefaults[user.role]?.[fieldName] || userDefaults[fieldName] || '';
  };

  // Get suggestions for a field based on history
  const getSuggestions = (fieldName: string, currentValue: string = ''): string[] => {
    if (!enableAutoComplete) return [];

    const history = formHistory[fieldName] || [];
    const filtered = history.filter(value => 
      value.toLowerCase().includes(currentValue.toLowerCase()) && 
      value !== currentValue
    );

    return filtered.slice(0, maxSuggestions);
  };

  // Save field value to history
  const saveToHistory = (fieldName: string, value: string) => {
    if (!value.trim() || !saveUserPreferences || !user) return;

    setFormHistory(prev => {
      const fieldHistory = prev[fieldName] || [];
      const updated = [value, ...fieldHistory.filter(v => v !== value)].slice(0, maxSuggestions);
      
      const newHistory = { ...prev, [fieldName]: updated };
      
      // Save to localStorage
      const historyKey = `form_history_${formId}_${user.id}`;
      localStorage.setItem(historyKey, JSON.stringify(newHistory));
      
      return newHistory;
    });
  };

  // Apply quick template
  const applyTemplate = (templateId: string): Record<string, any> => {
    const template = quickTemplates.find(t => t.id === templateId);
    if (!template) return {};

    // Apply template values with role defaults where appropriate
    const templateValues = { ...template.values };
    Object.keys(templateValues).forEach(key => {
      if (!templateValues[key] || templateValues[key] === '') {
        templateValues[key] = getRoleDefaults(key);
      }
    });

    return templateValues;
  };

  // Get auto-fill value for a field
  const getAutoFillValue = (fieldName: string): string => {
    // First check user defaults, then role defaults
    return userDefaults[fieldName] || getRoleDefaults(fieldName);
  };

  // Save user preference as default
  const saveAsDefault = (fieldName: string, value: string) => {
    if (!saveUserPreferences || !user) return;

    setUserDefaults(prev => {
      const newDefaults = { ...prev, [fieldName]: value };
      const defaultsKey = `user_defaults_${user.id}`;
      localStorage.setItem(defaultsKey, JSON.stringify(newDefaults));
      return newDefaults;
    });
  };

  // Copy values from last similar entry
  const copyFromLastEntry = (): Record<string, any> => {
    const lastEntryKey = `last_entry_${formId}_${user?.id}`;
    try {
      const lastEntry = localStorage.getItem(lastEntryKey);
      return lastEntry ? JSON.parse(lastEntry) : {};
    } catch (error) {
      console.error('Error loading last entry:', error);
      return {};
    }
  };

  // Save current form as last entry
  const saveAsLastEntry = (formData: Record<string, any>) => {
    if (!saveUserPreferences || !user) return;

    const lastEntryKey = `last_entry_${formId}_${user.id}`;
    localStorage.setItem(lastEntryKey, JSON.stringify(formData));
  };

  return {
    // Auto-complete functions
    getSuggestions,
    saveToHistory,
    
    // Template functions
    quickTemplates,
    applyTemplate,
    
    // Default value functions
    getAutoFillValue,
    saveAsDefault,
    
    // Last entry functions
    copyFromLastEntry,
    saveAsLastEntry,
    
    // User context
    userDefaults,
    formHistory
  };
}