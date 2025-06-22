import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageHeader } from "@/components/layout/page-header";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  UserCircle, 
  Shield, 
  Bell,
  Lock,
  Globe
} from "lucide-react";

// Form schemas
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  documentUpdates: z.boolean(),
  capaAssignments: z.boolean(),
  auditSchedules: z.boolean(),
  trainingDue: z.boolean(),
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });
  
  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      documentUpdates: true,
      capaAssignments: true,
      auditSchedules: true,
      trainingDue: true,
    },
  });
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      if (!res.ok) {
        throw new Error("Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your profile has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/password", data);
      if (!res.ok) {
        throw new Error("Failed to update password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your password has been updated",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update password: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Notification update mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/notifications", data);
      if (!res.ok) {
        throw new Error("Failed to update notification settings");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your notification settings have been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update notification settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handlers
  const onSubmitProfile = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  const onSubmitPassword = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };
  
  const onSubmitNotifications = (data: NotificationFormValues) => {
    updateNotificationsMutation.mutate(data);
  };
  
  return (
    <>
      <PageHeader 
        title="Settings"
        description="Manage your account settings and preferences"
      />
      
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar */}
          <div>
            <Card>
              <CardContent className="p-0">
                <Tabs
                  defaultValue="profile"
                  orientation="vertical"
                  className="w-full"
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
                  <TabsList className="w-full flex flex-col items-start h-auto border-r rounded-none">
                    <TabsTrigger
                      value="profile"
                      className="w-full justify-start px-6 py-3 data-[state=active]:border-r-2 data-[state=active]:border-primary rounded-none"
                    >
                      <UserCircle className="h-5 w-5 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="w-full justify-start px-6 py-3 data-[state=active]:border-r-2 data-[state=active]:border-primary rounded-none"
                    >
                      <Lock className="h-5 w-5 mr-2" />
                      Security
                    </TabsTrigger>
                    <TabsTrigger
                      value="notifications"
                      className="w-full justify-start px-6 py-3 data-[state=active]:border-r-2 data-[state=active]:border-primary rounded-none"
                    >
                      <Bell className="h-5 w-5 mr-2" />
                      Notifications
                    </TabsTrigger>

                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile settings */}
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <UserCircle className="h-6 w-6 mr-2 text-primary" />
                    <div>
                      <CardTitle>Profile</CardTitle>
                      <CardDescription>Manage your personal information</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your first name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Your email address" {...field} />
                            </FormControl>
                            <FormDescription>
                              Your email address is used for notifications and account recovery
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
            
            {/* Security settings */}
            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Shield className="h-6 w-6 mr-2 text-primary" />
                    <div>
                      <CardTitle>Security</CardTitle>
                      <CardDescription>Manage your account security settings</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Your current password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Your new password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Password must be at least 8 characters long
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={updatePasswordMutation.isPending}
                        >
                          {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
            
            {/* Notification settings */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Bell className="h-6 w-6 mr-2 text-primary" />
                    <div>
                      <CardTitle>Notifications</CardTitle>
                      <CardDescription>Customize your notification preferences</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-6">
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between py-3 border-b">
                            <div>
                              <FormLabel className="text-base font-medium">Email Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="documentUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between py-3 border-b">
                            <div>
                              <FormLabel className="text-base font-medium">Document Updates</FormLabel>
                              <FormDescription>
                                Get notified when documents are updated or need approval
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="capaAssignments"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between py-3 border-b">
                            <div>
                              <FormLabel className="text-base font-medium">CAPA Assignments</FormLabel>
                              <FormDescription>
                                Get notified when you are assigned to a CAPA
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="auditSchedules"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between py-3 border-b">
                            <div>
                              <FormLabel className="text-base font-medium">Audit Schedules</FormLabel>
                              <FormDescription>
                                Get notified about upcoming audits
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="trainingDue"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between py-3">
                            <div>
                              <FormLabel className="text-base font-medium">Training Due Reminders</FormLabel>
                              <FormDescription>
                                Get reminders about your training deadlines
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={updateNotificationsMutation.isPending}
                        >
                          {updateNotificationsMutation.isPending ? "Saving..." : "Save Preferences"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
            

          </div>
        </div>
      </div>
    </>
  );
}