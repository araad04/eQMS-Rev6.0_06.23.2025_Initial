import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function TestKPIWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Test KPI Widget</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold text-blue-600">123</div>
        <div className="text-xs text-gray-500">Test Metric</div>
      </CardContent>
    </Card>
  );
}