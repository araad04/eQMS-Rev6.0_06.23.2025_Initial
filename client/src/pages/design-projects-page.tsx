import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  BarChart,
  FileText,
  Filter,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BadgeColored } from "@/components/ui/badge-colored";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type DesignProject = {
  id: number;
  projectCode: string;
  title: string;
  statusId: number;
  statusName?: string;
  riskClass: string;
  modelType: string;
  // Optional property that may be added by frontend code
  hasSoftwareComponent?: boolean;
  startDate: string; 
  targetCompletionDate: string;
};

export default function DesignProjectsPage() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Fetch projects from API
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["/api/design-control/projects", statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/design-control/projects`);
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      return await res.json();
    }
  });
  
  // Use API data with a fallback to empty array if loading
  const displayProjects = (projects || []).filter(project => {
    // Filter by search query
    const matchesSearch = 
      searchQuery === "" ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status
    const matchesStatus = 
      statusFilter === "all" || 
      project.statusId === parseInt(statusFilter);
    
    return matchesSearch && matchesStatus;
  }).map(project => ({
    ...project,
    // Add default value for hasSoftwareComponent if it doesn't exist
    hasSoftwareComponent: project.hasSoftwareComponent || false
  }));

  function getStatusBadgeVariant(statusName: string | undefined) {
    switch (statusName) {
      case "Planning":
        return "outline";
      case "Design Input":
        return "secondary";
      case "Design Output":
        return "default";
      case "Verification":
        return "warning";
      case "Validation":
        return "success";
      case "Completed":
        return "success";
      default:
        return "outline";
    }
  }

  return (
    <>
      <Helmet>
        <title>Design Control Projects | eQMS System</title>
        <meta
          name="description"
          content="Design Control Projects for medical devices. Manage, track, and monitor design and development activities with full ISO 13485:2016 and IEC 62304 compliance."
        />
      </Helmet>

      <PageHeader
        title="Design Control Projects"
        description="Manage design and development projects with ISO 13485:2016 and IEC 62304 compliance"
        actions={
          <Button asChild>
            <Link to="/design-control/create">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Link>
          </Button>
        }
      />

      <div className="px-4 md:px-6 space-y-6">
        <Tabs defaultValue="list" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="list">
                <FileText className="h-4 w-4 mr-2" />
                List View
              </TabsTrigger>
              <TabsTrigger value="dashboard">
                <BarChart className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[250px]"
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="1">Planning</SelectItem>
                    <SelectItem value="2">Design Input</SelectItem>
                    <SelectItem value="3">Design Output</SelectItem>
                    <SelectItem value="4">Verification</SelectItem>
                    <SelectItem value="5">Validation</SelectItem>
                    <SelectItem value="6">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="sr-only">Advanced filters</span>
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk Class</TableHead>
                      <TableHead>Development Model</TableHead>
                      <TableHead>Software</TableHead>
                      <TableHead>Target Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-[100px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[200px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[60px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[60px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[40px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[80px]" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : error ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Failed to load design projects.
                        </TableCell>
                      </TableRow>
                    ) : displayProjects.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No design projects found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayProjects.map((project) => (
                        <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setLocation(`/design-control/${project.id}`)}>
                          <TableCell className="font-medium">
                            {project.projectCode}
                          </TableCell>
                          <TableCell>{project.title}</TableCell>
                          <TableCell>
                            <BadgeColored variant={getStatusBadgeVariant(project.statusName)}>
                              {project.statusName}
                            </BadgeColored>
                          </TableCell>
                          <TableCell>{project.riskClass}</TableCell>
                          <TableCell>{project.modelType}</TableCell>
                          <TableCell>
                            {project.hasSoftwareComponent ? "Yes" : "No"}
                          </TableCell>
                          <TableCell>
                            {new Date(project.targetCompletionDate).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{displayProjects.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all development phases
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Projects with Software
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {displayProjects.filter(p => p.hasSoftwareComponent).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requiring IEC 62304 compliance
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    High Risk Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {displayProjects.filter(p => p.riskClass === "Class III").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Class III devices
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card className="p-4">
              <CardHeader>
                <CardTitle>Project Status Overview</CardTitle>
                <CardDescription>Distribution of projects by phase</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-muted-foreground">
                  Status distribution chart will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}