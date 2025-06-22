import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const SystemAnalyticsPage: React.FC = () => {
  
  // Mock data for demonstration - in production, this would come from APIs
  const systemHealth = {
    uptime: 99.8,
    avgResponseTime: 145,
    activeUsers: 24,
    totalUsers: 156,
    storageUsed: 68.5,
    databaseConnections: 12
  };

  const moduleUsage = [
    { name: 'Document Control', usage: 89, users: 45 },
    { name: 'CAPA Management', usage: 76, users: 32 },
    { name: 'Design Control', usage: 67, users: 28 },
    { name: 'Supplier Management', usage: 54, users: 22 },
    { name: 'Training Records', usage: 43, users: 18 },
    { name: 'Internal Audit', usage: 38, users: 15 }
  ];

  const performanceData = [
    { time: '00:00', responseTime: 120, throughput: 450 },
    { time: '04:00', responseTime: 95, throughput: 280 },
    { time: '08:00', responseTime: 165, throughput: 680 },
    { time: '12:00', responseTime: 180, throughput: 750 },
    { time: '16:00', responseTime: 155, throughput: 620 },
    { time: '20:00', responseTime: 140, throughput: 520 }
  ];

  const complianceMetrics = [
    { category: 'ISO 13485', score: 94, status: 'Compliant' },
    { category: '21 CFR Part 820', score: 91, status: 'Compliant' },
    { category: 'ISO 14971', score: 88, status: 'Minor Issues' },
    { category: 'IEC 62304', score: 96, status: 'Compliant' }
  ];

  const auditStats = [
    { name: 'Passed', value: 142, color: '#22c55e' },
    { name: 'Minor NC', value: 23, color: '#f59e0b' },
    { name: 'Major NC', value: 8, color: '#ef4444' },
    { name: 'Pending', value: 12, color: '#6b7280' }
  ];

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            System Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor system performance, usage patterns, and compliance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Uptime</p>
                <p className="text-2xl font-bold">{systemHealth.uptime}%</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{systemHealth.activeUsers}/{systemHealth.totalUsers}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{systemHealth.avgResponseTime}ms</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">{systemHealth.storageUsed}%</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Module Usage</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audits">Audit Results</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Response Time (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="throughput" fill="#10b981" name="Requests/hour" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Usage Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Usage percentage and active users by module
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {moduleUsage.map((module) => (
                  <div key={module.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{module.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{module.users} users</Badge>
                        <span className="text-sm text-muted-foreground">{module.usage}%</span>
                      </div>
                    </div>
                    <Progress value={module.usage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Compliance Scores</CardTitle>
              <p className="text-sm text-muted-foreground">
                Current compliance status across regulatory frameworks
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {complianceMetrics.map((metric) => (
                  <div key={metric.category} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{metric.category}</h3>
                      <Badge 
                        variant={metric.status === 'Compliant' ? 'default' : 'secondary'}
                        className={metric.status === 'Compliant' ? 'bg-green-600' : 'bg-yellow-600'}
                      >
                        {metric.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={metric.score} className="h-2 flex-1" />
                      <span className="text-sm font-medium">{metric.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Results Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={auditStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {auditStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Audit Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Passed Audits</span>
                    </div>
                    <Badge className="bg-green-600">142</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span>Minor Non-Conformities</span>
                    </div>
                    <Badge className="bg-yellow-600">23</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span>Major Non-Conformities</span>
                    </div>
                    <Badge className="bg-red-600">8</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <span>Pending Reviews</span>
                    </div>
                    <Badge variant="secondary">12</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemAnalyticsPage;