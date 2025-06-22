import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  type CapaAction, 
  type InsertCapaAction, 
  type CapaEvidence, 
  type InsertCapaEvidence,
  type CapaVerification,
  type InsertCapaVerification,
  type CapaCommunication,
  type InsertCapaCommunication
} from "@shared/schema";

// CAPA Actions
export function useCapaActions(capaId: number) {
  return useQuery<CapaAction[], Error>({
    queryKey: ['/api/capas', capaId, 'actions'],
    queryFn: async () => {
      const res = await fetch(`/api/capas/${capaId}/actions`);
      if (!res.ok) {
        throw new Error('Failed to fetch CAPA actions');
      }
      return res.json();
    },
  });
}

export function useCapaActionMutation() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ capaId, action }: { capaId: number, action: Omit<InsertCapaAction, 'capaId' | 'createdBy'> }) => {
      const res = await apiRequest('POST', `/api/capas/${capaId}/actions`, action);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create action');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/capas', variables.capaId, 'actions'] });
      toast({
        title: 'Action created',
        description: 'A new action was successfully added to the CAPA plan.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create action',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCapaAction() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ actionId, data }: { actionId: number, data: Partial<CapaAction> }) => {
      const res = await apiRequest('PUT', `/api/actions/${actionId}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update action');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/capas', data.capaId, 'actions'] });
      toast({
        title: 'Action updated',
        description: 'The action was successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update action',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Evidence
export function useActionEvidence(actionId: number) {
  return useQuery<CapaEvidence[], Error>({
    queryKey: ['/api/actions', actionId, 'evidence'],
    queryFn: async () => {
      const res = await fetch(`/api/actions/${actionId}/evidence`);
      if (!res.ok) {
        throw new Error('Failed to fetch evidence');
      }
      return res.json();
    },
  });
}

export function useAddEvidenceMutation() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ actionId, evidence }: { actionId: number, evidence: Omit<InsertCapaEvidence, 'actionId' | 'capaId' | 'uploadedBy'> }) => {
      const res = await apiRequest('POST', `/api/actions/${actionId}/evidence`, evidence);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to add evidence');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/actions', data.actionId, 'evidence'] });
      toast({
        title: 'Evidence added',
        description: 'New evidence was successfully added to the action.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add evidence',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Verifications
export function useActionVerification(actionId: number) {
  return useQuery<CapaVerification[], Error>({
    queryKey: ['/api/actions', actionId, 'verifications'],
    queryFn: async () => {
      // Note: This endpoint doesn't exist yet, but would be a good addition
      // For now, we'll assume the verifications are part of the evidence response
      const res = await fetch(`/api/actions/${actionId}/evidence`);
      if (!res.ok) {
        throw new Error('Failed to fetch verifications');
      }
      return res.json();
    },
    enabled: false, // Disable this query until endpoint is implemented
  });
}

export function useVerifyActionMutation() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ actionId, verification }: { actionId: number, verification: Omit<InsertCapaVerification, 'actionId' | 'reviewerId'> }) => {
      const res = await apiRequest('POST', `/api/actions/${actionId}/verify`, verification);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to verify action');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/actions', data.actionId, 'evidence'] });
      queryClient.invalidateQueries({ queryKey: ['/api/capas', data.capaId, 'actions'] });
      toast({
        title: 'Action verified',
        description: 'The action was successfully verified.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to verify action',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Communications
export function useCapaCommunications(capaId: number) {
  return useQuery<CapaCommunication[], Error>({
    queryKey: ['/api/capas', capaId, 'communications'],
    queryFn: async () => {
      const res = await fetch(`/api/capas/${capaId}/communications`);
      if (!res.ok) {
        throw new Error('Failed to fetch communications');
      }
      return res.json();
    },
  });
}

export function useAddCommunicationMutation() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ capaId, communication }: { capaId: number, communication: Omit<InsertCapaCommunication, 'capaId' | 'communicatedBy'> }) => {
      const res = await apiRequest('POST', `/api/capas/${capaId}/communications`, communication);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to add communication');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/capas', data.capaId, 'communications'] });
      toast({
        title: 'Communication recorded',
        description: 'The communication was successfully recorded.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to record communication',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useMarkCapaAsReadyMutation() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (capaId: number) => {
      const res = await apiRequest('POST', `/api/capas/${capaId}/mark-ready`, {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to mark CAPA as ready for effectiveness review');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/capas'] });
      queryClient.invalidateQueries({ queryKey: ['/api/capas', data.id] });
      toast({
        title: 'CAPA marked as ready',
        description: 'The CAPA was successfully marked as ready for effectiveness review.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to mark CAPA as ready',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}