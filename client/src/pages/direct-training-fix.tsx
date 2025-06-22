import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";

// Type definition for training records
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

const DirectTrainingFix: React.FC = () => {
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecordsDirectly = async () => {
      try {
        setIsLoading(true);
        
        // Direct SQL query execution via backend
        const response = await fetch('/api/execute-direct-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Local': 'true'
          },
          body: JSON.stringify({
            query: `
              SELECT 
                tr.id, tr.user_id as "userId", tr.module_id as "moduleId", 
                CONCAT(u.first_name, ' ', u.last_name) as employee,
                u.department,
                tm.name as training,
                tm.type as "trainingType",
                CONCAT(a.first_name, ' ', a.last_name) as "assignedBy",
                tr.assigned_date as "assignedDate",
                tr.due_date as "dueDate",
                tr.completed_date as "completedDate",
                tr.expiry_date as "expiryDate",
                tr.status,
                tr.score,
                tr.comments
              FROM 
                training_records tr
              JOIN 
                users u ON tr.user_id = u.id
              JOIN 
                training_modules tm ON tr.module_id = tm.id
              JOIN 
                users a ON tr.assigned_by = a.id
              ORDER BY 
                tr.assigned_date DESC
            `
          })
        });
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (Array.isArray(data)) {
          setTrainingRecords(data);
        } else {
          // If no records found or incorrect response format
          setTrainingRecords([]);
        }
      } catch (err) {
        console.error("Error fetching training records:", err);
        setError("Failed to load training records. Please try again later.");
        
        // Show toast notification
        toast({
          title: "Error",
          description: "Failed to load training records. Database may not be correctly configured.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecordsDirectly();
  }, [toast]);
  
  // Function to render status badges with appropriate colors
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'assigned':
        return <Badge className="bg-blue-500">Assigned</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Function to format date in a readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader
        heading="Training Records"
        subheading="View all training records and assignments"
      >
        <Button onClick={() => navigate("/training-records/assign")}>
          Assign Training
        </Button>
      </PageHeader>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Training Records</CardTitle>
          <CardDescription>
            View and manage training assignments and completion records
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center p-8 text-red-500">
              {error}
            </div>
          ) : trainingRecords.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No training records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Training</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Assigned By</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {trainingRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employee}</TableCell>
                      <TableCell>{record.department}</TableCell>
                      <TableCell>{record.training}</TableCell>
                      <TableCell>{record.trainingType}</TableCell>
                      <TableCell>{record.assignedBy}</TableCell>
                      <TableCell>{formatDate(record.dueDate)}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>{formatDate(record.completedDate)}</TableCell>
                      <TableCell>{formatDate(record.expiryDate)}</TableCell>
                      <TableCell>{record.score || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectTrainingFix;