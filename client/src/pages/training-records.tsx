import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { BadgeColored } from "@/components/ui/badge-colored";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  BookOpen, 
  Eye, 
  Clock, 
  GraduationCap 
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface TrainingRecord {
  id: number;
  userId: number;
  moduleId: number;
  statusId: number;
  assignedDate: string;
  completedDate?: string;
  expiryDate?: string;
  score?: number;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  // Derived fields for display
  moduleName?: string;
  moduleType?: string;
  userName?: string;
  statusName?: string;
}

export default function TrainingRecords() {
  const [searchQuery, setSearchQuery] = useState("");
  const [trainingStatus, setTrainingStatus] = useState<string>("all");
  const [trainingType, setTrainingType] = useState<string>("all");
  
  // Fetch training records
  const { data: trainingRecords, isLoading } = useQuery<TrainingRecord[]>({
    queryKey: ["/api/training/records", trainingStatus, trainingType],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      
      const records = await res.json();
      
      // Add derived fields for display - in a real app this would come from the API
      return records.map((record: TrainingRecord) => ({
        ...record,
        moduleName: getModuleName(record.moduleId),
        moduleType: getModuleType(record.moduleId),
        userName: getUserName(record.userId),
        statusName: getStatusName(record.statusId)
      }));
    },
  });

  // Helper functions for display data
  function getModuleName(moduleId: number): string {
    const moduleMap: Record<number, string> = {
      1: "Quality System Overview",
      2: "Document Control",
      3: "CAPA Process",
      4: "Internal Auditing",
      5: "Risk Management"
    };
    return moduleMap[moduleId] || `Module ${moduleId}`;
  }
  
  function getModuleType(moduleId: number): string {
    const typeMap: Record<number, string> = {
      1: "Onboarding",
      2: "Technical",
      3: "Compliance",
      4: "Process",
      5: "Regulatory"
    };
    return typeMap[moduleId % 5 + 1] || "General";
  }
  
  function getUserName(userId: number): string {
    const userMap: Record<number, string> = {
      1: "Admin User",
      2: "John Doe",
      3: "Jane Smith",
      4: "Robert Johnson",
      5: "Emily Davis"
    };
    return userMap[userId] || `User ${userId}`;
  }
  
  function getStatusName(statusId: number): string {
    const statusMap: Record<number, string> = {
      1: "Assigned",
      2: "In Progress",
      3: "Completed",
      4: "Expired",
      5: "Overdue"
    };
    return statusMap[statusId] || "Unknown";
  }
  
  const getStatusBadgeVariant = (status: string) => {
    const statusMap: Record<string, string> = {
      "Assigned": "blue",
      "In Progress": "yellow",
      "Completed": "green",
      "Expired": "red",
      "Overdue": "red"
    };
    return statusMap[status] || "default";
  };

  const getTypeVariant = (type: string) => {
    const typeMap: Record<string, string> = {
      "Onboarding": "green",
      "Technical": "blue",
      "Compliance": "purple",
      "Process": "indigo",
      "Regulatory": "red"
    };
    return typeMap[type] || "default";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log(`Searching for: ${searchQuery}`);
  };

  // Filter training records based on search query
  const filteredRecords = trainingRecords?.filter(record => 
    record.moduleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate compliance rate
  const calculateComplianceRate = (): number => {
    if (!trainingRecords || trainingRecords.length === 0) return 0;
    
    const completedCount = trainingRecords.filter(record => record.statusId === 3).length;
    return Math.round((completedCount / trainingRecords.length) * 100);
  };

  const complianceRate = trainingRecords ? calculateComplianceRate() : 0;

  return (
    <>
      <PageHeader 
        title="Training Records"
        description="Manage employee training and qualifications"
        actions={[
          {
            label: "Assign Training",
            href: "/training-records/assign",
            icon: <Plus className="h-5 w-5" />,
          }
        ]}
      />
      
      <div className="px-6 py-8">
        {/* Compliance Summary Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Training Compliance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Compliance</span>
                <span className={`text-sm font-medium ${complianceRate >= 90 ? 'text-green-600' : complianceRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {complianceRate}%
                </span>
              </div>
              <Progress value={complianceRate} className="h-2" />
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{trainingRecords?.filter(r => r.statusId === 3).length || 0}</div>
                <div className="text-sm text-neutral-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{trainingRecords?.filter(r => r.statusId === 2).length || 0}</div>
                <div className="text-sm text-neutral-500">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{trainingRecords?.filter(r => [4, 5].includes(r.statusId)).length || 0}</div>
                <div className="text-sm text-neutral-500">Overdue/Expired</div>
              </div>
            </div>
            
            <div className="flex justify-end items-center">
              <Button variant="outline" className="mr-2">
                <Clock className="h-4 w-4 mr-2" />
                Set Reminders
              </Button>
              <Button>
                <GraduationCap className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg">
          {/* Search and filter section */}
          <div className="p-5 border-b border-neutral-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search bar */}
              <form onSubmit={handleSearch} className="w-full md:w-96">
                <div className="relative">
                  <Input
                    type="text" 
                    placeholder="Search training records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                </div>
              </form>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <Select value={trainingType} onValueChange={setTrainingType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Training Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="1">Onboarding</SelectItem>
                    <SelectItem value="2">Technical</SelectItem>
                    <SelectItem value="3">Compliance</SelectItem>
                    <SelectItem value="4">Process</SelectItem>
                    <SelectItem value="5">Regulatory</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={trainingStatus} onValueChange={setTrainingStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="1">Assigned</SelectItem>
                    <SelectItem value="2">In Progress</SelectItem>
                    <SelectItem value="3">Completed</SelectItem>
                    <SelectItem value="4">Expired</SelectItem>
                    <SelectItem value="5">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Training records table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50">
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Training Module</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Completion Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-neutral-100 rounded animate-pulse"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredRecords && filteredRecords.length > 0 ? (
                  // Actual training records data
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.userName}</TableCell>
                      <TableCell>{record.moduleName}</TableCell>
                      <TableCell>
                        <BadgeColored variant={getTypeVariant(record.moduleType || "")}>
                          {record.moduleType}
                        </BadgeColored>
                      </TableCell>
                      <TableCell>
                        <BadgeColored variant={getStatusBadgeVariant(record.statusName || "")}>
                          {record.statusName}
                        </BadgeColored>
                      </TableCell>
                      <TableCell>{formatDate(record.assignedDate)}</TableCell>
                      <TableCell>{record.expiryDate ? formatDate(record.expiryDate) : "-"}</TableCell>
                      <TableCell>{record.completedDate ? formatDate(record.completedDate) : "-"}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/training-records/${record.id}`}>
                          <Button variant="ghost" size="sm" className="text-primary">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // No training records found
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <BookOpen className="h-12 w-12 text-neutral-300 mb-2" />
                        <h3 className="text-lg font-medium text-neutral-900">No training records found</h3>
                        <p className="text-neutral-500 mt-1">
                          {searchQuery ? 
                            "Try adjusting your search or filters" : 
                            "Get started by assigning training to employees"}
                        </p>
                        {!searchQuery && (
                          <Link href="/training-records/assign">
                            <Button className="mt-4">
                              <Plus className="h-4 w-4 mr-2" />
                              Assign Training
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {filteredRecords && filteredRecords.length > 0 && (
            <div className="py-4 px-6 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredRecords.length}</span> of <span className="font-medium">{filteredRecords.length}</span> results
                </p>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
