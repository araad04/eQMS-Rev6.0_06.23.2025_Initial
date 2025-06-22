import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form schema for electronic signature validation
const signatureSchema = z.object({
  password: z.string().min(1, "Password is required"),
  signatureReason: z.string().min(1, "Signature reason is required"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms to continue",
  }),
});

type SignatureFormValues = z.infer<typeof signatureSchema>;

interface ElectronicSignatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureComplete: (signatureData: any) => void;
  documentId: number;
  documentType: string;
  actionType: "approve" | "review" | "reject";
  signatureEndpoint: string;
}

export function ElectronicSignatureDialog({
  isOpen,
  onClose,
  onSignatureComplete,
  documentId,
  documentType,
  actionType,
  signatureEndpoint,
}: ElectronicSignatureDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<SignatureFormValues>({
    resolver: zodResolver(signatureSchema),
    defaultValues: {
      password: "",
      signatureReason: actionType,
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: SignatureFormValues) => {
    setIsSubmitting(true);
    try {
      // Add document information to the request
      const requestData = {
        ...data,
        documentId,
        documentType,
        actionType,
        status: actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'reviewed',
        comments: `Electronic signature: ${data.signatureReason}`
      };

      const response = await apiRequest("POST", signatureEndpoint, requestData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Signature verification failed");
      }
      
      const result = await response.json();
      
      toast({
        title: "Signature Verified",
        description: `Your electronic signature has been recorded for this ${documentType}.`,
      });
      
      onSignatureComplete(result);
      onClose();
    } catch (error: any) {
      console.error("Signature verification error:", error);
      toast({
        title: "Signature Failed",
        description: error.message || "An error occurred during signature verification",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            Electronic Signature Verification
          </DialogTitle>
          <DialogDescription>
            21 CFR Part 11 compliant electronic signature for {documentType}{" "}
            {actionType}.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-sm mb-4">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Important Information</p>
              <p className="text-amber-700">
                This electronic signature is legally binding and equivalent to your handwritten signature.
                Your actions are being recorded in a secure audit trail.
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Confirmation</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Confirm your identity with your system password
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="signatureReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signature Reason</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select signature reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="approve">Approval</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="reject">Rejection</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the intent of your electronic signature
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Legal Acknowledgment</FormLabel>
                    <FormDescription>
                      I understand that this electronic signature is legally binding and
                      equivalent to my handwritten signature per 21 CFR Part 11.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Verify & Sign
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}