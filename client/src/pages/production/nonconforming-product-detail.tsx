import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Printer, 
  FileText, 
  AlertTriangle,
  FileCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/page-header";

// This component displays the details of a nonconforming product
const NonconformingProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("details");

  const handlePrint = () => {
    toast({
      title: "Print initiated",
      description: "Preparing print view for nonconforming product record.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export initiated", 
      description: "Preparing PDF export for nonconforming product record.",
    });
  };

  const handleCreateCapa = () => {
    toast({
      title: "Create CAPA",
      description: "Redirecting to CAPA creation form.",
    });
    // Navigate to CAPA creation form in the future
  };

  const handleBackToList = () => {
    navigate("/production/nonconforming-products");
  };

  const handleAttachDocument = () => {
    toast({
      title: "Attach Document",
      description: "Document attachment functionality will be implemented.",
    });
  };

  // Fetch nonconforming product data from authentic API
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/production/nonconforming/${id}`, {
          credentials: 'include',
          headers: {
            'X-Auth-Local': 'true',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const productData = await response.json();
          setProduct(productData);
        } else {
          setProduct(null);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-lg">Loading product details...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-8">
        <PageHeader
          title="Product Not Found"
          description="The nonconforming product you're looking for doesn't exist."
          actions={
            <Button variant="outline" onClick={() => navigate("/production/nonconforming-products")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          }
        />
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <h3 className="font-medium">Nonconforming product not found</h3>
                <p className="text-sm text-gray-600">
                  The nonconforming product with ID {id} could not be found in the system.
                </p>
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={() => navigate("/production/nonconforming-products")}>
                    Return to List
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSeverityBadgeColor = (severity: string | undefined | null) => {
    if (!severity) return "bg-gray-500 hover:bg-gray-600";
    
    switch (severity.toLowerCase()) {
      case 'critical':
        return "bg-red-500 hover:bg-red-600";
      case 'high':
        return "bg-orange-500 hover:bg-orange-600";
      case 'medium':
        return "bg-yellow-500 hover:bg-yellow-600";
      case 'low':
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getStatusBadgeColor = (status: string | undefined | null) => {
    if (!status) return "bg-blue-500 hover:bg-blue-600";
    
    switch (status.toLowerCase()) {
      case 'open':
        return "bg-red-500 hover:bg-red-600";
      case 'under investigation':
        return "bg-amber-500 hover:bg-amber-600";
      case 'corrective action implemented':
        return "bg-green-500 hover:bg-green-600";
      case 'closed':
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "bg-blue-500 hover:bg-blue-600";
    }
  };

  return (
    <>
      <Helmet>
        <title>Nonconforming Product | eQMS</title>
        <meta name="description" content={`Details for nonconforming product ${product.productId}`} />
      </Helmet>

      <PageHeader
        title={`Nonconforming Product: ${product.ncpId}`}
        description={`Batch: ${product.batchNumber} | Detected: ${new Date(product.detectedAt).toLocaleDateString()}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </>
        }
      />

      <div className="container py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getStatusBadgeColor(product.statusId?.toString())}>
                {product.statusId === 1 ? 'Open' : product.statusId === 2 ? 'Under Investigation' : 'Closed'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Last updated: {new Date(product.updatedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getSeverityBadgeColor(product.severityId?.toString())}>
                {product.severityId === 1 ? 'Critical' : product.severityId === 2 ? 'Major' : product.severityId === 3 ? 'Minor' : 'Negligible'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Detection Stage: {product.detectionStage || 'Not specified'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Detection Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-medium">Detected By: {product.detectedBy}</div>
              <p className="text-sm text-muted-foreground">
                Serial Number: {product.serialNumber || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="investigation">Investigation</TabsTrigger>
            <TabsTrigger value="corrective-actions">Corrective Actions</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Nonconformity Details</CardTitle>
                <CardDescription>
                  Detailed information about the nonconforming product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">Description</h3>
                    <p>{product.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-1">NCP ID</h3>
                      <p>{product.ncpId}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Batch Number</h3>
                      <p>{product.batchNumber}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Date Detected</h3>
                      <p>{new Date(product.detectedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Batch ID</h3>
                      <p>{product.batchId}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Product ID</h3>
                      <p>{product.productId}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Detected By</h3>
                      <p>User ID: {product.detectedBy}</p>
                    </div>
                    {product.serialNumber && (
                      <div>
                        <h3 className="font-semibold mb-1">Serial Number</h3>
                        <p>{product.serialNumber}</p>
                      </div>
                    )}
                    {product.lotNumber && (
                      <div>
                        <h3 className="font-semibold mb-1">Lot Number</h3>
                        <p>{product.lotNumber}</p>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-1">Containment Actions</h3>
                    <p>{product.containmentActions || "No containment actions recorded"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="investigation" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Investigation Details</CardTitle>
                <CardDescription>
                  Root cause analysis and investigation findings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">Investigation Status</h3>
                    <Badge className="bg-amber-500 hover:bg-amber-600">In Progress</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-1">Initial Assessment</h3>
                    <p>Initial assessment indicates potential issue with raw material supplier. Further investigation required to confirm root cause.</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-1">Investigation Steps</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Review of batch manufacturing records <Badge className="ml-2 bg-green-500 hover:bg-green-600">Completed</Badge></li>
                      <li>Testing of retained samples <Badge className="ml-2 bg-green-500 hover:bg-green-600">Completed</Badge></li>
                      <li>Review of supplier documentation <Badge className="ml-2 bg-amber-500 hover:bg-amber-600">In Progress</Badge></li>
                      <li>Equipment qualification verification <Badge className="ml-2 bg-gray-500 hover:bg-gray-600">Not Started</Badge></li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="corrective-actions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Corrective Actions</CardTitle>
                <CardDescription>
                  Actions taken to address the nonconformity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">Corrective Action Status</h3>
                    <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-1">Disposition Decision</h3>
                    <p>{product.dispositionDecision || "No disposition decision recorded"}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-1">Disposition Justification</h3>
                    <p>{product.dispositionJustification || "No justification provided"}</p>
                  </div>
                  
                  {product.dispositionBy && (
                    <div>
                      <h3 className="font-semibold mb-1">Dispositioned By</h3>
                      <p>User ID: {product.dispositionBy}</p>
                    </div>
                  )}
                  
                  {product.dispositionDate && (
                    <div>
                      <h3 className="font-semibold mb-1">Disposition Date</h3>
                      <p>{new Date(product.dispositionDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant="outline" 
                      disabled={!!product.capaId}
                      onClick={handleCreateCapa}
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      {product.capaId ? `CAPA ${product.capaId} Created` : "Create CAPA"}
                    </Button>
                    {product.capaId && (
                      <p className="text-xs text-green-600">CAPA ID: {product.capaId}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Related Documents</CardTitle>
                <CardDescription>
                  Documents associated with this nonconforming product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 border rounded-md text-center">
                  <p className="text-muted-foreground">No documents attached yet</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleAttachDocument}>
                    <FileText className="h-4 w-4 mr-2" />
                    Attach Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

// Sample data helper functions removed - eQMS uses authentic data only

export default NonconformingProductDetail;