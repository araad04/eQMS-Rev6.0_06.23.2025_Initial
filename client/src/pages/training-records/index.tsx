import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { navigateTo } from '@/lib/navigation';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  BarChart,
  UserPlus
} from 'lucide-react';

// Define training record type
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

const TrainingRecordsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch training records from authentic API sources only
  const { data: trainingRecords = [], isLoading, error } = useQuery({
    queryKey: ['/api/training/records'],
    enabled: true
  });

  // Filter training records based on search query
  const filteredRecords = trainingRecords.filter((record: any) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      record.employee?.toLowerCase().includes(searchLower) ||
      record.training?.toLowerCase().includes(searchLower) ||
      record.department?.toLowerCase().includes(searchLower) ||
      record.status?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Completed
        </Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          <Clock className="mr-1 h-3 w-3" />
          In Progress
        </Badge>;
      case 'assigned':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <FileText className="mr-1 h-3 w-3" />
          Assigned
        </Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Overdue
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTrainingTypeBadge = (type: string) => {
    const colors = {
      'Regulatory': 'bg-purple-100 text-purple-800 border-purple-200',
      'Technical': 'bg-blue-100 text-blue-800 border-blue-200',
      'Compliance': 'bg-orange-100 text-orange-800 border-orange-200',
      'Process': 'bg-green-100 text-green-800 border-green-200',
      'Onboarding': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    
    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {type}
      </Badge>
    );
  };

  // Calculate statistics
  const totalRecords = trainingRecords.length;
  const completedRecords = trainingRecords.filter((record: any) => record.status === 'completed').length;
  const overdueRecords = trainingRecords.filter((record: any) => record.status === 'overdue').length;
  const inProgressRecords = trainingRecords.filter((record: any) => record.status === 'in_progress').length;

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading training records...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Training Records</h3>
              <p className="text-muted-foreground">Please contact your system administrator for assistance.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Training Records</h1>
          <p className="text-muted-foreground mt-1">
            Manage employee training and certifications
          </p>
        </div>
        {isManager && (
          <Button 
            onClick={() => navigateTo('/training-records/create')}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Create Training Module
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedRecords}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressRecords}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueRecords}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Training Records</CardTitle>
              <CardDescription>
                View and manage employee training assignments and progress
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {isManager && (
                <Button
                  variant="outline"
                  onClick={() => navigateTo('/training-records/assign')}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign Training
                </Button>
              )}
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <BarChart className="h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee, training, department, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          {trainingRecords.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Training Records Found</h3>
              <p className="text-muted-foreground mb-4">
                No training records have been created yet. Training records will appear here once employees are assigned training modules.
              </p>
              {isManager && (
                <Button onClick={() => navigateTo('/training-records/assign')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Training
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Training</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employee}</TableCell>
                      <TableCell>{record.department}</TableCell>
                      <TableCell>{record.training}</TableCell>
                      <TableCell>{getTrainingTypeBadge(record.trainingType)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                          {format(new Date(record.assignedDate), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                          {format(new Date(record.dueDate), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        {record.score ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {record.score}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
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

export default TrainingRecordsPage;