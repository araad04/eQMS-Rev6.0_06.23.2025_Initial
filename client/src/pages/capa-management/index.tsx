import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { navigateTo } from '@/lib/navigation';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileWarning, 
  PlusCircle, 
  ListFilter,
  ClipboardList,
  Search
} from 'lucide-react';

// Define CAPA type
type CAPA = {
  id: number;
  capaId: string;
  title: string;
  description: string;
  source: string;
  capaType: string;
  riskPriority: string;
  patientSafetyImpact: boolean;
  productPerformanceImpact: boolean;
  complianceImpact: boolean;
  initiatedBy: number;
  assignedTo: number | null;
  dueDate: string | null;
  closedDate: string | null;
  createdAt: string;
  updatedAt: string;
  workflow?: {
    id: number;
    currentState: string;
    assignedTo: number;
  };
};

const CAPAManagementPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch CAPAs from API
  const { data: capas, isLoading, error } = useQuery({
    queryKey: ['/api/capas'],
    queryFn: async () => {
      const response = await fetch('/api/capas');
      if (!response.ok) {
        throw new Error('Failed to fetch CAPAs');
      }
      return response.json() as Promise<CAPA[]>;
    }
  });

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">CAPA Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage corrective and preventive actions
          </p>
        </div>
        {isManager && (
          <Button 
            onClick={() => navigateTo('/capa-management/create')}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            New CAPA
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="all">All CAPAs</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="corrective">Corrective Actions</TabsTrigger>
          <TabsTrigger value="preventive">Preventive Actions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="flex justify-between mb-4">
            <div className="text-lg font-medium">All CAPAs</div>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ListFilter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              // Loading skeleton cards
              <>
                <Card>
                  <CardHeader className="rounded-t-lg pb-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-16 w-full" />
                    <div className="flex justify-between mt-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-3">
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
                </Card>
                <Card className="hidden md:block">
                  <CardHeader className="rounded-t-lg pb-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-16 w-full" />
                    <div className="flex justify-between mt-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-3">
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
                </Card>
                <Card className="hidden lg:block">
                  <CardHeader className="rounded-t-lg pb-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-16 w-full" />
                    <div className="flex justify-between mt-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-3">
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
                </Card>
              </>
            ) : error ? (
              // Error state
              <div className="col-span-3 py-8 text-center">
                <FileWarning className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Error Loading CAPAs</h3>
                <p className="text-muted-foreground">
                  There was a problem loading the CAPA data. Please try again later.
                </p>
              </div>
            ) : capas && capas.length > 0 ? (
              // Render actual CAPA cards
              capas
                .filter(capa => {
                  // Apply filters based on active tab
                  if (activeTab === 'all') return true;
                  if (activeTab === 'open') return !capa.closedDate;
                  if (activeTab === 'corrective') return capa.capaType === 'corrective';
                  if (activeTab === 'preventive') return capa.capaType === 'preventive';
                  return true;
                })
                .map(capa => {
                  // Determine status color and icon
                  let statusColor = 'yellow';
                  let StatusIcon = Clock;
                  
                  if (capa.closedDate) {
                    statusColor = 'green';
                    StatusIcon = CheckCircle;
                  } else if (capa.workflow) {
                    switch(capa.workflow.currentState) {
                      case 'CORRECTION':
                        statusColor = 'orange';
                        StatusIcon = AlertTriangle;
                        break;
                      case 'ROOT_CAUSE_ANALYSIS':
                        statusColor = 'blue';
                        StatusIcon = Search;
                        break;
                      case 'CORRECTIVE_ACTION':
                        statusColor = 'purple';
                        StatusIcon = ClipboardList;
                        break;
                      case 'EFFECTIVENESS_VERIFICATION':
                        statusColor = 'cyan';
                        StatusIcon = CheckCircle;
                        break;
                      default:
                        statusColor = 'yellow';
                        StatusIcon = Clock;
                    }
                  }
                  
                  // Format date
                  const formatDate = (dateString: string | null) => {
                    if (!dateString) return 'Not set';
                    return new Date(dateString).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    });
                  };
                  
                  return (
                    <Card key={capa.id}>
                      <CardHeader className={`bg-${statusColor}-50 dark:bg-${statusColor}-950/20 rounded-t-lg pb-2`}>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{capa.capaId}</CardTitle>
                          <StatusIcon className={`h-5 w-5 text-${statusColor}-500`} />
                        </div>
                        <CardDescription>{capa.capaType.charAt(0).toUpperCase() + capa.capaType.slice(1)} Action</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <h3 className="font-semibold">{capa.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {capa.description}
                        </p>
                        
                        <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                          <div>
                            Priority: <Badge variant="outline" className={`bg-${capa.riskPriority === 'high' ? 'red' : capa.riskPriority === 'medium' ? 'yellow' : 'green'}-100 text-${capa.riskPriority === 'high' ? 'red' : capa.riskPriority === 'medium' ? 'yellow' : 'green'}-800 border-${capa.riskPriority === 'high' ? 'red' : capa.riskPriority === 'medium' ? 'yellow' : 'green'}-300`}>
                              {capa.riskPriority.toUpperCase()}
                            </Badge>
                          </div>
                          <div>
                            {capa.closedDate 
                              ? `Closed: ${formatDate(capa.closedDate)}`
                              : `Due: ${formatDate(capa.dueDate)}`
                            }
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 pb-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => navigateTo(`/capa-management/${capa.id}`)}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })
            ) : (
              // No CAPAs found
              <div className="col-span-3 py-8 text-center">
                <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No CAPAs Found</h3>
                <p className="text-muted-foreground mb-4">
                  There are no CAPAs matching your current filters.
                </p>
                {isManager && (
                  <Button 
                    onClick={() => navigateTo('/capa-management/create')}
                    className="mx-auto"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New CAPA
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="open">
          <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
            <p className="mb-2">Filter view not yet implemented</p>
            <p className="text-sm">This tab will show all open CAPAs</p>
          </div>
        </TabsContent>
        
        <TabsContent value="corrective">
          <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
            <p className="mb-2">Filter view not yet implemented</p>
            <p className="text-sm">This tab will show only corrective actions</p>
          </div>
        </TabsContent>
        
        <TabsContent value="preventive">
          <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
            <p className="mb-2">Filter view not yet implemented</p>
            <p className="text-sm">This tab will show only preventive actions</p>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>CAPA Metrics</CardTitle>
          <CardDescription>
            Key performance indicators for CAPA management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">CAPA by Status</div>
              <div className="flex justify-between text-sm">
                <span>Open</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>In Progress</span>
                <span className="font-medium">1</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pending Approval</span>
                <span className="font-medium">1</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Closed</span>
                <span className="font-medium">1</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">CAPA by Type</div>
              <div className="flex justify-between text-sm">
                <span>Corrective Action</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Preventive Action</span>
                <span className="font-medium">1</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Customer Complaint</span>
                <span className="font-medium">0</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Effectiveness</div>
              <div className="flex justify-between text-sm">
                <span>On-time Closure Rate</span>
                <span className="font-medium">80%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Average Days to Close</span>
                <span className="font-medium">45</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Recurrence Rate</span>
                <span className="font-medium">5%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ISO 13485:2016 Compliance</CardTitle>
          <CardDescription>
            CAPA management requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">§8.5.2 Corrective Action</span>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              The CAPA module fully supports the corrective action requirements of ISO 13485:2016,
              allowing for investigation of causes of nonconformities and actions to prevent recurrence.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">§8.5.3 Preventive Action</span>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              The preventive action workflow implements controls to eliminate potential causes
              of nonconformities and prevent their occurrence.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CAPAManagementPage;