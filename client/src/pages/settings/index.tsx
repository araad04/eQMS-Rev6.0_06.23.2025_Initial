import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Settings, Server, Database, Users, Shield, Bell, HardDrive } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <PageHeader 
        title="System Management"
        description="Manage system settings and monitor system performance"
      />
      
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Link href="/settings/api-test">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Server className="h-5 w-5 mr-2 text-indigo-500" />
                  API System Test
                </CardTitle>
                <CardDescription>
                  Monitor API connectivity and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View real-time API status, test connections, and monitor system health metrics
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/settings/database">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Database className="h-5 w-5 mr-2 text-amber-500" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Monitor database status and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Check database health, manage backups, and optimize database performance
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/user-management">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2 text-green-500" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage users and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create and manage user accounts, assign roles and permissions
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/settings/security">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Shield className="h-5 w-5 mr-2 text-red-500" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure system security options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage authentication settings, password policies, and session controls
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/settings/notifications">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Bell className="h-5 w-5 mr-2 text-blue-500" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure system-wide notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Set up email notifications, alerts, and system notifications
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/settings/system-logs">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <HardDrive className="h-5 w-5 mr-2 text-purple-500" />
                  System Logs
                </CardTitle>
                <CardDescription>
                  View and manage system logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Access system logs, audit trails, and error logs for troubleshooting
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
}