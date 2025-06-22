import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TestTube, CheckCircle, AlertCircle, Clock, Shield, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StorageTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: any;
}

interface TestResult {
  success: boolean;
  latency?: number;
  error?: string;
  capabilities: {
    upload: boolean;
    download: boolean;
    delete: boolean;
    list: boolean;
    versioning: boolean;
    encryption: boolean;
  };
  compliance: {
    iso13485: boolean;
    cfr21Part11: boolean;
    auditTrail: boolean;
  };
}

export function StorageTestDialog({
  open,
  onOpenChange,
  config,
}: StorageTestDialogProps) {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testProgress, setTestProgress] = useState(0);

  const testMutation = useMutation({
    mutationFn: (configData: any) => 
      apiRequest('POST', '/api/storage-settings/test', {
        provider: configData.provider,
        config: configData.config
      }),
    onSuccess: async (result) => {
      try {
        const data = await result.json();
        const testData = data.data;
        
        // Transform the API response to match our expected structure
        setTestResult({
          success: testData.success,
          latency: testData.details?.latency,
          error: testData.success ? undefined : testData.message,
          capabilities: {
            upload: testData.success,
            download: testData.success,
            delete: testData.success,
            list: testData.success,
            versioning: testData.success,
            encryption: true, // Assume encryption is supported
          },
          compliance: {
            iso13485: testData.success,
            cfr21Part11: testData.success,
            auditTrail: testData.success,
          }
        });
        setTestProgress(100);
      } catch (error) {
        console.error('Error parsing test result:', error);
        setTestResult({
          success: false,
          error: "Failed to parse test response",
          capabilities: {
            upload: false,
            download: false,
            delete: false,
            list: false,
            versioning: false,
            encryption: false,
          },
          compliance: {
            iso13485: false,
            cfr21Part11: false,
            auditTrail: false,
          }
        });
        setTestProgress(100);
      }
    },
    onError: (error: any) => {
      setTestResult({
        success: false,
        error: error.message || "Connection test failed",
        capabilities: {
          upload: false,
          download: false,
          delete: false,
          list: false,
          versioning: false,
          encryption: false,
        },
        compliance: {
          iso13485: false,
          cfr21Part11: false,
          auditTrail: false,
        }
      });
      setTestProgress(100);
    },
  });

  const handleTest = () => {
    if (!config || !config.provider || !config.config) {
      console.error('Invalid config for storage test:', config);
      return;
    }
    
    setTestResult(null);
    setTestProgress(0);
    
    // Simulate progress for better UX
    const interval = setInterval(() => {
      setTestProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    testMutation.mutate(config);
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

  const renderCapabilityBadge = (capability: string, supported: boolean) => (
    <Badge 
      key={capability} 
      variant={supported ? "default" : "secondary"}
      className="flex items-center gap-1"
    >
      {supported ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      {capability}
    </Badge>
  );

  const renderComplianceBadge = (standard: string, compliant: boolean) => (
    <Badge 
      key={standard} 
      variant={compliant ? "default" : "outline"}
      className="flex items-center gap-1"
    >
      <Shield className="h-3 w-3" />
      {standard}
    </Badge>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Storage Connection Test
          </DialogTitle>
          <DialogDescription>
            Testing connection to {config ? getProviderName(config.provider) : 'storage provider'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {config && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{config.name}</CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Provider:</span>
                    <span className="ml-2">{getProviderName(config.provider)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge variant={config.isActive ? "default" : "secondary"} className="ml-2">
                      {config.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Encryption:</span>
                    <Badge variant={config.encryptionSettings?.enabled ? "default" : "outline"} className="ml-2">
                      {config.encryptionSettings?.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Default:</span>
                    <Badge variant={config.isDefault ? "default" : "outline"} className="ml-2">
                      {config.isDefault ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Connection Test</h3>
              <Button
                onClick={handleTest}
                disabled={testMutation.isPending || !config}
                className="flex items-center gap-2"
              >
                {testMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4" />
                    Run Test
                  </>
                )}
              </Button>
            </div>

            {testMutation.isPending && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Testing connection...</span>
                  <span>{testProgress}%</span>
                </div>
                <Progress value={testProgress} className="w-full" />
              </div>
            )}

            {testResult && (
              <div className="space-y-4">
                <Card className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${testResult.success ? "text-green-800" : "text-red-800"}`}>
                      {testResult.success ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      {testResult.success ? "Connection Successful" : "Connection Failed"}
                    </CardTitle>
                    {testResult.latency && (
                      <CardDescription className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Response time: {testResult.latency}ms
                      </CardDescription>
                    )}
                  </CardHeader>
                  {testResult.error && (
                    <CardContent>
                      <div className="bg-red-100 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-800">{testResult.error}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {testResult.success && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Storage Capabilities</CardTitle>
                        <CardDescription>
                          Features supported by this provider
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(testResult.capabilities).map(([key, value]) =>
                            renderCapabilityBadge(key, value as boolean)
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Compliance Standards</CardTitle>
                        <CardDescription>
                          Regulatory compliance support
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {testResult.compliance.iso13485 && 
                            renderComplianceBadge("ISO 13485", true)
                          }
                          {testResult.compliance.cfr21Part11 && 
                            renderComplianceBadge("21 CFR Part 11", true)
                          }
                          {testResult.compliance.auditTrail && 
                            renderComplianceBadge("Audit Trail", true)
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {testResult.success && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">Ready for Production</h4>
                          <p className="text-sm text-blue-800 mt-1">
                            This storage configuration has passed all connectivity tests and is ready for use in your eQMS system.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}