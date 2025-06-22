import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/use-users";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  FileText,
  Loader2,
  MessageSquare,
  PlusCircle,
  Users
} from "lucide-react";
import { BadgeColored } from "@/components/ui/badge-colored";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface CommunicationsListProps {
  capaId: number;
}

const COMMUNICATION_TYPES = {
  EMAIL: "email",
  MEETING: "meeting",
  PHONE: "phone",
  MEMO: "memo",
  OTHER: "other"
};

const COMMUNICATION_TYPE_LABELS = {
  [COMMUNICATION_TYPES.EMAIL]: "Email",
  [COMMUNICATION_TYPES.MEETING]: "Meeting",
  [COMMUNICATION_TYPES.PHONE]: "Phone Call",
  [COMMUNICATION_TYPES.MEMO]: "Memo",
  [COMMUNICATION_TYPES.OTHER]: "Other"
};

export function CommunicationsList({ capaId }: CommunicationsListProps) {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const { toast } = useToast();
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  
  // Query for loading communications
  const { 
    data: communications = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/capa-communications", capaId],
    enabled: !!capaId
  });

  // Function to get user name by ID
  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown";
  };

  // Function to get communication type label
  const getCommunicationTypeLabel = (type: string) => {
    return COMMUNICATION_TYPE_LABELS[type] || "Unknown";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-6 text-destructive">
        <AlertCircle className="h-12 w-12 mx-auto mb-2" />
        <p>Failed to load communications.</p>
        <p className="text-sm">{(error as Error).message}</p>
      </div>
    );
  }

  // No communications yet
  if (communications.length === 0) {
    return (
      <div>
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Communication History</h3>
          <Button 
            onClick={() => setOpenAddDialog(true)}
            className="flex items-center"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Communication
          </Button>
        </div>
        
        <div className="text-center py-12 bg-muted/20 rounded-lg border border-border">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">No communications recorded yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1 max-w-md mx-auto">
            Record important communications related to this CAPA, such as meetings, emails, or phone calls.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setOpenAddDialog(true)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Record Communication
          </Button>
        </div>
        
        {/* Add Communication Dialog */}
        <AddCommunicationDialog 
          capaId={capaId} 
          open={openAddDialog} 
          onOpenChange={setOpenAddDialog} 
          onSuccess={refetch}
        />
      </div>
    );
  }

  // Communications list
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Communication History</h3>
        <Button 
          onClick={() => setOpenAddDialog(true)}
          className="flex items-center"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Communication
        </Button>
      </div>
      
      <div className="space-y-4">
        {communications.map((comm) => (
          <Card key={comm.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{comm.message || comm.description}</CardTitle>
                  <CardDescription>
                    {format(new Date(comm.communicatedAt), 'PPP')} - {getCommunicationTypeLabel(comm.communicationType)}
                  </CardDescription>
                </div>
                {comm.recipients && comm.recipients.length > 0 && (
                  <BadgeColored variant="secondary" className="flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    {comm.recipients.length} Recipients
                  </BadgeColored>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-sm text-gray-700">
                {comm.description}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between pt-0">
              <div className="text-sm text-muted-foreground">
                Recorded by: {getUserName(comm.communicatedBy)}
              </div>
              <div className="flex space-x-2">
                {comm.requiresAcknowledgment && (
                  <Button variant="outline" size="sm" className="h-8">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Acknowledge
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Add Communication Dialog */}
      <AddCommunicationDialog 
        capaId={capaId} 
        open={openAddDialog} 
        onOpenChange={setOpenAddDialog} 
        onSuccess={refetch}
      />
    </div>
  );
}

// Dialog for adding communication
function AddCommunicationDialog({ 
  capaId, 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  capaId: number; 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSuccess: () => void;
}) {
  // This is a placeholder
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record Communication</DialogTitle>
          <DialogDescription>
            Document a communication related to CAPA #{capaId}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 text-center text-muted-foreground">
          <MessageSquare className="mx-auto h-12 w-12 mb-2 text-muted-foreground/50" />
          <p>Communication form coming soon.</p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled>
            Save Communication
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}