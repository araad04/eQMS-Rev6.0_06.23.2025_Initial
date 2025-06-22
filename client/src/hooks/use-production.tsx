import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Product, ProductionBatch, BatchProcessStep, Material, 
  MaterialLot, BatchMaterial, BatchDeviation, QualityCheck,
  Equipment, EquipmentUtilization
} from '@shared/schema';

// Product hooks
export function useProducts() {
  return useQuery({
    queryKey: ['/api/production/products'],
    retry: false
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['/api/production/products', id],
    enabled: !!id,
    retry: false
  });
}

export function useCreateProduct() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await apiRequest('POST', '/api/production/products', product);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/production/products'] });
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create product',
        variant: 'destructive',
      });
    }
  });
}

export function useUpdateProduct() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number, [key: string]: any }) => {
      const res = await apiRequest('PUT', `/api/production/products/${id}`, data);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/production/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production/products', variables.id] });
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product',
        variant: 'destructive',
      });
    }
  });
}

// Production Batch hooks
export function useProductionBatches(productId?: number) {
  return useQuery({
    queryKey: productId 
      ? ['/api/production/batches', { productId }] 
      : ['/api/production/batches'],
    retry: false
  });
}

export function useProductionBatch(id: number) {
  return useQuery({
    queryKey: ['/api/production/batches', id],
    enabled: !!id,
    retry: false
  });
}

export function useCreateProductionBatch() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (batch: Omit<ProductionBatch, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await apiRequest('POST', '/api/production/batches', batch);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/production/batches'] });
      // Also invalidate specific product batches query if it's loaded
      if (data.productId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/production/batches', { productId: data.productId }] 
        });
      }
      toast({
        title: 'Success',
        description: 'Production batch created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create production batch',
        variant: 'destructive',
      });
    }
  });
}

export function useUpdateProductionBatch() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number, [key: string]: any }) => {
      const res = await apiRequest('PUT', `/api/production/batches/${id}`, data);
      return await res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/production/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production/batches', variables.id] });
      // Also invalidate specific product batches query if it's loaded
      if (data.productId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/production/batches', { productId: data.productId }] 
        });
      }
      toast({
        title: 'Success',
        description: 'Production batch updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update production batch',
        variant: 'destructive',
      });
    }
  });
}

// Batch Process Steps hooks
export function useBatchProcessSteps(batchId: number) {
  return useQuery({
    queryKey: ['/api/production/batches', batchId, 'steps'],
    enabled: !!batchId,
    retry: false
  });
}

export function useBatchProcessStep(id: number) {
  return useQuery({
    queryKey: ['/api/production/steps', id],
    enabled: !!id,
    retry: false
  });
}

export function useCreateBatchProcessStep() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (step: Omit<BatchProcessStep, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await apiRequest('POST', '/api/production/steps', step);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/production/batches', data.batchId, 'steps'] 
      });
      toast({
        title: 'Success',
        description: 'Process step created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create process step',
        variant: 'destructive',
      });
    }
  });
}

export function useUpdateBatchProcessStep() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number, [key: string]: any }) => {
      const res = await apiRequest('PUT', `/api/production/steps/${id}`, data);
      return await res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/production/steps', variables.id] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/production/batches', data.batchId, 'steps'] 
      });
      toast({
        title: 'Success',
        description: 'Process step updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update process step',
        variant: 'destructive',
      });
    }
  });
}

// Materials hooks
export function useMaterials() {
  return useQuery({
    queryKey: ['/api/production/materials'],
    retry: false
  });
}

export function useMaterial(id: number) {
  return useQuery({
    queryKey: ['/api/production/materials', id],
    enabled: !!id,
    retry: false
  });
}

export function useCreateMaterial() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await apiRequest('POST', '/api/production/materials', material);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/production/materials'] });
      toast({
        title: 'Success',
        description: 'Material created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create material',
        variant: 'destructive',
      });
    }
  });
}

export function useUpdateMaterial() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number, [key: string]: any }) => {
      const res = await apiRequest('PUT', `/api/production/materials/${id}`, data);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/production/materials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production/materials', variables.id] });
      toast({
        title: 'Success',
        description: 'Material updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update material',
        variant: 'destructive',
      });
    }
  });
}

// Material Lots hooks
export function useMaterialLots(materialId?: number) {
  return useQuery({
    queryKey: materialId 
      ? ['/api/production/material-lots', { materialId }] 
      : ['/api/production/material-lots'],
    retry: false
  });
}

export function useMaterialLot(id: number) {
  return useQuery({
    queryKey: ['/api/production/material-lots', id],
    enabled: !!id,
    retry: false
  });
}

export function useCreateMaterialLot() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (lot: Omit<MaterialLot, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await apiRequest('POST', '/api/production/material-lots', lot);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/production/material-lots'] });
      // Also invalidate specific material lots query if it's loaded
      if (data.materialId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/production/material-lots', { materialId: data.materialId }] 
        });
      }
      toast({
        title: 'Success',
        description: 'Material lot created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create material lot',
        variant: 'destructive',
      });
    }
  });
}

export function useUpdateMaterialLot() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number, [key: string]: any }) => {
      const res = await apiRequest('PUT', `/api/production/material-lots/${id}`, data);
      return await res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/production/material-lots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production/material-lots', variables.id] });
      // Also invalidate specific material lots query if it's loaded
      if (data.materialId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/production/material-lots', { materialId: data.materialId }] 
        });
      }
      toast({
        title: 'Success',
        description: 'Material lot updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update material lot',
        variant: 'destructive',
      });
    }
  });
}

// Equipment hooks
export function useEquipment() {
  return useQuery({
    queryKey: ['/api/production/equipment'],
    retry: false
  });
}

export function useEquipmentById(id: number) {
  return useQuery({
    queryKey: ['/api/production/equipment', id],
    enabled: !!id,
    retry: false
  });
}

export function useCreateEquipment() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await apiRequest('POST', '/api/production/equipment', equipment);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/production/equipment'] });
      toast({
        title: 'Success',
        description: 'Equipment created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create equipment',
        variant: 'destructive',
      });
    }
  });
}

export function useUpdateEquipment() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number, [key: string]: any }) => {
      const res = await apiRequest('PUT', `/api/production/equipment/${id}`, data);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/production/equipment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production/equipment', variables.id] });
      toast({
        title: 'Success',
        description: 'Equipment updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update equipment',
        variant: 'destructive',
      });
    }
  });
}

// Additional hooks for quality checks, batch materials, equipment utilization etc.
// can be implemented as needed following the same pattern.