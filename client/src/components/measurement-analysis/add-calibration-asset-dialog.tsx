import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Define validation schema for the form
const calibrationAssetSchema = z.object({
  assetNumber: z.string().min(1, "Asset number is required"),
  assetName: z.string().min(1, "Asset name is required"),
  model: z.string().min(1, "Model number is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  location: z.string().min(1, "Location is required"),
  department: z.string().min(1, "Department is required"),
  calibrationDate: z.date({ required_error: "Calibration date is required" }),
  nextCalibrationDate: z.date({ required_error: "Next calibration date is required" }),
  calibrationProcedure: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  accuracy: z.string().min(1, "Accuracy is required"),
  range: z.string().optional(),
  assignedTo: z.string().min(1, "Assigned person is required"),
  notes: z.string().optional(),
});

type CalibrationAssetFormValues = z.infer<typeof calibrationAssetSchema>;

interface AddCalibrationAssetDialogProps {
  children?: React.ReactNode;
}

export function AddCalibrationAssetDialog({ children }: AddCalibrationAssetDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CalibrationAssetFormValues>({
    resolver: zodResolver(calibrationAssetSchema),
    defaultValues: {
      assetNumber: "",
      assetName: "",
      model: "",
      serialNumber: "",
      location: "",
      department: "",
      calibrationProcedure: "",
      status: "Calibrated",
      accuracy: "",
      range: "",
      assignedTo: "",
      notes: "",
      calibrationDate: undefined,
      nextCalibrationDate: undefined,
    },
  });

  const createCalibrationAssetMutation = useMutation({
    mutationFn: async (data: CalibrationAssetFormValues) => {
      // Make sure dates are properly formatted
      const formattedData = {
        ...data,
        calibrationDate: data.calibrationDate ? new Date(data.calibrationDate).toISOString() : null,
        nextCalibrationDate: data.nextCalibrationDate ? new Date(data.nextCalibrationDate).toISOString() : null,
      };
      
      // Log the data being sent to the API for debugging
      console.log("Creating calibration asset with data:", formattedData);
      
      const response = await apiRequest("POST", "/api/calibration/assets", formattedData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create calibration asset");
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Successfully created calibration asset:", data);
      toast({
        title: "Success",
        description: "Calibration asset has been created successfully",
      });
      // Invalidate both potentially used query keys for calibration assets
      queryClient.invalidateQueries({ queryKey: ["/api/calibration/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calibration-assets"] });
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      console.error("Error creating calibration asset:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create calibration asset",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: CalibrationAssetFormValues) {
    createCalibrationAssetMutation.mutate(data);
  }

  // Handle dialog being opened
  React.useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      form.reset({
        assetNumber: "",
        assetName: "",
        model: "",
        serialNumber: "",
        location: "",
        department: "",
        calibrationProcedure: "",
        status: "Calibrated",
        accuracy: "",
        range: "",
        assignedTo: "",
        notes: "",
        calibrationDate: undefined,
        nextCalibrationDate: undefined,
      });
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Calibration Asset</DialogTitle>
          <DialogDescription>
            Enter details for the new measurement device requiring calibration.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="assetNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Asset Number</FormLabel>
                    <FormControl>
                      <Input placeholder="CA-2025-001" {...field} className="h-8" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assetName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Asset Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Digital Caliper" {...field} className="h-8" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Model Number" {...field} className="h-8" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="SN12345" {...field} className="h-8" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Quality Lab" {...field} className="h-8" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Quality Control" {...field} className="h-8" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="calibrationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Last Calibration Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal h-8 text-sm",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PP")
                            ) : (
                              <span>Select date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextCalibrationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Next Calibration Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal h-8 text-sm",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PP")
                            ) : (
                              <span>Select date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Calibrated">Calibrated</SelectItem>
                        <SelectItem value="In Calibration">In Calibration</SelectItem>
                        <SelectItem value="Out of Calibration">Out of Calibration</SelectItem>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accuracy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Accuracy</FormLabel>
                    <FormControl>
                      <Input placeholder="±0.01 mm" {...field} className="h-8" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Assigned To</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} className="h-8" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="calibrationProcedure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Procedure</FormLabel>
                    <FormControl>
                      <Input placeholder="CP-001" {...field} className="h-8" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional information"
                      className="resize-none h-16" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={createCalibrationAssetMutation.isPending}
              >
                {createCalibrationAssetMutation.isPending ? "Creating..." : "Create Asset"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}