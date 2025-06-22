import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerFeedback } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { useLocation } from "wouter";
import { AlertCircle, FileText, PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomerFeedbackTableProps {
  data: CustomerFeedback[];
  isLoading: boolean;
}

export default function CustomerFeedbackTable({ data, isLoading }: CustomerFeedbackTableProps) {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Filter feedback based on search term and filters
  const filteredFeedback = data?.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    const matchesType =
      typeFilter === "all" || item.category === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
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

  // Get feedback type badge styling
  const getFeedbackTypeBadge = (type: string) => {
    switch (type) {
      case "complaint":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Complaint</Badge>;
      case "general_feedback":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">General</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search feedback..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="complaint">Complaints</SelectItem>
                <SelectItem value="general_feedback">General Feedback</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => navigate("/measurement-analysis/feedback/create")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Record Feedback
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredFeedback && filteredFeedback.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedback.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">
                    FB-{item.id.toString().padStart(5, "0")}
                  </TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.summary}
                  </TableCell>
                  <TableCell>{getFeedbackTypeBadge(item.category)}</TableCell>
                  <TableCell className="capitalize">
                    {item.feedbackSource.replace('_', ' ')}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/measurement-analysis/feedback/${item.id}`)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No feedback found</h3>
            <p className="text-muted-foreground mt-1">
              No customer feedback records match your current filters
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/measurement-analysis/feedback/create")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Record New Feedback
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}