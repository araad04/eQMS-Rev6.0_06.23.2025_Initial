import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle, AlertTriangle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const sampleCriticalSuppliers = [
  {
    name: "MedTech Components Ltd",
    supplierId: "SUP-CRIT-001",
    description: "Critical supplier for medical device components and assemblies",
    categoryId: 1,
    statusId: 1,
    criticality: "Critical",
    contactName: "Dr. Sarah Johnson",
    contactEmail: "sarah.johnson@medtech-components.com",
    contactPhone: "+1-555-0123",
    address: "1234 Medical Device Blvd, Suite 100",
    city: "Boston",
    state: "MA",
    country: "United States",
    postalCode: "02101",
    qualificationDate: "2024-01-15",
    requalificationDate: "2025-01-15"
  },
  {
    name: "Precision Electronics Corp",
    supplierId: "SUP-CRIT-002", 
    description: "Critical electronic components for life-support devices",
    categoryId: 1,
    statusId: 1,
    criticality: "Critical",
    contactName: "Michael Chen",
    contactEmail: "michael.chen@precision-electronics.com",
    contactPhone: "+1-555-0456",
    address: "789 Technology Park Drive",
    city: "San Jose",
    state: "CA",
    country: "United States",
    postalCode: "95134",
    qualificationDate: "2024-03-20",
    requalificationDate: "2025-03-20"
  },
  {
    name: "BioMaterials International",
    supplierId: "SUP-MAJOR-001",
    description: "Biocompatible materials for implantable devices",
    categoryId: 2,
    statusId: 1,
    criticality: "Major",
    contactName: "Dr. Emma Rodriguez",
    contactEmail: "emma.rodriguez@biomaterials-intl.com",
    contactPhone: "+1-555-0789",
    address: "456 Research Boulevard",
    city: "Austin",
    state: "TX",
    country: "United States",
    postalCode: "78759",
    qualificationDate: "2023-06-10",
    requalificationDate: "2025-06-10"
  }
];

export function DemoDataCreator() {
  // This component is disabled - only authentic data should be used
  return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          Sample Critical Suppliers Data
        </CardTitle>
        <CardDescription>
          Create sample critical suppliers to demonstrate export functionality and automatic date calculations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="font-medium">Critical Suppliers</h3>
            <p className="text-sm text-gray-600">2 suppliers (1 year requalification)</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-2 bg-yellow-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="font-medium">Major Suppliers</h3>
            <p className="text-sm text-gray-600">1 supplier (2 year requalification)</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-2 bg-green-100 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-medium">Total Sample Data</h3>
            <p className="text-sm text-gray-600">3 suppliers with complete data</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium mb-2">Sample Data Includes:</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• Complete supplier information (name, address, contacts)</p>
            <p>• Automatic requalification date calculations</p>
            <p>• Criticality-based risk assessments</p>
            <p>• Activities performed and controls applied</p>
            <p>• Qualification status and assessment dates</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={createSampleData}
            disabled={isCreating}
            className="flex-1"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Sample Data...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Sample Suppliers
              </>
            )}
          </Button>
          
          {createdCount > 0 && (
            <Badge variant="secondary" className="self-center">
              {createdCount} suppliers created
            </Badge>
          )}
        </div>

        {createdCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Sample Data Created Successfully</p>
                <p className="text-sm text-green-700">
                  You can now test the critical suppliers export functionality and view the automatic requalification dates.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}