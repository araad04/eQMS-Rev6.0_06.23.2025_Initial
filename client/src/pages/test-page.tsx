import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TestPage: React.FC = () => {
  const { user, logoutMutation } = useAuth();
  const [apiStatus, setApiStatus] = React.useState<string>('Checking...');
  const [error, setError] = React.useState<string | null>(null);
  
  // Log user data for debugging
  React.useEffect(() => {
    console.log('TestPage: Current user data:', user);
  }, [user]);
  
  React.useEffect(() => {
    console.log('TestPage component mounted - testing API connectivity');
    
    const testApi = async () => {
      try {
        const response = await fetch('/api/health');
        console.log('API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API data:', data);
          setApiStatus('Online');
        } else {
          console.error('API error response:', response.status);
          setApiStatus(`Error: ${response.status}`);
        }
      } catch (err) {
        console.error('API fetch error:', err);
        setApiStatus('Offline');
        setError(err instanceof Error ? err.message : String(err));
      }
    };
    
    testApi();
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
    // Force a refresh after logout to ensure proper state reset
    setTimeout(() => {
      console.log("Performing hard reload after logout");
      window.location.href = '/';
    }, 500);
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">eQMS</span>
            </a>
          </div>
          <div className="flex-1"></div>
          <nav className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">
                  Welcome, {user.firstName} {user.lastName} ({user.role})
                </span>
                <Button onClick={handleLogout} variant="ghost" size="sm">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a href="/auth">
                  <Button variant="outline" size="sm">
                    Login / Register
                  </Button>
                </a>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to the eQMS system dashboard
            </p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="api-test">API Test</TabsTrigger>
              <TabsTrigger value="user-info">User Info</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      No documents in system
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>CAPAs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      No corrective actions in system
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Audits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      No audits in system
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="api-test">
              <Card>
                <CardHeader>
                  <CardTitle>API Connection Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Status</h3>
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-2 ${
                        apiStatus === 'Online' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span>{apiStatus}</span>
                    </div>
                    {error && (
                      <div className="text-sm text-red-500 mt-2">{error}</div>
                    )}
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <h3 className="font-semibold">Test Links</h3>
                    <ul className="space-y-2">
                      <li>
                        <a 
                          href="/api/health" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          API Health Check (JSON)
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/api/user" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Current User Info (JSON)
                        </a>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="user-info">
              <Card>
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  {user ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                          <p>{user.username}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                          <p>{user.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                          <p>{user.firstName} {user.lastName}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
                          <p>{user.department}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                          <p className="capitalize">{user.role}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
                          <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>No user information available</div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleLogout} 
                    variant="outline" 
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? "Logging out..." : "Logout"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default TestPage;