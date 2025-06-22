import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Presentation, 
  Users, 
  Download, 
  Loader2, 
  CheckCircle,
  Calendar,
  Clock,
  Building,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface DocumentGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: any;
  reviewInputs: any[];
  actionItems: any[];
  users: any[];
}

export function DocumentGenerator({
  open,
  onOpenChange,
  review,
  reviewInputs,
  actionItems,
  users
}: DocumentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<string>('');
  const { toast } = useToast();

  // Safe date formatter to prevent "Invalid time value" errors
  const formatSafeDate = (dateValue: any, formatStr: string = 'MMMM d, yyyy'): string => {
    if (!dateValue) return 'TBD';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'TBD';
      return format(date, formatStr);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'TBD';
    }
  };

  // Generate PowerPoint-style Management Review Presentation
  const generatePresentationPDF = async () => {
    setIsGenerating(true);
    setGenerationType('presentation');
    
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Slide 1: Title Slide
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Management Review Presentation', pageWidth / 2, 40, { align: 'center' });
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'normal');
      pdf.text(review.title || 'Management Review', pageWidth / 2, 60, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.text(`Date: ${formatSafeDate(review.review_date)}`, pageWidth / 2, 80, { align: 'center' });
      pdf.text(`Status: ${review.status.toUpperCase()}`, pageWidth / 2, 95, { align: 'center' });
      
      // ISO 13485:2016 Section 5.6 reference
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'italic');
      pdf.text('ISO 13485:2016 Section 5.6 - Management Review', pageWidth / 2, 120, { align: 'center' });
      
      // Company footer
      pdf.setFontSize(10);
      pdf.text('eQMS - Quality Management System', pageWidth / 2, pageHeight - 15, { align: 'center' });

      // Slide 2: Review Overview
      pdf.addPage();
      yPosition = margin;
      
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Review Overview', margin, yPosition);
      yPosition += 20;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      // Purpose and Scope
      if (review.description) {
        const lines = pdf.splitTextToSize(review.description, pageWidth - 2 * margin);
        pdf.text('Purpose & Scope:', margin, yPosition);
        yPosition += 8;
        pdf.text(lines, margin + 10, yPosition);
        yPosition += lines.length * 5 + 10;
      }
      
      // Review Statistics
      pdf.setFont('helvetica', 'bold');
      pdf.text('Review Statistics:', margin, yPosition);
      yPosition += 10;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`• Total Inputs: ${reviewInputs.length}`, margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`• Action Items: ${actionItems.length}`, margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`• Review Type: ${review.review_type}`, margin + 10, yPosition);
      yPosition += 6;

      // Slide 3: Input Categories Summary
      if (reviewInputs.length > 0) {
        pdf.addPage();
        yPosition = margin;
        
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Management Review Inputs Summary', margin, yPosition);
        yPosition += 20;
        
        // Group inputs by category
        const inputsByCategory = reviewInputs.reduce((acc, input) => {
          const category = input.category || 'General';
          if (!acc[category]) acc[category] = [];
          acc[category].push(input);
          return acc;
        }, {} as Record<string, any[]>);
        
        Object.entries(inputsByCategory).forEach(([category, inputs]) => {
          const typedInputs = inputs as any[];
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${category.replace('_', ' ').toUpperCase()} (${typedInputs.length})`, margin, yPosition);
          yPosition += 10;
          
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          
          typedInputs.slice(0, 3).forEach(input => {
            const title = input.title || 'Input';
            const shortTitle = title.length > 60 ? title.substring(0, 60) + '...' : title;
            pdf.text(`• ${shortTitle}`, margin + 5, yPosition);
            yPosition += 5;
            
            if (input.priority) {
              pdf.setFont('helvetica', 'italic');
              pdf.text(`  Priority: ${input.priority} | Status: ${input.complianceStatus || 'N/A'}`, margin + 10, yPosition);
              yPosition += 5;
              pdf.setFont('helvetica', 'normal');
            }
          });
          
          if (typedInputs.length > 3) {
            pdf.setFont('helvetica', 'italic');
            pdf.text(`  ... and ${typedInputs.length - 3} more inputs`, margin + 5, yPosition);
            yPosition += 5;
            pdf.setFont('helvetica', 'normal');
          }
          
          yPosition += 8;
          
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = margin;
          }
        });
      }

      // Slide 4: Key Findings & Trends
      pdf.addPage();
      yPosition = margin;
      
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Findings & Performance Trends', margin, yPosition);
      yPosition += 20;
      
      // Compliance Status Summary
      const complianceStats = reviewInputs.reduce((acc, input) => {
        const status = input.complianceStatus || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Compliance Status Overview:', margin, yPosition);
      yPosition += 12;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      Object.entries(complianceStats).forEach(([status, count]) => {
        pdf.text(`• ${status.replace('_', ' ').toUpperCase()}: ${count} inputs`, margin + 10, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
      
      // Priority Analysis
      const priorityStats = reviewInputs.reduce((acc, input) => {
        const priority = input.priority || 'unknown';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {});
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Priority Distribution:', margin, yPosition);
      yPosition += 12;
      
      pdf.setFont('helvetica', 'normal');
      Object.entries(priorityStats).forEach(([priority, count]) => {
        pdf.text(`• ${priority.toUpperCase()}: ${count} inputs`, margin + 10, yPosition);
        yPosition += 6;
      });

      // Slide 5: Action Items & Next Steps
      if (actionItems.length > 0) {
        pdf.addPage();
        yPosition = margin;
        
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Action Items & Next Steps', margin, yPosition);
        yPosition += 20;
        
        actionItems.slice(0, 8).forEach((action, index) => {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${action.title}`, margin, yPosition);
          yPosition += 8;
          
          pdf.setFont('helvetica', 'normal');
          if (action.description) {
            const desc = action.description.length > 80 ? action.description.substring(0, 80) + '...' : action.description;
            pdf.text(desc, margin + 5, yPosition);
            yPosition += 6;
          }
          
          pdf.setFontSize(10);
          pdf.text(`Priority: ${action.priority} | Due: ${formatSafeDate(action.dueDate, 'MMM d, yyyy')} | Assigned: ${action.assignedTo}`, margin + 5, yPosition);
          yPosition += 10;
          
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = margin;
          }
        });
      }

      // Final Slide: Conclusion & Approval
      pdf.addPage();
      yPosition = margin;
      
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Management Review Conclusion', margin, yPosition);
      yPosition += 30;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      
      if (review.conclusion) {
        const conclusionLines = pdf.splitTextToSize(review.conclusion, pageWidth - 2 * margin);
        pdf.text('Review Conclusion:', margin, yPosition);
        yPosition += 10;
        pdf.text(conclusionLines, margin, yPosition);
        yPosition += conclusionLines.length * 6 + 15;
      }
      
      // Approval section
      pdf.setFont('helvetica', 'bold');
      pdf.text('Review Approval:', margin, yPosition);
      yPosition += 15;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Management Representative: _________________________   Date: ___________', margin, yPosition);
      yPosition += 15;
      pdf.text('Quality Manager: ________________________________   Date: ___________', margin, yPosition);
      yPosition += 15;
      pdf.text('Top Management: _________________________________   Date: ___________', margin, yPosition);

      pdf.save(`Management_Review_Presentation_${review.id}_${formatSafeDate(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "Success",
        description: "Management Review presentation generated successfully",
      });
      
    } catch (error) {
      console.error('Error generating presentation:', error);
      toast({
        title: "Error",
        description: "Failed to generate presentation",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationType('');
    }
  };

  // Generate Management Review Minutes
  const generateMinutesPDF = async () => {
    setIsGenerating(true);
    setGenerationType('minutes');
    
    try {
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MANAGEMENT REVIEW MEETING MINUTES', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('ISO 13485:2016 Section 5.6 - Management Review', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Meeting Details
      pdf.setFont('helvetica', 'bold');
      pdf.text('MEETING DETAILS', margin, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Meeting Title: ${review.title}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Date: ${formatSafeDate(review.review_date)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Review Type: ${review.review_type}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Status: ${review.status}`, margin, yPosition);
      yPosition += 15;

      // Purpose and Scope
      if (review.description) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('PURPOSE & SCOPE', margin, yPosition);
        yPosition += 8;
        
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(review.description, pageWidth - 2 * margin);
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * 5 + 15;
      }

      // Attendees Section
      pdf.setFont('helvetica', 'bold');
      pdf.text('ATTENDEES', margin, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      users.forEach(user => {
        pdf.text(`□ ${user.firstName} ${user.lastName} - ${user.department}`, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 10;

      // Review Inputs Summary
      if (reviewInputs.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('REVIEW INPUTS DISCUSSED', margin, yPosition);
        yPosition += 8;
        
        reviewInputs.forEach((input, index) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${input.title || 'Input'}`, margin, yPosition);
          yPosition += 6;
          
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Category: ${input.category?.replace('_', ' ') || 'General'}`, margin + 5, yPosition);
          yPosition += 5;
          pdf.text(`Priority: ${input.priority || 'N/A'} | Compliance: ${input.complianceStatus || 'N/A'}`, margin + 5, yPosition);
          yPosition += 5;
          
          if (input.description) {
            const descLines = pdf.splitTextToSize(input.description, pageWidth - 2 * margin - 10);
            pdf.text(descLines, margin + 5, yPosition);
            yPosition += descLines.length * 4 + 5;
          }
          yPosition += 5;
        });
      }

      // Action Items
      if (actionItems.length > 0) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('ACTION ITEMS', margin, yPosition);
        yPosition += 8;
        
        actionItems.forEach((action, index) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${action.title}`, margin, yPosition);
          yPosition += 6;
          
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Assigned to: ${action.assignedTo}`, margin + 5, yPosition);
          yPosition += 5;
          pdf.text(`Due Date: ${formatSafeDate(action.dueDate, 'MMM d, yyyy')}`, margin + 5, yPosition);
          yPosition += 5;
          pdf.text(`Priority: ${action.priority}`, margin + 5, yPosition);
          yPosition += 5;
          
          if (action.description) {
            const actionLines = pdf.splitTextToSize(action.description, pageWidth - 2 * margin - 10);
            pdf.text(actionLines, margin + 5, yPosition);
            yPosition += actionLines.length * 4 + 8;
          }
        });
      }

      // Conclusion
      if (yPosition > 220) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('MEETING CONCLUSION', margin, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      if (review.conclusion) {
        const conclusionLines = pdf.splitTextToSize(review.conclusion, pageWidth - 2 * margin);
        pdf.text(conclusionLines, margin, yPosition);
        yPosition += conclusionLines.length * 5 + 15;
      } else {
        pdf.text('Meeting conclusion to be documented upon completion.', margin, yPosition);
        yPosition += 15;
      }

      // Signatures
      pdf.setFont('helvetica', 'bold');
      pdf.text('APPROVALS', margin, yPosition);
      yPosition += 15;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Management Representative: _________________________   Date: ___________', margin, yPosition);
      yPosition += 15;
      pdf.text('Quality Manager: ________________________________   Date: ___________', margin, yPosition);
      yPosition += 15;
      pdf.text('Top Management: _________________________________   Date: ___________', margin, yPosition);

      pdf.save(`Management_Review_Minutes_${review.id}_${formatSafeDate(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "Success",
        description: "Management Review minutes generated successfully",
      });
      
    } catch (error) {
      console.error('Error generating minutes:', error);
      toast({
        title: "Error",
        description: "Failed to generate meeting minutes",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationType('');
    }
  };

  // Generate Attendance Sheet
  const generateAttendanceSheet = async () => {
    setIsGenerating(true);
    setGenerationType('attendance');
    
    try {
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MANAGEMENT REVIEW ATTENDANCE SHEET', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('ISO 13485:2016 Section 5.6 - Management Review', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Meeting Details
      pdf.setFont('helvetica', 'bold');
      pdf.text('MEETING DETAILS', margin, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Meeting Title: ${review.title}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Date: ${formatSafeDate(review.review_date)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Time: _____________ to _____________`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Location: _________________________________`, margin, yPosition);
      yPosition += 20;

      // Attendance Table Header
      pdf.setFont('helvetica', 'bold');
      pdf.text('ATTENDEE INFORMATION', margin, yPosition);
      yPosition += 10;
      
      // Table headers
      const tableHeaders = ['Name', 'Department', 'Role', 'Signature'];
      const columnWidths = [50, 40, 40, 50];
      let xPosition = margin;
      
      pdf.setFont('helvetica', 'bold');
      tableHeaders.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += columnWidths[index];
      });
      yPosition += 8;
      
      // Draw header line
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Add system users
      pdf.setFont('helvetica', 'normal');
      users.forEach(user => {
        xPosition = margin;
        pdf.text(`${user.firstName} ${user.lastName}`, xPosition, yPosition);
        xPosition += columnWidths[0];
        pdf.text(user.department, xPosition, yPosition);
        xPosition += columnWidths[1];
        pdf.text(user.role, xPosition, yPosition);
        xPosition += columnWidths[2];
        pdf.text('_________________________', xPosition, yPosition);
        yPosition += 8;
      });

      // Add blank rows for additional attendees
      for (let i = 0; i < 10; i++) {
        xPosition = margin;
        pdf.text('_________________________', xPosition, yPosition);
        xPosition += columnWidths[0];
        pdf.text('________________', xPosition, yPosition);
        xPosition += columnWidths[1];
        pdf.text('________________', xPosition, yPosition);
        xPosition += columnWidths[2];
        pdf.text('_________________________', xPosition, yPosition);
        yPosition += 8;
        
        if (yPosition > 250) break;
      }

      // Footer information
      yPosition = 250;
      pdf.setFont('helvetica', 'bold');
      pdf.text('MEETING CHAIRPERSON', margin, yPosition);
      yPosition += 10;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Name: _________________________________   Signature: _______________________', margin, yPosition);
      yPosition += 15;
      pdf.text('Date: _________________________________', margin, yPosition);

      pdf.save(`Management_Review_Attendance_${review.id}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "Success",
        description: "Attendance sheet generated successfully",
      });
      
    } catch (error) {
      console.error('Error generating attendance sheet:', error);
      toast({
        title: "Error",
        description: "Failed to generate attendance sheet",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationType('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Management Review Document Generator
          </DialogTitle>
          <DialogDescription>
            Generate professional documents for ISO 13485:2016 Section 5.6 compliance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* PowerPoint Presentation */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded">
                    <Presentation className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Management Review Presentation</CardTitle>
                    <CardDescription>
                      Professional presentation with key findings, trends, and recommendations
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-muted-foreground">Includes:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Executive summary and overview</li>
                  <li>• Input categories and findings</li>
                  <li>• Performance trends and analysis</li>
                  <li>• Action items and next steps</li>
                  <li>• Approval and conclusion slides</li>
                </ul>
              </div>
              <Button 
                onClick={generatePresentationPDF}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating && generationType === 'presentation' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Presentation PDF
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Meeting Minutes */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Meeting Minutes</CardTitle>
                    <CardDescription>
                      Formal meeting minutes with inputs, discussions, and decisions
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-muted-foreground">Includes:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Meeting details and attendees</li>
                  <li>• Detailed review inputs discussion</li>
                  <li>• Action items with assignments</li>
                  <li>• Conclusions and decisions</li>
                  <li>• Approval signatures section</li>
                </ul>
              </div>
              <Button 
                onClick={generateMinutesPDF}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating && generationType === 'minutes' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Meeting Minutes PDF
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Attendance Sheet */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Attendance Sheet</CardTitle>
                    <CardDescription>
                      Professional attendance tracking for meeting participants
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-muted-foreground">Includes:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Meeting information header</li>
                  <li>• Pre-populated user list</li>
                  <li>• Signature columns</li>
                  <li>• Additional attendee rows</li>
                  <li>• Chairperson approval section</li>
                </ul>
              </div>
              <Button 
                onClick={generateAttendanceSheet}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating && generationType === 'attendance' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Attendance Sheet PDF
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Review Information Summary */}
          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Document Generation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium">Review:</span> {review.title}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {formatSafeDate(review.review_date, 'MMM d, yyyy')}
                </div>
                <div>
                  <span className="font-medium">Inputs:</span> {reviewInputs.length}
                </div>
                <div>
                  <span className="font-medium">Actions:</span> {actionItems.length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}