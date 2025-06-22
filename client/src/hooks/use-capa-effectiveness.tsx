
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";

const effectivenessSchema = z.object({
  criteria: z.array(z.object({
    id: z.number(),
    description: z.string().min(1, "Description is required"),
    target: z.number().min(0, "Target must be positive"),
    actual: z.number().optional(),
    status: z.enum(["pending", "met", "not_met"]),
    evidence: z.string().optional(),
    verificationDate: z.date().optional(),
    verifiedBy: z.number().optional()
  })).min(1, "At least one effectiveness criterion is required"),
  verificationMethod: z.enum(["audit", "inspection", "measurement", "monitoring"]),
  reviewerComments: z.string().optional(),
  effectivenessScore: z.number().min(0).max(100),
  verificationStatus: z.enum(["not_started", "in_progress", "completed"]).default("not_started"),
  completedDate: z.date().optional(),
  nextReviewDate: z.date().optional()
});

export function useCapaEffectiveness(capaId: number) {
  const { data: effectiveness } = useQuery({
    queryKey: ["capa-effectiveness", capaId],
    queryFn: async () => {
      const res = await fetch(`/api/capas/${capaId}/effectiveness`);
      if (!res.ok) throw new Error("Failed to fetch effectiveness data");
      return effectivenessSchema.parse(await res.json());
    }
  });

  const verifyEffectivenessMutation = useMutation({
    mutationFn: async (data: z.infer<typeof effectivenessSchema>) => {
      const res = await fetch(`/api/capas/${capaId}/verify-effectiveness`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to verify effectiveness");
      return res.json();
    }
  });

  return {
    effectiveness,
    verifyEffectiveness: verifyEffectivenessMutation.mutate,
    isVerifying: verifyEffectivenessMutation.isPending
  };
}
