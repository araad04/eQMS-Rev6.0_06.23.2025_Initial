import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings, TestTube, Shield, Cloud, Server } from "lucide-react";
import { StorageConfigurationDialog } from "@/components/storage-settings/storage-configuration-dialog";
import { StorageTestDialog } from "@/components/storage-settings/storage-test-dialog";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StorageConfiguration {
  id: number;
  name: string;
  description: string;
  provider: string;
  isActive: boolean;
  isDefault: boolean;
  config: {
    [key: string]: any;
  };
  compliance: {
    iso13485: boolean;
    cfr21Part11: boolean;
    gdpr: boolean;
  };
  encryptionSettings: {
    enabled: boolean;
    algorithm?: string;
    keyManagement?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export default function StorageSettings() {
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<StorageConfiguration | null>(null);
  const [editingConfig, setEditingConfig] = useState<StorageConfiguration | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configurations, isLoading } = useQuery<{ success: boolean; data: StorageConfiguration[] }>({
    queryKey: ['/api/storage-settings'],
    queryFn: async () => {
      const response = await fetch('/api/storage-settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch storage configurations');
      }
      return response.json();
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: (configId: number) => 
      apiRequest('POST', `/api/storage-settings/${configId}/set-default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/storage-settings'] });
      toast({
        title: "Success",
        description: "Default storage configuration updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set default configuration",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (configId: number) => 
      apiRequest('DELETE', `/api/storage-settings/${configId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/storage-settings'] });
      toast({
        title: "Success",
        description: "Storage configuration deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedConfig(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete configuration",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (config: StorageConfiguration) => {
    setEditingConfig(config);
    setConfigDialogOpen(true);
  };

  const handleTest = (config: StorageConfiguration) => {
    setSelectedConfig(config);
    setTestDialogOpen(true);
  };

  const handleDelete = (config: StorageConfiguration) => {
    setSelectedConfig(config);
    setDeleteDialogOpen(true);
  };

  const handleSetDefault = (config: StorageConfiguration) => {
    setDefaultMutation.mutate(config.id);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'aws-s3':
        return <Cloud className="h-4 w-4" />;
      case 'azure-blob':
        return <Cloud className="h-4 w-4" />;
      case 'gcp-storage':
        return <Cloud className="h-4 w-4" />;
      case 'sharepoint':
        return <Server className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'aws-s3':
        return 'AWS S3';
      case 'azure-blob':
        return 'Azure Blob Storage';
      case 'gcp-storage':
        return 'Google Cloud Storage';
      case 'sharepoint':
        return 'SharePoint';
      case 'local-sftp':
        return 'Local SFTP';
      case 'local-https':
        return 'Local HTTPS';
      default:
        return provider;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading storage configurations...</p>
          </div>
        </div>
      </div>
    );
  }

  const configs = configurations?.data || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storage Settings</h1>
          <p className="text-muted-foreground">
            Configure external repository integration for ISO 13485:2016 compliant document storage
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingConfig(null);
            setConfigDialogOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Configuration
        </Button>
      </div>

      <Tabs defaultValue="configurations" className="w-full">
        <TabsList>
          <TabsTrigger value="configurations">Storage Configurations</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          {configs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Server className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Storage Configurations</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Configure external storage providers to enable compliant document management
                </p>
                <Button 
                  onClick={() => {
                    setEditingConfig(null);
                    setConfigDialogOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Configure Storage
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {configs.map((config) => (
                <Card key={config.id} className={config.isDefault ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getProviderIcon(config.provider)}
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {config.name}
                            {config.isDefault && (
                              <Badge variant="default">Default</Badge>
                            )}
                            {!config.isActive && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{config.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(config)}
                          className="flex items-center gap-1"
                        >
                          <TestTube className="h-3 w-3" />
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(config)}
                          className="flex items-center gap-1"
                        >
                          <Settings className="h-3 w-3" />
                          Edit
                        </Button>
                        {!config.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(config)}
                            disabled={setDefaultMutation.isPending}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(config)}
                          disabled={config.isDefault}
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Provider:</span>
                        <Badge variant="outline">{getProviderName(config.provider)}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Encryption:</span>
                        <Badge variant={config.encryptionSettings.enabled ? "default" : "secondary"}>
                          {config.encryptionSettings.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>

                      <div>
                        <span className="text-sm font-medium">Compliance:</span>
                        <div className="flex gap-2 mt-1">
                          {config.compliance.iso13485 && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              ISO 13485
                            </Badge>
                          )}
                          {config.compliance.cfr21Part11 && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              21 CFR Part 11
                            </Badge>
                          )}
                          {config.compliance.gdpr && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              GDPR
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  ISO 13485:2016
                </CardTitle>
                <CardDescription>
                  Medical device quality management requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li>• Document control and versioning</li>
                  <li>• Audit trail maintenance</li>
                  <li>• Data integrity validation</li>
                  <li>• Access control mechanisms</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  21 CFR Part 11
                </CardTitle>
                <CardDescription>
                  FDA electronic records and signatures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li>• Electronic signature validation</li>
                  <li>• Secure audit trails</li>
                  <li>• System validation documentation</li>
                  <li>• User authentication controls</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  GDPR
                </CardTitle>
                <CardDescription>
                  European data protection regulation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li>• Data subject rights</li>
                  <li>• Processing lawfulness</li>
                  <li>• Privacy by design</li>
                  <li>• Cross-border compliance</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <StorageConfigurationDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        editingConfig={editingConfig}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/storage-settings'] });
          setConfigDialogOpen(false);
          setEditingConfig(null);
        }}
      />

      <StorageTestDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        config={selectedConfig}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => selectedConfig && deleteMutation.mutate(selectedConfig.id)}
        title="Delete Storage Configuration"
        description={`Are you sure you want to delete "${selectedConfig?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}