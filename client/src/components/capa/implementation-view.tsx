import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CheckCircle, 
  ClipboardList, 
  FilePlus, 
  FileText, 
  Loader2, 
  MessageSquare,
  Shield
} from "lucide-react";
import { ActionsList } from "./actions-list";
import { CommunicationsList } from "./communications-list";
import { BadgeColored } from "@/components/ui/badge-colored";

// Implementation phases
const IMPLEMENTATION_PHASES = {
  NOT_STARTED: 0,
  PLANNING: 1, 
  IN_PROGRESS: 2,
  PENDING_VERIFICATION: 3,
  COMPLETED: 4
};

// Phase names
const PHASE_NAMES = {
  [IMPLEMENTATION_PHASES.NOT_STARTED]: "Not Started",
  [IMPLEMENTATION_PHASES.PLANNING]: "Planning",
  [IMPLEMENTATION_PHASES.IN_PROGRESS]: "In Progress",
  [IMPLEMENTATION_PHASES.PENDING_VERIFICATION]: "Pending Verification",
  [IMPLEMENTATION_PHASES.COMPLETED]: "Completed"
};

// Badge variants for phases
const PHASE_VARIANTS = {
  [IMPLEMENTATION_PHASES.NOT_STARTED]: "outline",
  [IMPLEMENTATION_PHASES.PLANNING]: "secondary",
  [IMPLEMENTATION_PHASES.IN_PROGRESS]: "default",
  [IMPLEMENTATION_PHASES.PENDING_VERIFICATION]: "warning",
  [IMPLEMENTATION_PHASES.COMPLETED]: "success"
} as const;

interface ImplementationViewProps {
  capa: {
    id: number;
    capaId: string;
    title: string;
    statusId: number;
    implementationPhase: number;
    readyForEffectivenessReview: boolean;
  };
}

export function ImplementationView({ capa }: ImplementationViewProps) {
  const [activeTab, setActiveTab] = useState<"actions" | "communications">("actions");
  const [openMarkReadyDialog, setOpenMarkReadyDialog] = useState(false);
  const { toast } = useToast();
  
  // Query for loading actions
  const { data: actions, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/capa-actions", capa.id],
    enabled: !!capa.id
  });
  
  // Mutation for marking CAPA as ready for effectiveness review
  const markReadyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/capas/${capa.id}/mark-ready-for-effectiveness-review`);
    },
    onSuccess: () => {
      toast({
        title: "CAPA updated",
        description: "The CAPA has been marked as ready for effectiveness review.",
      });
      // Invalidate the CAPA query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/capas", capa.id] });
      setOpenMarkReadyDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update CAPA",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Derived state
  const isImplemented = capa.implementationPhase === IMPLEMENTATION_PHASES.COMPLETED;
  const isPendingVerification = capa.implementationPhase === IMPLEMENTATION_PHASES.PENDING_VERIFICATION;
  const isReadyForEffectivenessReview = capa.readyForEffectivenessReview;
  
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
        <p>Failed to load implementation data.</p>
        <p className="text-sm">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Implementation status summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Implementation Status</h3>
              <div className="flex items-center gap-2">
                <BadgeColored variant={PHASE_VARIANTS[capa.implementationPhase] as any}>
                  {PHASE_NAMES[capa.implementationPhase]}
                </BadgeColored>
                {isReadyForEffectivenessReview && (
                  <BadgeColored variant="success" className="flex items-center">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Ready for Effectiveness Review
                  </BadgeColored>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {isImplemented && !isReadyForEffectivenessReview && (
                <Button 
                  variant="outline" 
                  className="flex items-center"
                  onClick={() => setOpenMarkReadyDialog(true)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Mark Ready for Effectiveness Review
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tab navigation */}
      <div className="flex border-b border-border space-x-1">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'actions'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('actions')}
        >
          <ClipboardList className="inline h-4 w-4 mr-2" />
          Actions
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'communications'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('communications')}
        >
          <MessageSquare className="inline h-4 w-4 mr-2" />
          Communications
        </button>
      </div>
      
      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'actions' ? (
          <div>
            <ActionsList capaId={capa.id} />
          </div>
        ) : (
          <div>
            <CommunicationsList capaId={capa.id} />
          </div>
        )}
      </div>

      {/* Mark Ready Dialog */}
      <MarkReadyDialog
        open={openMarkReadyDialog}
        onOpenChange={setOpenMarkReadyDialog}
        capaId={capa.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/capas", capa.id] });
          refetch();
        }}
      />
    </div>
  );
}

// Dialog for marking a CAPA ready for effectiveness review
function MarkReadyDialog({ 
  open, 
  onOpenChange, 
  capaId, 
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  capaId: number;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [comments, setComments] = useState("");
  
  // Mutation for marking CAPA as ready for effectiveness review
  const markReadyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/capas/${capaId}/mark-ready-for-effectiveness-review`, {
        comments
      });
    },
    onSuccess: () => {
      toast({
        title: "CAPA updated",
        description: "The CAPA has been marked as ready for effectiveness review.",
      });
      // Reset dialog state
      setComments("");
      onOpenChange(false);
      // Callback to parent component
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update CAPA",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markReadyMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mark CAPA Ready for Effectiveness Review</DialogTitle>
          <DialogDescription>
            This will mark the CAPA as ready for effectiveness review. This is a key milestone in the CAPA lifecycle.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <div className="mb-4">
              <label htmlFor="comments" className="block text-sm font-medium mb-1">
                Comments (optional)
              </label>
              <textarea
                id="comments"
                className="w-full min-h-[100px] px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Add any comments about the readiness for effectiveness review..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
              <div className="flex items-start">
                <Shield className="text-amber-500 h-5 w-5 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Important Information</p>
                  <p className="text-sm text-amber-700 mt-1">
                    By marking this CAPA as ready for effectiveness review, you're confirming that:
                  </p>
                  <ul className="text-sm text-amber-700 mt-1 list-disc pl-5 space-y-1">
                    <li>All planned actions have been implemented</li>
                    <li>All required evidence has been collected</li>
                    <li>The implementation has been verified</li>
                    <li>The CAPA meets the requirements specified in the plan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={markReadyMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={markReadyMutation.isPending}
              className="flex items-center"
            >
              {markReadyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}