import React, { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  User, 
  Calendar, 
  Award,
  ArrowLeft
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { navigateTo } from '@/lib/navigation';

// Define types
interface TrainingRecord {
  id: number;
  userId: number;
  moduleId: number;
  employee: string;
  department: string;
  training: string;
  trainingType: string;
  assignedBy: string;
  assignedDate: string;
  dueDate: string;
  completedDate: string | null;
  expiryDate: string | null;
  status: string;
  score: number | null;
  comments: string | null;
}

const TrainingRecordDetail: React.FC = () => {
  const [, params] = useRoute('/training-records/:id');
  const id = params?.id;
  const [record, setRecord] = useState<TrainingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchTrainingRecord = async () => {
      try {
        setIsLoading(true);
        
        // Try to get data from API first
        try {
          console.log(`Fetching training record with ID: ${id}`);
          const response = await fetch(`/api/training/records/${id}`, {
            headers: {
              'Content-Type': 'application/json',
              'X-Auth-Local': 'true'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setRecord(data);
            return;
          }
        } catch (apiErr) {
          console.error("API error:", apiErr);
        }
        
        // Fallback - try to get from localStorage
        const storedAssignments = localStorage.getItem('trainingAssignments');
        if (storedAssignments) {
          try {
            const parsedAssignments = JSON.parse(storedAssignments);
            const foundRecord = parsedAssignments.find((r: any) => r.id.toString() === id);
            
            if (foundRecord) {
              setRecord(foundRecord);
              return;
            }
          } catch (e) {
            console.error("Error parsing stored training assignments:", e);
          }
        }
        
        // If we're still here, check mock data
        const mockRecord = {
          id: parseInt(id as string),
          userId: 9999,
          moduleId: 1,
          employee: "Development User",
          department: "Quality Assurance",
          training: "ISO 13485:2016 Overview",
          trainingType: "Regulatory",
          assignedBy: "Admin User",
          assignedDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          completedDate: null,
          expiryDate: null,
          status: "assigned",
          score: null,
          comments: "Required regulatory training for all QA personnel"
        };
        
        setRecord(mockRecord);
      } catch (err) {
        console.error("Error fetching training record:", err);
        setError("Failed to load training record details");
        
        toast({
          title: "Error",
          description: "Could not load training record details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchTrainingRecord();
    }
  }, [id, toast]);

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get status badge with color
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'assigned':
        return <Badge className="bg-blue-500">Assigned</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Handle marking training as completed
  const handleMarkComplete = async () => {
    try {
      toast({
        title: "Training Completion",
        description: "This functionality will be implemented in a future update.",
      });
    } catch (error) {
      console.error("Error marking training as complete:", error);
      toast({
        title: "Error",
        description: "Failed to mark training as complete",
        variant: "destructive"
      });
    }
  };
  
  // Handle downloading certificate
  const handleDownloadCertificate = () => {
    toast({
      title: "Certificate Download",
      description: "Certificate download functionality will be implemented in a future update.",
    });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }
  
  if (error || !record) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700">
          <h2 className="text-lg font-semibold">Error</h2>
          <p>{error || "Training record not found"}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigateTo('/training-records')}>
            Return to Training Records
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader
        heading="Training Record Details"
        subheading={record.training}
      >
        <Button variant="outline" onClick={() => navigateTo('/training-records')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Records
        </Button>
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Training Information</CardTitle>
            <CardDescription>Details about the assigned training module</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Training Module</h3>
                  <p className="text-muted-foreground">{record.training}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Type</h3>
                  <p className="text-muted-foreground">{record.trainingType}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Assignee</h3>
                  <p className="text-muted-foreground">{record.employee}</p>
                  <p className="text-sm text-muted-foreground">Department: {record.department}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Assigned Date</h3>
                  <p className="text-muted-foreground">{formatDate(record.assignedDate)}</p>
                  <p className="text-sm text-muted-foreground">By: {record.assignedBy}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Due Date</h3>
                  <p className="text-muted-foreground">{formatDate(record.dueDate)}</p>
                </div>
              </div>
              
              {record.completedDate && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Completion Date</h3>
                    <p className="text-muted-foreground">{formatDate(record.completedDate)}</p>
                    {record.expiryDate && (
                      <p className="text-sm text-muted-foreground">
                        Expires: {formatDate(record.expiryDate)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {record.score !== null && (
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Score</h3>
                    <p className="text-muted-foreground">{record.score}%</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-4">
                {getStatusBadge(record.status)}
              </div>
              
              {record.status !== 'completed' && (
                <Button 
                  className="w-full mt-4" 
                  onClick={handleMarkComplete}
                >
                  Mark as Completed
                </Button>
              )}
              
              {record.status === 'completed' && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4" 
                  onClick={handleDownloadCertificate}
                >
                  Download Certificate
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {record.comments || "No comments provided for this training record."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrainingRecordDetail;