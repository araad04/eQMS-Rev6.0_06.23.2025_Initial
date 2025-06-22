import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TestTube, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const storageConfigSchema = z.object({
  name: z.string().min(1, "Configuration name is required"),
  description: z.string().min(1, "Description is required"),
  provider: z.enum(["aws-s3", "azure-blob", "gcp-storage", "sharepoint", "local-sftp", "local-https"]),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  compliance: z.object({
    iso13485: z.boolean(),
    cfr21Part11: z.boolean(),
    gdpr: z.boolean(),
  }),
  encryptionSettings: z.object({
    enabled: z.boolean(),
    algorithm: z.string().optional(),
    keyManagement: z.string().optional(),
  }),
  config: z.object({
    // AWS S3
    region: z.string().optional(),
    bucket: z.string().optional(),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    
    // Azure Blob
    connectionString: z.string().optional(),
    container: z.string().optional(),
    tenantId: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    
    // GCP Storage
    // bucket already defined for AWS
    
    // SharePoint
    siteUrl: z.string().optional(),
    libraryName: z.string().optional(),
    // tenantId, clientId, clientSecret already defined
    
    // Local
    endpoint: z.string().optional(),
    port: z.number().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    basePath: z.string().optional(),
  }),
});

type StorageConfigFormData = z.infer<typeof storageConfigSchema>;

interface StorageConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingConfig?: any;
  onSuccess: () => void;
}

export function StorageConfigurationDialog({
  open,
  onOpenChange,
  editingConfig,
  onSuccess,
}: StorageConfigurationDialogProps) {
  const [currentTab, setCurrentTab] = useState("basic");
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  const { toast } = useToast();

  const form = useForm<StorageConfigFormData>({
    resolver: zodResolver(storageConfigSchema),
    defaultValues: {
      name: "",
      description: "",
      provider: "local-https",
      isActive: true,
      isDefault: false,
      compliance: {
        iso13485: true,
        cfr21Part11: true,
        gdpr: false,
      },
      encryptionSettings: {
        enabled: true,
        algorithm: "AES256",
      },
      config: {
        basePath: "./uploads",
      },
    },
  });

  const selectedProvider = form.watch("provider");

  // Get configuration templates for all providers
  const { data: templates } = useQuery({
    queryKey: ['/api/storage-settings/templates'],
  });

  // Load editing data
  useEffect(() => {
    if (editingConfig) {
      form.reset({
        name: editingConfig.name,
        description: editingConfig.description,
        provider: editingConfig.provider,
        isActive: editingConfig.isActive,
        isDefault: editingConfig.isDefault,
        compliance: editingConfig.compliance,
        encryptionSettings: editingConfig.encryptionSettings,
        config: editingConfig.config || {},
      });
    } else {
      form.reset();
    }
  }, [editingConfig, form]);

  // Update form when provider changes
  useEffect(() => {
    if (templates?.success && templates?.data && selectedProvider && !editingConfig) {
      const providerTemplate = (templates.data as any)[selectedProvider];
      if (providerTemplate) {
        const currentData = form.getValues();
        form.reset({
          ...currentData,
          config: {
            ...providerTemplate,
            provider: selectedProvider,
          },
          compliance: providerTemplate.compliance || currentData.compliance,
          encryptionSettings: {
            enabled: providerTemplate.encryption?.enabled || true,
            algorithm: providerTemplate.encryption?.algorithm || "AES256",
          },
        });
      }
    }
  }, [templates, selectedProvider, editingConfig, form]);

  const createMutation = useMutation({
    mutationFn: (data: StorageConfigFormData) => 
      apiRequest('POST', '/api/storage-settings', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Storage configuration created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create configuration",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: StorageConfigFormData) => 
      apiRequest('PUT', `/api/storage-settings/${editingConfig?.id}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Storage configuration updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update configuration",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (data: StorageConfigFormData) => 
      apiRequest('POST', '/api/storage-settings/test', data),
    onSuccess: async (result) => {
      const data = await result.json();
      setTestResult(data);
      setIsTestingConnection(false);
    },
    onError: (error: any) => {
      setTestResult({
        success: false,
        error: error.message || "Connection test failed",
      });
      setIsTestingConnection(false);
    },
  });

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    
    const formData = form.getValues();
    formData.config.provider = selectedProvider;
    
    testConnectionMutation.mutate(formData);
  };

  const onSubmit = (data: StorageConfigFormData) => {
    data.config.provider = selectedProvider;
    
    if (editingConfig) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const renderProviderConfig = () => {
    switch (selectedProvider) {
      case "aws-s3":
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="config.region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AWS Region</FormLabel>
                  <FormControl>
                    <Input placeholder="us-east-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.bucket"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>S3 Bucket Name</FormLabel>
                  <FormControl>
                    <Input placeholder="my-eqms-documents" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.accessKeyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Key ID</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="AKIA..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.secretAccessKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret Access Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "azure-blob":
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="config.connectionString"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection String</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="DefaultEndpointsProtocol=https..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.container"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Container Name</FormLabel>
                  <FormControl>
                    <Input placeholder="eqms-documents" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "local-https":
      case "local-sftp":
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="config.basePath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Path</FormLabel>
                  <FormControl>
                    <Input placeholder="./uploads" {...field} />
                  </FormControl>
                  <FormDescription>
                    Local directory path for document storage
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedProvider === "local-sftp" && (
              <>
                <FormField
                  control={form.control}
                  name="config.endpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SFTP Server</FormLabel>
                      <FormControl>
                        <Input placeholder="sftp.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="config.username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="config.password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Provider configuration not yet available
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingConfig ? "Edit Storage Configuration" : "Add Storage Configuration"}
          </DialogTitle>
          <DialogDescription>
            Configure external repository integration for ISO 13485:2016 compliant document storage
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="provider">Provider</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="test">Test</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Configuration Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Production S3 Storage" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Primary storage for production documents and records" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a storage provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aws-s3">AWS S3</SelectItem>
                          <SelectItem value="azure-blob">Azure Blob Storage</SelectItem>
                          <SelectItem value="gcp-storage">Google Cloud Storage</SelectItem>
                          <SelectItem value="sharepoint">SharePoint</SelectItem>
                          <SelectItem value="local-sftp">Local SFTP</SelectItem>
                          <SelectItem value="local-https">Local HTTPS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <FormDescription>
                            Enable this storage configuration
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
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Default</FormLabel>
                          <FormDescription>
                            Use as default storage provider
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
                </div>
              </TabsContent>

              <TabsContent value="provider" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Provider Configuration</CardTitle>
                    <CardDescription>
                      Configure connection settings for {selectedProvider}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderProviderConfig()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Compliance Settings
                    </CardTitle>
                    <CardDescription>
                      Configure regulatory compliance requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="compliance.iso13485"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">ISO 13485:2016</FormLabel>
                            <FormDescription>
                              Medical device quality management compliance
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
                      control={form.control}
                      name="compliance.cfr21Part11"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">21 CFR Part 11</FormLabel>
                            <FormDescription>
                              FDA electronic records and signatures
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
                      control={form.control}
                      name="compliance.gdpr"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">GDPR</FormLabel>
                            <FormDescription>
                              European data protection regulation
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
                      control={form.control}
                      name="encryptionSettings.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Encryption</FormLabel>
                            <FormDescription>
                              Enable data encryption at rest and in transit
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="test" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="h-5 w-5" />
                      Connection Test
                    </CardTitle>
                    <CardDescription>
                      Test your storage configuration before saving
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTestingConnection}
                      className="w-full"
                    >
                      {isTestingConnection ? "Testing..." : "Test Connection"}
                    </Button>

                    {testResult && (
                      <div className={`p-4 rounded-lg border ${
                        testResult.success 
                          ? "bg-green-50 border-green-200" 
                          : "bg-red-50 border-red-200"
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {testResult.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`font-medium ${
                            testResult.success ? "text-green-800" : "text-red-800"
                          }`}>
                            {testResult.success ? "Connection Successful" : "Connection Failed"}
                          </span>
                        </div>
                        
                        {testResult.error && (
                          <p className="text-sm text-red-700 mb-2">{testResult.error}</p>
                        )}
                        
                        {testResult.latency && (
                          <p className="text-sm text-green-700">
                            Response time: {testResult.latency}ms
                          </p>
                        )}

                        {testResult.capabilities && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium mb-2">Capabilities:</h4>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(testResult.capabilities).map(([key, value]) => (
                                <Badge 
                                  key={key} 
                                  variant={value ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {key}: {value ? "✓" : "✗"}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingConfig ? "Update Configuration" : "Create Configuration"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}