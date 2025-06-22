import { PageHeader } from "@/components/layout/page-header";
import { ArrowLeft } from "lucide-react";
import { CapaCreateForm } from "@/components/capa/capa-create-form";

export default function CapaCreate() {
  return (
    <>
      <PageHeader 
        title="Create CAPA"
        description="Create a new corrective or preventive action"
        actions={[
          {
            label: "Back to CAPA List",
            href: "/capa-management",
            icon: <ArrowLeft className="h-5 w-5" />,
            variant: "outline",
          }
        ]}
      />
      
      <CapaCreateForm />
    </>
  );
}