import React from "react";
import { Helmet } from "react-helmet";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { 
  Plus, 
  FileSpreadsheet, 
  FileText, 
  AlertTriangle,
  Check,
  X,
  Search 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { navigateTo } from "@/lib/navigation";

const CriticalSuppliersPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleExport = (type: "excel" | "pdf") => {
    toast({
      title: `Exporting to ${type.toUpperCase()}`,
      description: "This feature will be implemented in a future update.",
    });
  };

  // Empty array to store critical suppliers
  const criticalSuppliers: Array<{
    id: number;
    name: string;
    category: string;
    criticalityScore: number;
    riskLevel: string;
    lastAudit: string;
    nextAudit: string;
    complianceStatus: string;
    contactPerson: string;
  }> = [];

  // Filter suppliers based on search term
  const filteredSuppliers = criticalSuppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.riskLevel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.complianceStatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskLevelBadgeColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return "bg-red-500 hover:bg-red-600";
      case 'medium':
        return "bg-yellow-500 hover:bg-yellow-600";
      case 'low':
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getComplianceStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant':
        return "bg-green-500 hover:bg-green-600";
      case 'non-compliant':
        return "bg-red-500 hover:bg-red-600";
      case 'under review':
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <>
      <Helmet>
        <title>Critical Suppliers | eQMS</title>
        <meta name="description" content="Manage critical suppliers and their risk assessment" />
      </Helmet>

      <PageHeader
        title="Critical Suppliers"
        description="Manage critical suppliers, their risk assessment, and compliance monitoring"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              size="sm"
              onClick={() => navigateTo('/supplier-management/create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Critical Supplier
            </Button>
          </>
        }
      />

      <div className="container py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">High Risk</CardTitle>
              <CardDescription>Critical suppliers with high risk level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">0</div>
              <p className="text-sm text-muted-foreground">No high risk suppliers yet</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Non-Compliant</CardTitle>
              <CardDescription>Suppliers requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">0</div>
              <p className="text-sm text-muted-foreground">No non-compliant suppliers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Upcoming Audits</CardTitle>
              <CardDescription>Due in next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">0</div>
              <p className="text-sm text-muted-foreground">No upcoming audits scheduled</p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quality Alert</CardTitle>
            <CardDescription>Recent supplier quality issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <h3 className="font-medium">Quality Deviation: Quality Medical Systems</h3>
                <p className="text-sm text-gray-600">Recent packaging materials failed to meet ISO 11607 requirements. CAPA required.</p>
                <div className="mt-2">
                  <Button size="sm" variant="default">View Details</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Critical Suppliers List</h2>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Criticality Score</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Last Audit</TableHead>
                <TableHead>Next Audit</TableHead>
                <TableHead>Compliance Status</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">{supplier.criticalityScore}</span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            supplier.criticalityScore >= 80 
                              ? 'bg-red-500' 
                              : supplier.criticalityScore >= 60 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${supplier.criticalityScore}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRiskLevelBadgeColor(supplier.riskLevel)}>
                      {supplier.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>{supplier.lastAudit}</TableCell>
                  <TableCell>{supplier.nextAudit}</TableCell>
                  <TableCell>
                    <Badge className={getComplianceStatusBadgeColor(supplier.complianceStatus)}>
                      {supplier.complianceStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{supplier.contactPerson}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4">
                    No matching suppliers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default CriticalSuppliersPage;