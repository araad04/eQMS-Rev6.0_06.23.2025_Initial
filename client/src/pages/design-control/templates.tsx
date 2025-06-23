import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  BookOpen,
  Clipboard,
  Settings,
  FileSpreadsheet,
  FileCode,
  Shield
} from 'lucide-react';

interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'document' | 'checklist' | 'form' | 'procedure';
  regulatoryStandard: string;
  lastUpdated: string;
  version: string;
  downloadUrl: string;
}

const ProjectTemplates: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch design control templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/design-control/templates'],
    queryFn: async () => {
      const response = await fetch('/api/design-control/templates', {
        headers: { 'X-Auth-Local': 'true' }
      });
      if (!response.ok) {
        // Return static templates if API not implemented yet
        return getStaticTemplates();
      }
      return response.json();
    }
  });

  const getStaticTemplates = (): DesignTemplate[] => [
    {
      id: 'TPL-001',
      name: 'Design Control Plan Template',
      description: 'Comprehensive design control plan template for medical device development',
      category: 'Planning & URS',
      type: 'document',
      regulatoryStandard: 'ISO 13485:7.3',
      lastUpdated: '2025-06-23',
      version: '2.1',
      downloadUrl: '/templates/design-control-plan.docx'
    },
    {
      id: 'TPL-002',
      name: 'User Requirements Specification Template',
      description: 'Template for capturing and documenting user requirements',
      category: 'Planning & URS',
      type: 'document',
      regulatoryStandard: 'ISO 13485:7.3.2',
      lastUpdated: '2025-06-23',
      version: '1.8',
      downloadUrl: '/templates/urs-template.docx'
    },
    {
      id: 'TPL-003',
      name: 'Design Input Specification Template',
      description: 'Standardized template for design input documentation',
      category: 'Design Inputs',
      type: 'document',
      regulatoryStandard: 'ISO 13485:7.3.3',
      lastUpdated: '2025-06-23',
      version: '2.0',
      downloadUrl: '/templates/design-input-template.docx'
    },
    {
      id: 'TPL-004',
      name: 'Design Output Checklist',
      description: 'Verification checklist for design output completeness',
      category: 'Design Outputs',
      type: 'checklist',
      regulatoryStandard: 'ISO 13485:7.3.4',
      lastUpdated: '2025-06-23',
      version: '1.5',
      downloadUrl: '/templates/design-output-checklist.xlsx'
    },
    {
      id: 'TPL-005',
      name: 'Verification Protocol Template',
      description: 'Template for design verification test protocols',
      category: 'Verification',
      type: 'procedure',
      regulatoryStandard: 'ISO 13485:7.3.5',
      lastUpdated: '2025-06-23',
      version: '3.0',
      downloadUrl: '/templates/verification-protocol.docx'
    },
    {
      id: 'TPL-006',
      name: 'Validation Plan Template',
      description: 'Comprehensive validation planning template',
      category: 'Validation',
      type: 'document',
      regulatoryStandard: 'ISO 13485:7.3.6',
      lastUpdated: '2025-06-23',
      version: '2.2',
      downloadUrl: '/templates/validation-plan.docx'
    },
    {
      id: 'TPL-007',
      name: 'Design Review Form',
      description: 'Standardized form for design review documentation',
      category: 'Reviews',
      type: 'form',
      regulatoryStandard: 'ISO 13485:7.3.4',
      lastUpdated: '2025-06-23',
      version: '1.9',
      downloadUrl: '/templates/design-review-form.docx'
    },
    {
      id: 'TPL-008',
      name: 'Design Transfer Checklist',
      description: 'Checklist for design transfer to manufacturing',
      category: 'Transfer',
      type: 'checklist',
      regulatoryStandard: 'ISO 13485:7.3.7',
      lastUpdated: '2025-06-23',
      version: '1.6',
      downloadUrl: '/templates/design-transfer-checklist.xlsx'
    },
    {
      id: 'TPL-009',
      name: 'Risk Management File Template',
      description: 'ISO 14971 compliant risk management documentation',
      category: 'Risk Management',
      type: 'document',
      regulatoryStandard: 'ISO 14971',
      lastUpdated: '2025-06-23',
      version: '2.5',
      downloadUrl: '/templates/risk-management-file.docx'
    },
    {
      id: 'TPL-010',
      name: 'Traceability Matrix Template',
      description: 'Template for design control traceability matrix',
      category: 'Traceability',
      type: 'document',
      regulatoryStandard: 'ISO 13485:7.3',
      lastUpdated: '2025-06-23',
      version: '1.7',
      downloadUrl: '/templates/traceability-matrix.xlsx'
    }
  ];

  const categories = [
    'all',
    'Planning & URS',
    'Design Inputs',
    'Design Outputs',
    'Verification',
    'Validation',
    'Reviews',
    'Transfer',
    'Risk Management',
    'Traceability'
  ];

  const filteredTemplates = templates?.filter((template: DesignTemplate) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'checklist': return <Clipboard className="h-4 w-4" />;
      case 'form': return <FileCode className="h-4 w-4" />;
      case 'procedure': return <Settings className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'checklist': return 'bg-green-100 text-green-800';
      case 'form': return 'bg-purple-100 text-purple-800';
      case 'procedure': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading design templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Design Control Templates
        </h1>
        <p className="text-gray-600">
          ISO 13485 compliant templates for medical device design control processes
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template: DesignTemplate) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(template.type)}
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <Badge className={`text-xs ${getTypeColor(template.type)}`}>
                  {template.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-3">
                {template.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Category:</span>
                  <Badge variant="secondary">{template.category}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Standard:</span>
                  <span className="font-medium">{template.regulatoryStandard}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Version:</span>
                  <span className="font-medium">v{template.version}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Updated:</span>
                  <span className="font-medium">{template.lastUpdated}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1" onClick={() => {
                  // In a real implementation, this would download the template
                  console.log('Downloading template:', template.downloadUrl);
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  // In a real implementation, this would preview the template
                  console.log('Previewing template:', template.id);
                }}>
                  <BookOpen className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No design control templates are currently available.'}
          </p>
        </div>
      )}

      {/* Template Categories Info */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">
            ISO 13485 Design Control Templates
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Template Categories:</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Planning & URS - Design planning and user requirements</li>
              <li>• Design Inputs - Technical requirements and specifications</li>
              <li>• Design Outputs - Design deliverables and documentation</li>
              <li>• Verification - Design verification protocols and procedures</li>
              <li>• Validation - Design validation plans and reports</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Compliance Standards:</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• ISO 13485:2016 - Medical device quality management</li>
              <li>• ISO 14971 - Medical device risk management</li>
              <li>• IEC 62304 - Medical device software lifecycle</li>
              <li>• 21 CFR Part 820 - FDA Quality System Regulation</li>
              <li>• EU MDR 2017/745 - Medical Device Regulation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTemplates;