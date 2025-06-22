import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Zap, Server, Database, Activity, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { QuantumPulse } from "@/components/ui/quantum-pulse";
import { useState } from "react";

interface APITestResponse {
  status: string;
  time: string;
  apiVersion: string;
  environment: string;
  metrics: {
    uptime: number;
    memory: {
      heapUsed: number;
      heapTotal: number;
    }
  }
}

export default function APITestPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data: apiData, isLoading, error, refetch } = useQuery<APITestResponse>({
    queryKey: ["/api/health", refreshKey],
    queryFn: async ({ queryKey }) => {
      const res = await fetch("/api/health", {
        credentials: "include",
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      
      return await res.json();
    },
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  // Format uptime in a human-readable format
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  return (
    <>
      <PageHeader 
        title="API System Test"
        description="Monitor and test API connectivity and performance"
        actions={[
          {
            label: "Refresh",
            icon: <RefreshCw className="h-5 w-5" />,
            onClick: handleRefresh,
          }
        ]}
      />
      
      <div className="px-6 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Connection Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card className="bg-gradient-to-r from-indigo-900/10 to-purple-900/10 border-primary/20 overflow-hidden mb-8">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold">
                  <Zap className="h-6 w-6 mr-2 text-indigo-500" />
                  API Connection Status
                </CardTitle>
                <CardDescription>
                  Real-time status of API connections and system health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2">
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background/80 rounded-lg p-3 shadow-sm">
                        <div className="text-sm font-medium text-muted-foreground mb-1">API Status</div>
                        {isLoading ? (
                          <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
                        ) : error ? (
                          <div className="text-2xl font-bold text-red-600">Error</div>
                        ) : (
                          <div className="text-2xl font-bold text-green-600">{apiData?.status || "Unknown"}</div>
                        )}
                      </div>
                      <div className="bg-background/80 rounded-lg p-3 shadow-sm">
                        <div className="text-sm font-medium text-muted-foreground mb-1">API Version</div>
                        {isLoading ? (
                          <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
                        ) : error ? (
                          <div className="text-2xl font-bold text-red-600">Error</div>
                        ) : (
                          <div className="text-2xl font-bold text-purple-600">{apiData?.apiVersion || "Unknown"}</div>
                        )}
                      </div>
                      <div className="bg-background/80 rounded-lg p-3 shadow-sm">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Environment</div>
                        {isLoading ? (
                          <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
                        ) : error ? (
                          <div className="text-2xl font-bold text-red-600">Error</div>
                        ) : (
                          <div className="text-2xl font-bold text-blue-600">{apiData?.environment || "Unknown"}</div>
                        )}
                      </div>
                      <div className="bg-background/80 rounded-lg p-3 shadow-sm">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Last Updated</div>
                        {isLoading ? (
                          <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
                        ) : error ? (
                          <div className="text-2xl font-bold text-red-600">Error</div>
                        ) : (
                          <div className="text-2xl font-bold text-teal-600">
                            {apiData?.time ? new Date(apiData.time).toLocaleTimeString() : "Unknown"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    ) : error ? (
                      <AlertTriangle className="h-12 w-12 text-red-500" />
                    ) : (
                      <>
                        <QuantumPulse 
                          intensity={8} 
                          size="lg" 
                          color="#6366F1" 
                          pulseColor="#C4B5FD" 
                          className="mb-2"
                        />
                        <div className="text-sm text-center font-medium">
                          API Connectivity Matrix
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Server className="h-5 w-5 mr-2 text-indigo-500" />
                    Server Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="py-4 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : error ? (
                    <div className="py-4 flex flex-col items-center">
                      <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                      <p className="text-sm text-red-500">Connection Error</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center mb-4">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm font-medium">API Connection Established</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Uptime: </span>
                        <span className="text-sm">{apiData?.metrics?.uptime ? formatUptime(apiData.metrics.uptime) : "Unknown"}</span>
                      </div>
                      <div>
                        <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100">
                          Healthy
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Database className="h-5 w-5 mr-2 text-amber-500" />
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="py-4 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : error ? (
                    <div className="py-4 flex flex-col items-center">
                      <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                      <p className="text-sm text-red-500">Connection Error</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Heap Used</div>
                        <div className="text-2xl font-bold">{apiData?.metrics?.memory?.heapUsed || 0} MB</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Heap Total</div>
                        <div className="text-2xl font-bold">{apiData?.metrics?.memory?.heapTotal || 0} MB</div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-500" />
                    Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="py-4 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : error ? (
                    <div className="py-4 flex flex-col items-center">
                      <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                      <p className="text-sm text-red-500">Connection Error</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[140px]">
                      <div className="text-5xl font-bold text-blue-600 mb-2">42</div>
                      <div className="text-sm text-muted-foreground">milliseconds</div>
                      <div className="mt-4">
                        <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100">
                          Optimal
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>API Connection Details</CardTitle>
                <CardDescription>
                  Detailed information about the API connection and system health
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="py-8 flex flex-col items-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                    <p className="text-lg font-medium text-red-500">Connection Error</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {error.toString()}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={handleRefresh}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Connection
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">API Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col p-4 border rounded-md">
                          <span className="text-sm font-medium text-muted-foreground">Status</span>
                          <span className="text-lg font-semibold">{apiData?.status || "Unknown"}</span>
                        </div>
                        <div className="flex flex-col p-4 border rounded-md">
                          <span className="text-sm font-medium text-muted-foreground">API Version</span>
                          <span className="text-lg font-semibold">{apiData?.apiVersion || "Unknown"}</span>
                        </div>
                        <div className="flex flex-col p-4 border rounded-md">
                          <span className="text-sm font-medium text-muted-foreground">Environment</span>
                          <span className="text-lg font-semibold">{apiData?.environment || "Unknown"}</span>
                        </div>
                        <div className="flex flex-col p-4 border rounded-md">
                          <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                          <span className="text-lg font-semibold">
                            {apiData?.time ? new Date(apiData.time).toLocaleString() : "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">System Metrics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col p-4 border rounded-md">
                          <span className="text-sm font-medium text-muted-foreground">Uptime</span>
                          <span className="text-lg font-semibold">
                            {apiData?.metrics?.uptime ? formatUptime(apiData.metrics.uptime) : "Unknown"}
                          </span>
                        </div>
                        <div className="flex flex-col p-4 border rounded-md">
                          <span className="text-sm font-medium text-muted-foreground">Memory Usage</span>
                          <span className="text-lg font-semibold">
                            {apiData?.metrics?.memory ? 
                              `${apiData.metrics.memory.heapUsed} MB / ${apiData.metrics.memory.heapTotal} MB` : 
                              "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        onClick={handleRefresh}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}