import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageHeader } from "@/components/layout/page-header";
import { BadgeColored } from "@/components/ui/badge-colored";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Edit, 
  UserCircle, 
  AlertCircle, 
  Loader2, 
  Mail,
  Shield,
  Building,
  ClipboardList,
  FileText
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Types
interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string | null;
  createdAt: string;
}

// Form schema for updating role
const roleUpdateSchema = z.object({
  role: z.string().min(1, "Role is required"),
});

type RoleUpdateFormValues = z.infer<typeof roleUpdateSchema>;

// Form schema for updating department
const departmentUpdateSchema = z.object({
  department: z.string().nullable(),
});

type DepartmentUpdateFormValues = z.infer<typeof departmentUpdateSchema>;

export default function UserDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/user-management/:id");
  const userId = params?.id;
  const { toast } = useToast();
  
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [openDepartmentDialog, setOpenDepartmentDialog] = useState(false);
  
  // Fetch user details
  const { 
    data: user, 
    isLoading, 
    error 
  } = useQuery<User>({
    queryKey: ["/api/users", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${userId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch user details");
      }
      return res.json();
    },
    enabled: !!userId,
  });
  
  // Role update form
  const roleForm = useForm<RoleUpdateFormValues>({
    resolver: zodResolver(roleUpdateSchema),
    defaultValues: {
      role: user?.role || "",
    },
  });
  
  // Department update form
  const departmentForm = useForm<DepartmentUpdateFormValues>({
    resolver: zodResolver(departmentUpdateSchema),
    defaultValues: {
      department: user?.department || null,
    },
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}`, data);
      if (!res.ok) {
        throw new Error("Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "User updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      
      // Close dialogs
      setOpenRoleDialog(false);
      setOpenDepartmentDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handlers
  const onSubmitRoleUpdate = (data: RoleUpdateFormValues) => {
    updateUserMutation.mutate(data);
  };
  
  const onSubmitDepartmentUpdate = (data: DepartmentUpdateFormValues) => {
    updateUserMutation.mutate(data);
  };
  
  // Helper function to get role badge variant
  const getRoleBadgeVariant = (role: string): "default" | "yellow" | "blue" | "green" | "red" | "purple" | "orange" => {
    const roleMap: Record<string, "default" | "yellow" | "blue" | "green" | "red" | "purple" | "orange"> = {
      "Admin": "purple",
      "Quality Manager": "blue",
      "Document Control": "yellow",
      "Auditor": "green",
      "Staff": "default"
    };
    return roleMap[role] || "default";
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading User</h2>
        <p className="text-muted-foreground">{(error as Error).message}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate("/user-management")}
        >
          Back to Users
        </Button>
      </div>
    );
  }
  
  // No user found
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
        <p className="text-muted-foreground">The user you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate("/user-management")}
        >
          Back to Users
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <PageHeader 
        title={`${user.firstName} ${user.lastName}`}
        description={`Username: ${user.username}`}
        actions={[
          {
            label: "Back to Users",
            href: "/user-management",
            icon: <ArrowLeft className="h-5 w-5" />,
            variant: "outline",
          }
        ]}
      />
      
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - User details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <CardTitle className="text-2xl">{user.firstName} {user.lastName}</CardTitle>
                    <CardDescription>Added on {format(new Date(user.createdAt), "PPP")}</CardDescription>
                  </div>
                  <div>
                    <BadgeColored 
                      variant={getRoleBadgeVariant(user.role)}
                    >
                      {user.role}
                    </BadgeColored>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="mb-6">
                    <TabsTrigger value="overview">
                      <UserCircle className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="documents">
                      <FileText className="h-4 w-4 mr-2" />
                      Documents
                    </TabsTrigger>
                    <TabsTrigger value="trainings">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Trainings
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview">
                    <div className="space-y-6">
                      {/* Contact Information */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Email</p>
                              <p className="text-sm text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Role</p>
                              <div className="flex items-center space-x-2">
                                <BadgeColored 
                                  variant={getRoleBadgeVariant(user.role)}
                                >
                                  {user.role}
                                </BadgeColored>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-xs"
                                  onClick={() => setOpenRoleDialog(true)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Change
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Department</p>
                              <div className="flex items-center space-x-2">
                                <p className="text-sm text-gray-500">
                                  {user.department || "Not assigned"}
                                </p>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-xs"
                                  onClick={() => setOpenDepartmentDialog(true)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Change
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="documents">
                    <div className="text-center py-6 text-muted-foreground bg-neutral-50 rounded-md">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p>No documents have been created by this user</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="trainings">
                    <div className="text-center py-6 text-muted-foreground bg-neutral-50 rounded-md">
                      <ClipboardList className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p>No training records available for this user</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Metadata */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="mt-1 text-gray-900">{user.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Username</dt>
                    <dd className="mt-1 text-gray-900">{user.username}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="mt-1 text-gray-900">{user.firstName} {user.lastName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="mt-1">
                      <BadgeColored 
                        variant={getRoleBadgeVariant(user.role)}
                      >
                        {user.role}
                      </BadgeColored>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Department</dt>
                    <dd className="mt-1 text-gray-900">{user.department || "Not assigned"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Added On</dt>
                    <dd className="mt-1 text-gray-900">{format(new Date(user.createdAt), "PPP")}</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter className="border-t pt-6 pb-4 flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setOpenRoleDialog(true)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Update Role
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setOpenDepartmentDialog(true)}
                >
                  <Building className="h-4 w-4 mr-2" />
                  Update Department
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Documents Created</dt>
                    <dd className="mt-1 text-gray-900">0</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Documents Approved</dt>
                    <dd className="mt-1 text-gray-900">0</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">CAPAs Assigned</dt>
                    <dd className="mt-1 text-gray-900">0</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Audits Conducted</dt>
                    <dd className="mt-1 text-gray-900">0</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Training Completion</dt>
                    <dd className="mt-1 text-gray-900">N/A</dd>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Role Update Dialog */}
      <Dialog open={openRoleDialog} onOpenChange={setOpenRoleDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change the current role of this user
            </DialogDescription>
          </DialogHeader>
          <Form {...roleForm}>
            <form onSubmit={roleForm.handleSubmit(onSubmitRoleUpdate)}>
              <FormField
                control={roleForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={user.role}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Quality Manager">Quality Manager</SelectItem>
                        <SelectItem value="Document Control">Document Control</SelectItem>
                        <SelectItem value="Auditor">Auditor</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenRoleDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? "Updating..." : "Update Role"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Department Update Dialog */}
      <Dialog open={openDepartmentDialog} onOpenChange={setOpenDepartmentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Department</DialogTitle>
            <DialogDescription>
              Change the department of this user
            </DialogDescription>
          </DialogHeader>
          <Form {...departmentForm}>
            <form onSubmit={departmentForm.handleSubmit(onSubmitDepartmentUpdate)}>
              <FormField
                control={departmentForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={user.department || "null"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">None</SelectItem>
                        <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                        <SelectItem value="Regulatory Affairs">Regulatory Affairs</SelectItem>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="R&D">R&D</SelectItem>
                        <SelectItem value="Executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenDepartmentDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? "Updating..." : "Update Department"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}