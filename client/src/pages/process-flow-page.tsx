
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/page-header";
import ProcessFlowDesigner from "@/components/process-flow/process-flow-designer";

export default function ProcessFlowPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <Helmet>
        <title>Process Flow Designer | MedQMS</title>
      </Helmet>

      <PageHeader
        title="Process Flow Designer"
        description="Create and visualize process workflows with drag-and-drop interface"
      />

      <Card>
        <CardHeader>
          <CardTitle>Process Flow</CardTitle>
          <CardDescription>
            Drag and drop tasks to create process workflows. Connect tasks by dragging between connection points.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProcessFlowDesigner />
        </CardContent>
      </Card>
    </div>
  );
}
