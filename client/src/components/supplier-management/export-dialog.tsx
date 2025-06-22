import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Sheet, Filter } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ExportDialogProps {
  suppliers: any[];
  children: React.ReactNode;
}

const availableColumns = [
  { id: 'supplierId', label: 'Supplier ID', default: true },
  { id: 'name', label: 'Supplier Name', default: true },
  { id: 'contactName', label: 'Contact Name', default: true },
  { id: 'contactEmail', label: 'Contact Email', default: true },
  { id: 'contactPhone', label: 'Contact Phone', default: false },
  { id: 'fullAddress', label: 'Address', default: true },
  { id: 'criticality', label: 'Criticality', default: true },
  { id: 'currentRiskLevel', label: 'Risk Level', default: true },
  { id: 'qualificationDate', label: 'Qualification Date', default: true },
  { id: 'requalificationDate', label: 'Requalification Date', default: true },
  { id: 'hasQualityAgreement', label: 'Quality Agreement', default: false },
  { id: 'hasNda', label: 'NDA Status', default: false },
  { id: 'website', label: 'Website', default: false },
];

export function ExportDialog({ suppliers, children }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(
    availableColumns.filter(col => col.default).map(col => col.id)
  );
  const [filterApprovedOnly, setFilterApprovedOnly] = useState(true);
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async ({ format, columns, approvedOnly }: { 
      format: 'pdf' | 'excel', 
      columns: string[], 
      approvedOnly: boolean 
    }) => {
      const response = await fetch('/api/suppliers/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        },
        body: JSON.stringify({ format, columns, approvedOnly }),
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Get the blob data for download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `approved-suppliers.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Export Successful! 📄",
        description: `Suppliers exported to ${variables.format.toUpperCase()} successfully.`,
      });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export suppliers. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    exportMutation.mutate({ 
      format, 
      columns: selectedColumns, 
      approvedOnly: filterApprovedOnly 
    });
  };

  const approvedSuppliers = suppliers.filter(s => s.statusId === 3); // Assuming statusId 3 = Approved
  const exportCount = filterApprovedOnly ? approvedSuppliers.length : suppliers.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Supplier List
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filter Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-4 w-4" />
                Filter Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="approved-only"
                  checked={filterApprovedOnly}
                  onCheckedChange={(checked) => setFilterApprovedOnly(checked === true)}
                />
                <Label htmlFor="approved-only" className="text-sm">
                  Export approved suppliers only ({approvedSuppliers.length} suppliers)
                </Label>
              </div>
              {!filterApprovedOnly && (
                <p className="text-sm text-gray-600 mt-2">
                  Will export all {suppliers.length} suppliers regardless of status
                </p>
              )}
            </CardContent>
          </Card>

          {/* Column Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Columns to Export</CardTitle>
              <p className="text-sm text-gray-600">
                Choose which information to include in your report
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {availableColumns.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.id}
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={() => handleColumnToggle(column.id)}
                    />
                    <Label htmlFor={column.id} className="text-sm">
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  📊 <strong>{selectedColumns.length}</strong> columns selected • 
                  <strong> {exportCount}</strong> suppliers will be exported
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Export Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => handleExport('pdf')}
              disabled={selectedColumns.length === 0 || exportMutation.isPending}
              className="flex-1 gap-2"
            >
              <FileText className="h-4 w-4" />
              {exportMutation.isPending ? 'Generating...' : 'Export to PDF'}
            </Button>
            <Button
              onClick={() => handleExport('excel')}
              disabled={selectedColumns.length === 0 || exportMutation.isPending}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Sheet className="h-4 w-4" />
              {exportMutation.isPending ? 'Generating...' : 'Export to Excel'}
            </Button>
          </div>

          {selectedColumns.length === 0 && (
            <p className="text-sm text-red-600 text-center">
              Please select at least one column to export
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}