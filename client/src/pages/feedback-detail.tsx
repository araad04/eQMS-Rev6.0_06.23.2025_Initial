import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Clock, FileText, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CustomerFeedback } from "@shared/schema";
import { formatDate } from "@/lib/utils";

export default function FeedbackDetailPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/measurement-analysis/feedback/:id");
  const feedbackId = params?.id;

  const { data: feedback, isLoading, error } = useQuery<CustomerFeedback>({
    queryKey: [`/api/customer-feedback/${feedbackId}`],
    enabled: !!feedbackId,
  });

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline">Open</Badge>;
      case "in_review":
        return <Badge variant="outline" className="bg-amber-100 text-amber-700 hover:bg-amber-100">In Review</Badge>;
      case "closed":
        return <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get sentiment badge styling
  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Positive</Badge>;
      case "neutral":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Neutral</Badge>;
      case "negative":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Negative</Badge>;
      default:
        return <Badge>{sentiment}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Error loading feedback</h2>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "Could not load the requested feedback."}
        </p>
        <Button onClick={() => navigate("/measurement-analysis/feedback")}>
          Return to Feedback List
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/measurement-analysis/feedback")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Feedback Details</h1>
          <p className="text-muted-foreground">
            View and manage customer feedback information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{feedback.feedbackNumber}</CardTitle>
                  <CardDescription>
                    Received on {formatDate(feedback.dateReceived)}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(feedback.status)}
                  {feedback.sentiment && getSentimentBadge(feedback.sentiment)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">{feedback.summary}</h3>
                  <p className="mt-2 whitespace-pre-wrap">{feedback.description}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Feedback Source</h4>
                    <p>{feedback.feedbackSource.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
                    <p>{feedback.category}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Feedback Type</h4>
                    <p>{feedback.feedbackType}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Target Response</h4>
                    <p>{feedback.targetResponseDays} days</p>
                  </div>
                </div>
                
                {feedback.justification && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Justification/Analysis</h4>
                      <p className="whitespace-pre-wrap">{feedback.justification}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Status Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Date Received</h4>
                    <p>{formatDate(feedback.dateReceived)}</p>
                  </div>
                </div>
                
                {feedback.assignedTo && (
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Assigned To</h4>
                      <p>User ID: {feedback.assignedTo}</p>
                    </div>
                  </div>
                )}
                
                {feedback.dateClosed && (
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Date Closed</h4>
                      <p>{formatDate(feedback.dateClosed)}</p>
                    </div>
                  </div>
                )}
                
                {feedback.actualResponseDate && (
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Actual Response Date</h4>
                      <p>{formatDate(feedback.actualResponseDate)}</p>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Record Details</h4>
                    <p className="text-sm text-muted-foreground">Created: {formatDate(feedback.createdAt)}</p>
                    <p className="text-sm text-muted-foreground">Last Updated: {formatDate(feedback.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 space-y-4">
            <Button className="w-full" variant="outline">
              Edit Feedback
            </Button>
            <Button className="w-full" variant={feedback.status === "open" ? "default" : "outline"}>
              {feedback.status === "open" ? "Close Feedback" : "Reopen Feedback"}
            </Button>
            {feedback.feedbackType === "negative" && feedback.status === "open" && (
              <Button className="w-full" variant="destructive">
                Create CAPA
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}