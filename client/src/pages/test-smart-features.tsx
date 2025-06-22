import React, { useState } from 'react';
import { Helmet } from "react-helmet";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSmartForm } from '@/hooks/use-smart-form';
import { 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle,
  Copy,
  Zap,
  History
} from 'lucide-react';

/**
 * Test Page for Smart Features
 * Demonstrates Quick Action Buttons and Smart Form Auto-Fill
 */
export default function TestSmartFeaturesPage() {
  const { toast } = useToast();
  const smartForm = useSmartForm({ 
    formId: 'test-assessment',
    enableAutoComplete: true,
    maxSuggestions: 5 
  });

  const [formData, setFormData] = useState({
    supplierName: '',
    assessmentType: '',
    findings: '',
    suggestions: '',
    reviewedBy: '',
    department: ''
  });

  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);

  // Quick Action Button: Auto-fill with role defaults
  const handleAutoFillDefaults = () => {
    const autoFilledData = {
      supplierName: formData.supplierName,
      assessmentType: formData.assessmentType,
      findings: formData.findings,
      suggestions: formData.suggestions,
      reviewedBy: smartForm.getAutoFillValue('reviewedBy'),
      department: smartForm.getAutoFillValue('department')
    };
    
    setFormData(autoFilledData);
    toast({
      title: "Auto-filled with defaults",
      description: "Form populated with your role-based defaults"
    });
  };

  // Quick Action Button: Copy from last entry
  const handleCopyLastEntry = () => {
    const lastEntry = smartForm.copyFromLastEntry();
    if (Object.keys(lastEntry).length > 0) {
      setFormData(prev => ({ ...prev, ...lastEntry }));
      toast({
        title: "Copied from last entry",
        description: "Form populated with your previous submission"
      });
    } else {
      toast({
        title: "No previous entry found",
        description: "This is your first time using this form",
        variant: "destructive"
      });
    }
  };

  // Quick Action Button: Apply template
  const handleApplyTemplate = (templateId: string) => {
    const templateValues = smartForm.applyTemplate(templateId);
    setFormData(prev => ({ ...prev, ...templateValues }));
    
    const template = smartForm.quickTemplates.find(t => t.id === templateId);
    toast({
      title: `Applied ${template?.name}`,
      description: template?.description || "Template applied successfully"
    });
  };

  // Handle field change with auto-complete
  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Save to history when user finishes typing (after a brief pause)
    if (value.trim()) {
      setTimeout(() => {
        smartForm.saveToHistory(fieldName, value);
      }, 1000);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    // Save as last entry for next time
    smartForm.saveAsLastEntry(formData);
    
    toast({
      title: "Form submitted successfully",
      description: "Data saved and will be available for next form"
    });
    
    console.log('Submitted data:', formData);
  };

  // Get suggestions for a field
  const getSuggestionsForField = (fieldName: string) => {
    return smartForm.getSuggestions(fieldName, formData[fieldName as keyof typeof formData]);
  };

  return (
    <>
      <Helmet>
        <title>Smart Features Test | eQMS</title>
        <meta name="description" content="Testing Quick Action Buttons and Smart Form Auto-Fill features" />
      </Helmet>

      <div className="container p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Smart Features Test Page</h1>
          <p className="text-gray-600 mt-2">
            Demonstrating Quick Action Buttons and Smart Form Auto-Fill functionality
          </p>
        </div>

        {/* Quick Action Buttons Demo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Quick Action Buttons Demo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button 
                variant="outline" 
                onClick={handleAutoFillDefaults}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Auto-Fill Defaults
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleCopyLastEntry}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Last Entry
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  const emailBody = `Assessment Form Data:\n${JSON.stringify(formData, null, 2)}`;
                  window.open(`mailto:?subject=Assessment Form&body=${encodeURIComponent(emailBody)}`);
                  toast({
                    title: "Email opened",
                    description: "Form data ready to send"
                  });
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email This Form
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
                  toast({
                    title: "Copied to clipboard",
                    description: "Form data copied as JSON"
                  });
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Copy Form Data
              </Button>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Templates:</Label>
              <div className="flex flex-wrap gap-2">
                {smartForm.quickTemplates.map(template => (
                  <Button
                    key={template.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApplyTemplate(template.id)}
                    className="text-xs"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Form Auto-Fill Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Smart Form Auto-Fill Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Supplier Name with Auto-complete */}
            <div className="relative">
              <Label htmlFor="supplierName">Supplier Name</Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                onChange={(e) => handleFieldChange('supplierName', e.target.value)}
                onFocus={() => setShowSuggestions('supplierName')}
                onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                placeholder="Start typing supplier name..."
              />
              
              {/* Auto-complete suggestions */}
              {showSuggestions === 'supplierName' && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
                  {getSuggestionsForField('supplierName').map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => {
                        handleFieldChange('supplierName', suggestion);
                        setShowSuggestions(null);
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                  {getSuggestionsForField('supplierName').length === 0 && (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      No previous entries found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Assessment Type */}
            <div>
              <Label htmlFor="assessmentType">Assessment Type</Label>
              <Select
                value={formData.assessmentType}
                onValueChange={(value) => handleFieldChange('assessmentType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Audit">Audit</SelectItem>
                  <SelectItem value="Performance Review">Performance Review</SelectItem>
                  <SelectItem value="Risk Assessment">Risk Assessment</SelectItem>
                  <SelectItem value="Regulatory Reportability">Regulatory Reportability</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Findings with Auto-complete */}
            <div className="relative">
              <Label htmlFor="findings">Findings</Label>
              <Textarea
                id="findings"
                value={formData.findings}
                onChange={(e) => handleFieldChange('findings', e.target.value)}
                onFocus={() => setShowSuggestions('findings')}
                onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                placeholder="Enter assessment findings..."
                rows={3}
              />
              
              {/* Show recent entries as badges */}
              {showSuggestions === 'findings' && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 p-2">
                  <div className="text-xs text-gray-500 mb-2">Recent entries:</div>
                  <div className="flex flex-wrap gap-1">
                    {getSuggestionsForField('findings').slice(0, 3).map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          handleFieldChange('findings', suggestion);
                          setShowSuggestions(null);
                        }}
                      >
                        {suggestion.length > 30 ? `${suggestion.substring(0, 30)}...` : suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div>
              <Label htmlFor="suggestions">Suggestions</Label>
              <Textarea
                id="suggestions"
                value={formData.suggestions}
                onChange={(e) => handleFieldChange('suggestions', e.target.value)}
                placeholder="Enter improvement suggestions..."
                rows={3}
              />
            </div>

            {/* Reviewed By (Auto-filled) */}
            <div>
              <Label htmlFor="reviewedBy">Reviewed By</Label>
              <Input
                id="reviewedBy"
                value={formData.reviewedBy}
                onChange={(e) => handleFieldChange('reviewedBy', e.target.value)}
                placeholder="Will auto-fill with your name"
              />
            </div>

            {/* Department (Auto-filled) */}
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleFieldChange('department', e.target.value)}
                placeholder="Will auto-fill with your department"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSubmit}>
                Submit Assessment
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setFormData({
                    supplierName: '',
                    assessmentType: '',
                    findings: '',
                    suggestions: '',
                    reviewedBy: '',
                    department: ''
                  });
                  toast({
                    title: "Form cleared",
                    description: "All fields have been reset"
                  });
                }}
              >
                Clear Form
              </Button>
            </div>
            
            {/* Current Form Data Display */}
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium mb-2">Current Form Data:</h4>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>

          </CardContent>
        </Card>

      </div>
    </>
  );
}