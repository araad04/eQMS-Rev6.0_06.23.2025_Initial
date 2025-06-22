import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// ISO 13485:2016 Management Review Input Categories
export const ISO13485_INPUT_CATEGORIES = [
  {
    id: 'feedback',
    name: 'Feedback',
    description: 'Including customer feedback and complaints',
    regulation: 'ISO 13485:2016 - 5.6.2(a)',
    required: true,
    examples: [
      'Customer satisfaction data',
      'Customer complaints',
      'Market feedback'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'complaints',
    name: 'Complaint Handling',
    description: 'Reporting of complaints and advisory notices',
    regulation: 'ISO 13485:2016 - 5.6.2(b)',
    required: true,
    examples: [
      'Complaint trends',
      'Complaint response time metrics',
      'Field action effectiveness'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'regulatory',
    name: 'Regulatory Reporting',
    description: 'Reporting to regulatory authorities',
    regulation: 'ISO 13485:2016 - 5.6.2(c)',
    required: true,
    examples: [
      'MDR/IVDR reportable incidents',
      'US FDA Medical Device Reports (MDRs)',
      'Regulatory submissions and approvals'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'monitoring',
    name: 'Process Monitoring & Measurement',
    description: 'Results of monitoring and measurement of processes',
    regulation: 'ISO 13485:2016 - 5.6.2(d)',
    required: true,
    examples: [
      'Process performance metrics',
      'Process capability studies',
      'Trend analysis of key process indicators'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'product',
    name: 'Product Monitoring & Measurement',
    description: 'Results of monitoring and measurement of product',
    regulation: 'ISO 13485:2016 - 5.6.2(e)',
    required: true,
    examples: [
      'Product performance data',
      'Nonconforming product trends',
      'Product holds and release metrics'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'corrective',
    name: 'Corrective Actions',
    description: 'Status of corrective actions',
    regulation: 'ISO 13485:2016 - 5.6.2(f)',
    required: true,
    examples: [
      'CAPA closure rates',
      'CAPA effectiveness',
      'Recurring issues identified through CAPAs'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'preventive',
    name: 'Preventive Actions',
    description: 'Status of preventive actions',
    regulation: 'ISO 13485:2016 - 5.6.2(g)',
    required: true,
    examples: [
      'Preventive action implementation status',
      'Risk reduction effectiveness',
      'Proactive improvement initiatives'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'previous',
    name: 'Previous Management Reviews',
    description: 'Follow-up actions from previous management reviews',
    regulation: 'ISO 13485:2016 - 5.6.2(h)',
    required: true,
    examples: [
      'Action item completion status',
      'Effectiveness of previous decisions',
      'Recurring issues from previous reviews'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'changes',
    name: 'Changes Affecting QMS',
    description: 'Changes that could affect the quality management system',
    regulation: 'ISO 13485:2016 - 5.6.2(i)',
    required: true,
    examples: [
      'New or revised regulations',
      'Organizational changes',
      'Process or technology changes'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'recommendations',
    name: 'Improvement Recommendations',
    description: 'Recommendations for improvement',
    regulation: 'ISO 13485:2016 - 5.6.2(j)',
    required: true,
    examples: [
      'Internal improvement suggestions',
      'External consultant recommendations',
      'Best practice adoptions'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'regulations',
    name: 'New or Revised Regulations',
    description: 'New or revised regulatory requirements',
    regulation: 'ISO 13485:2016 - 5.6.2(k)',
    required: true,
    examples: [
      'EU MDR/IVDR implementation',
      'US FDA regulatory changes',
      'International regulatory requirements'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'audit',
    name: 'Audit Results',
    description: 'Results of internal, external, and regulatory audits',
    regulation: 'ISO 13485:2016 - 5.6.2 (additional)',
    required: false,
    examples: [
      'Internal audit findings',
      'Notified Body audit results',
      'Regulatory inspection findings'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'risk',
    name: 'Risk Management',
    description: 'Risk management activities and results',
    regulation: 'MDR Article 10 & ISO 14971',
    required: false,
    examples: [
      'Risk assessment findings',
      'Post-market surveillance data',
      'Risk control measure effectiveness'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'resources',
    name: 'Resource Adequacy',
    description: 'Assessment of resource needs and adequacy',
    regulation: 'ISO 13485:2016 - 6.1',
    required: false,
    examples: [
      'Staffing levels and competency',
      'Equipment and infrastructure needs',
      'Budget allocation for quality activities'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'supplier',
    name: 'Supplier Performance',
    description: 'Performance evaluation of critical suppliers',
    regulation: 'ISO 13485:2016 - 7.4.1',
    required: false,
    examples: [
      'Supplier quality metrics',
      'Supplier audit results',
      'Supplier corrective actions'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
  {
    id: 'objectives',
    name: 'Quality Objectives',
    description: 'Status of quality objectives',
    regulation: 'ISO 13485:2016 - 5.4.1',
    required: false,
    examples: [
      'Progress towards quality goals',
      'Quality objective revisions',
      'New quality objectives'
    ],
    mdrRelevant: true,
    mdsapRelevant: true,
  },
];

interface InputCategoriesAccordionProps {
  showDetails?: boolean;
  onSelectCategory?: (category: typeof ISO13485_INPUT_CATEGORIES[0]) => void;
  selectedCategoryId?: string;
  className?: string;
}

export function InputCategoriesAccordion({
  showDetails = true,
  onSelectCategory,
  selectedCategoryId,
  className,
}: InputCategoriesAccordionProps) {
  return (
    <Accordion 
      type="single" 
      collapsible 
      className={cn("w-full", className)}
    >
      {ISO13485_INPUT_CATEGORIES.map((category) => (
        <AccordionItem key={category.id} value={category.id}>
          <AccordionTrigger 
            className={cn(
              "py-3 px-4 hover:no-underline text-left group",
              selectedCategoryId === category.id && "bg-muted/50"
            )}
            onClick={() => onSelectCategory && onSelectCategory(category)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-start">
                <span className="text-sm font-medium">{category.name}</span>
                {category.required && (
                  <Badge className="ml-2 text-xs" variant="outline">Required</Badge>
                )}
              </div>
              {!showDetails && (
                <span className="text-xs text-muted-foreground hidden group-hover:block">{category.regulation}</span>
              )}
            </div>
          </AccordionTrigger>
          {showDetails && (
            <AccordionContent className="px-4 pt-2 pb-4">
              <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
              <p className="text-xs text-muted-foreground mb-2">{category.regulation}</p>
              {category.examples && (
                <div className="mt-2">
                  <p className="text-xs font-medium mb-1">Examples:</p>
                  <ul className="text-xs text-muted-foreground list-disc pl-5">
                    {category.examples.map((example, i) => (
                      <li key={i}>{example}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                {category.mdrRelevant && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">MDR</Badge>
                )}
                {category.mdsapRelevant && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">MDSAP</Badge>
                )}
              </div>
            </AccordionContent>
          )}
        </AccordionItem>
      ))}
    </Accordion>
  );
}