import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import ComplaintsTable from '@/components/measurement-analysis/complaints-table';
import CustomerFeedbackTable from '@/components/measurement-analysis/customer-feedback-table';
import CalibrationAssetsList from '@/components/measurement-analysis/calibration-assets-list.tsx';

export default function MeasurementAnalysisPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("complaints");

  // Fetch complaints data
  const complaintsQuery = useQuery({
    queryKey: ['/api/complaints'],
    enabled: !!user,
  });

  // Fetch customer feedback data
  const feedbackQuery = useQuery({
    queryKey: ['/api/customer-feedback'],
    enabled: !!user,
  });

  // Fetch calibration assets data
  const assetsQuery = useQuery({
    queryKey: ['/api/calibration-assets'],
    enabled: !!user,
  });

  const isLoading = complaintsQuery.isLoading || feedbackQuery.isLoading || assetsQuery.isLoading;

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Measurement & Analysis"
        description="Track and analyze customer complaints, feedback, and calibration data"
      />

      <Tabs defaultValue="complaints" value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="feedback">Customer Feedback</TabsTrigger>
          <TabsTrigger value="calibration">Calibration</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <TabsContent value="complaints">
              <ComplaintsTable 
                data={complaintsQuery.data || []} 
                isLoading={complaintsQuery.isLoading} 
              />
            </TabsContent>

            <TabsContent value="feedback">
              <CustomerFeedbackTable 
                data={feedbackQuery.data || []} 
                isLoading={feedbackQuery.isLoading} 
              />
            </TabsContent>

            <TabsContent value="calibration">
              <CalibrationAssetsList 
                data={assetsQuery.data || []} 
                isLoading={assetsQuery.isLoading} 
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}