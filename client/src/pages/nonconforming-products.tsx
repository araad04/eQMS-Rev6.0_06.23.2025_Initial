import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";

export default function NonconformingProductsPage() {
  const [, navigate] = useLocation();

  return (
    <div className="container p-6">
      <PageHeader
        title="Nonconforming Products"
        description="Manage nonconforming products per ISO 13485:2016 section 8.3 requirements"
      />
      
      <div className="flex justify-end mb-6">
        <Button onClick={() => navigate('/production/nonconforming-products/create')} variant="default">
          <Plus className="mr-2 h-4 w-4" /> Register New
        </Button>
      </div>
      
      {/* Table will be added here later */}
    </div>
  );
}