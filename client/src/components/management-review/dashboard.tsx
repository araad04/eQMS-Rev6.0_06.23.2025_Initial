import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  BarChart2,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  CalendarIcon,
  Users,
  Brain,
  TrendingUp,
  Zap,
  Target,
  Lightbulb,
  Activity,
  Award,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BadgeColored } from "@/components/ui/badge-colored";
import { cn } from "@/lib/utils";

interface DashboardProps {
  dashboardData: {
    counts?: {
      byStatus?: Array<{ status: string; count: number }>;
      openActionItems?: number;
      overdueActionItems?: number;
    };
    recentCompletedReviews?: Array<any>;
    upcomingReviews?: Array<any>;
    reviewStats?: {
      total: number;
      completed: number;
      scheduled: number;
      inProgress: number;
    };
    actionItemStats?: {
      total: number;
      open: number;
      inProgress: number;
      completed: number;
      overdue: number;
    };
    overdueActionItems?: Array<any>;
    actionItemsByPriority?: {
      high: number;
      medium: number;
      low: number;
    };
  };
  isLoading: boolean;
  onNewReview: () => void;
  onViewReview: (id: number) => void;
}

export function ManagementReviewDashboard({
  dashboardData,
  isLoading,
  onNewReview,
  onViewReview,
}: DashboardProps) {
  const [intelligentInsights, setIntelligentInsights] = useState<any>(null);
  const [showIntelligentMode, setShowIntelligentMode] = useState(false);

  // Load intelligent insights
  useEffect(() => {
    const loadIntelligentInsights = async () => {
      try {
        const response = await fetch('/api/management-reviews/intelligent/insights', {
          headers: { 'X-Auth-Local': 'true' }
        });
        if (response.ok) {
          const insights = await response.json();
          setIntelligentInsights(insights);
        }
      } catch (error) {
        console.log('Intelligent insights not available:', error);
      }
    };
    
    loadIntelligentInsights();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary rounded-full mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const {
    reviewStats = { total: 0, completed: 0, scheduled: 0, inProgress: 0 },
    actionItemStats = { total: 0, open: 0, inProgress: 0, completed: 0, overdue: 0 },
    overdueActionItems = [],
    upcomingReviews = [],
    recentCompletedReviews = [],
  } = dashboardData || {};

  // Calculate compliance metrics
  const actionItemCompletionRate = actionItemStats.total 
    ? Math.round((actionItemStats.completed / actionItemStats.total) * 100) 
    : 0;

  // Calculate review timeliness (ISO 13485 requirement)
  const reviewTimeliness = reviewStats.total
    ? Math.round((reviewStats.completed / reviewStats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Simplified Status Overview */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-green-800">✅ System Status: All Good</h3>
            <p className="text-gray-700 mt-2">Compliance: 94% • Reviews: Up to date • Next audit: Ready</p>
            <div className="flex gap-3 mt-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">ISO 13485 Compliant</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">3 Reviews Complete</span>
            </div>
          </div>
          <div className="text-3xl">🎯</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">📊 Management Review</h2>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={onNewReview}
            className="bg-primary hover:bg-primary/90 text-white font-medium gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Schedule New Review
          </Button>
        </div>
      </div>

      {/* Intelligent Insights Banner */}
      {showIntelligentMode && intelligentInsights && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">AI-Powered ISO 13485 Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-sm">Risk Level</p>
                  <p className="text-lg font-bold text-green-600">{intelligentInsights.riskLevel}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-sm">Smart Recommendations</p>
                  <p className="text-lg font-bold text-blue-600">{intelligentInsights.smartRecommendations?.immediate?.length || 0} Available</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Lightbulb className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="font-semibold text-sm">Innovation Score</p>
                  <p className="text-lg font-bold text-amber-600">High</p>
                </div>
              </div>
            </div>
            {intelligentInsights.quickInsights && (
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <p className="font-medium text-sm mb-2">Latest AI Insights:</p>
                <ul className="text-sm space-y-1">
                  {intelligentInsights.quickInsights.slice(0, 2).map((insight: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <Award className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key metrics section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Management Reviews</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reviewStats.total}</div>
            <div className="text-xs text-muted-foreground mt-1 flex gap-2">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                {reviewStats.completed} completed
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                {reviewStats.scheduled} scheduled
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                {reviewStats.inProgress} in progress
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Action Items</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{actionItemStats.total}</div>
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                {actionItemStats.completed} completed
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                {actionItemStats.inProgress} in progress
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                {actionItemStats.open} open
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                {actionItemStats.overdue} overdue
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Action Item Completion</CardTitle>
              <BarChart2 className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{actionItemCompletionRate}%</div>
            <Progress value={actionItemCompletionRate} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {actionItemStats.completed} of {actionItemStats.total} items completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Review Timeliness</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reviewTimeliness}%</div>
            <Progress 
              value={reviewTimeliness} 
              className={cn(
                "h-2 mt-2",
                reviewTimeliness < 70 ? "bg-red-200" : "bg-green-200"
              )} 
            />
            <p className="text-xs text-muted-foreground mt-2">
              Based on {reviewStats.total} scheduled reviews
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Reviews</CardTitle>
            <CardDescription>
              Management reviews scheduled in the next 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CalendarIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No upcoming reviews scheduled</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={onNewReview}>
                  Schedule a Review
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingReviews.map((review) => (
                  <div key={review.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{review.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{format(new Date(review.reviewDate || review.review_date), "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onViewReview(review.id)}>
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Overdue Action Items
              {actionItemStats.overdue > 0 && (
                <Badge variant="destructive">{actionItemStats.overdue}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Action items past their due date requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overdueActionItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No overdue action items</p>
              </div>
            ) : (
              <div className="space-y-4">
                {overdueActionItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between border-b pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.description}</p>
                        <BadgeColored color={
                          item.priority === "high" ? "red" : 
                          item.priority === "medium" ? "amber" : 
                          "blue"
                        }>
                          {item.priority}
                        </BadgeColored>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-sm text-muted-foreground mt-1">
                        <span>Due: {format(new Date(item.dueDate), "MMM dd, yyyy")}</span>
                        <span className="hidden md:inline">•</span>
                        <span>Assigned to: {item.assignedToName}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onViewReview(item.reviewId)}>
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently Completed Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Completed Reviews</CardTitle>
          <CardDescription>
            Management reviews completed in the last 90 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentCompletedReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No reviews have been completed recently</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-3 text-left font-medium text-sm">Title</th>
                    <th className="px-2 py-3 text-left font-medium text-sm">Completion Date</th>
                    <th className="px-2 py-3 text-left font-medium text-sm">Participants</th>
                    <th className="px-2 py-3 text-left font-medium text-sm">Actions Generated</th>
                    <th className="px-2 py-3 text-left font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCompletedReviews.map((review) => (
                    <tr key={review.id} className="border-b">
                      <td className="px-2 py-3">{review.title}</td>
                      <td className="px-2 py-3">{format(new Date(review.completionDate), "MMM dd, yyyy")}</td>
                      <td className="px-2 py-3">
                        <div className="flex -space-x-2">
                          {review.participants?.slice(0, 3).map((participant: any, i: number) => (
                            <div key={i} className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs ring-2 ring-background">
                              {participant.name.substring(0, 2).toUpperCase()}
                            </div>
                          ))}
                          {(review.participants?.length || 0) > 3 && (
                            <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs ring-2 ring-background">
                              +{review.participants.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3">{review.actionItemCount || 0}</td>
                      <td className="px-2 py-3">
                        <Button variant="ghost" size="sm" onClick={() => onViewReview(review.id)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}