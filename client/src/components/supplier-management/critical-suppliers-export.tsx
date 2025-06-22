import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, AlertCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function CriticalSuppliersExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | null>(null);
  const { toast } = useToast();

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setIsExporting(true);
      setExportFormat(format);

      const endpoint = format === 'excel' 
        ? '/api/suppliers/export/critical/excel'
        : '/api/suppliers/export/critical/pdf';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `critical-suppliers-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Critical suppliers report exported as ${format.toUpperCase()}`
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export critical suppliers report",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Shield className="h-4 w-4" />
          Export Critical Suppliers
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Critical Suppliers Export
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive report of all critical suppliers including their addresses, 
            activities performed, and controls applied.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Critical Suppliers Only</p>
                <p className="text-yellow-700">
                  This report includes only suppliers marked as "Critical" with enhanced monitoring requirements.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  Excel Format (.xlsx)
                </CardTitle>
                <CardDescription className="text-xs">
                  Detailed spreadsheet with sorting and filtering capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button 
                  onClick={() => handleExport('excel')}
                  disabled={isExporting}
                  className="w-full"
                  variant="outline"
                >
                  {isExporting && exportFormat === 'excel' ? (
                    "Generating Excel..."
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Excel
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-red-600" />
                  PDF Format (.pdf)
                </CardTitle>
                <CardDescription className="text-xs">
                  Print-ready document for management review and audits
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button 
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                  className="w-full"
                  variant="outline"
                >
                  {isExporting && exportFormat === 'pdf' ? (
                    "Generating PDF..."
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Report includes:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Supplier contact information and addresses</li>
              <li>Activities performed and service categories</li>
              <li>Quality controls and risk mitigation measures</li>
              <li>Certification status and qualification dates</li>
              <li>Assessment history and compliance status</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}