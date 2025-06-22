import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertCircle,
  Check,
  CheckCircle,
  CheckCircle2,
  ClipboardList,
  Edit,
  Eye,
  FileCheck,
  FilePlus,
  FileText,
  Loader2,
  PlusCircle,
  Share2,
  ShieldCheck
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Actions list dummy for quick implementation
export function ActionsListDummy({ capaId }: { capaId: number }) {
  const [openAddDialog, setOpenAddDialog] = useState(false);

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Implementation Actions</h3>
        <Button 
          onClick={() => setOpenAddDialog(true)}
          className="flex items-center"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Action
        </Button>
      </div>

      <div className="space-y-4">
        {/* Action 1 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Update calibration procedure</CardTitle>
                <CardDescription>Due: {format(new Date(2025, 5, 20), 'PPP')}</CardDescription>
              </div>
              <Badge className="ml-2" variant="outline">In Progress</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-gray-700">
              Review and update the calibration procedure to include verification steps for measurement accuracy within ±0.5%.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between pt-0">
            <div className="text-sm text-muted-foreground">
              Assigned to: John Smith
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="h-8">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Evidence
              </Button>
              <Button variant="outline" size="sm" className="h-8">
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Communicate
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Action 2 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Train lab technicians</CardTitle>
                <CardDescription>Due: {format(new Date(2025, 6, 15), 'PPP')}</CardDescription>
              </div>
              <Badge className="ml-2" variant="success">Completed</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-gray-700">
              Conduct training sessions for all laboratory technicians on the updated calibration procedure and documentation requirements.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between pt-0">
            <div className="text-sm text-muted-foreground">
              Assigned to: Sarah Johnson
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="h-8">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Evidence
              </Button>
              <Button variant="secondary" size="sm" className="h-8">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Verified
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Action 3 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Implement verification records</CardTitle>
                <CardDescription>Due: {format(new Date(2025, 6, 30), 'PPP')}</CardDescription>
              </div>
              <Badge className="ml-2" variant="secondary">Planning</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-gray-700">
              Create and implement verification records for each calibration activity with sign-off requirements.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between pt-0">
            <div className="text-sm text-muted-foreground">
              Assigned to: Robert Chen
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="h-8">
                <FileCheck className="h-3.5 w-3.5 mr-1.5" />
                Add Evidence
              </Button>
              <Button variant="outline" size="sm" className="h-8">
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Communicate
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Add Action Dialog (placeholder) */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Implementation Action</DialogTitle>
            <DialogDescription>
              Create a new action item for implementation of CAPA #{capaId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 text-center text-muted-foreground">
            <ClipboardList className="mx-auto h-12 w-12 mb-2 text-muted-foreground/50" />
            <p>Action form coming soon.</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAddDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled>
              Save Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// The real implementation will be developed later
export function ActionsList({ capaId }: { capaId: number }) {
  return <ActionsListDummy capaId={capaId} />;
}