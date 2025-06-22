import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BadgeColored } from "@/components/ui/badge-colored";
import { useQuery } from "@tanstack/react-query";

interface PendingApproval {
  id: number;
  title: string;
  type: string;
  submittedBy: string;
  submittedDate: string;
}

export function PendingApprovals() {
  // Fetch pending documents requiring approval
  const { data: pendingApprovals, isLoading } = useQuery<PendingApproval[]>({
    queryKey: ["/api/documents/pending"],
  });

  const getTypeVariant = (type: string) => {
    const typeMap: Record<string, any> = {
      "SOP": "primary",
      "WI": "secondary",
      "CAPA": "accent"
    };
    return typeMap[type] || "default";
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return "Today";
    } else if (diffInHours < 48) {
      return "1 day ago";
    } else if (diffInHours < 72) {
      return "2 days ago";
    } else {
      return "3 days ago";
    }
  };

  return (
    <div className="lg:col-span-2 bg-white overflow-hidden shadow rounded-lg">
      <div className="px-5 py-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-neutral-900">Pending Approvals</h3>
          <Link href="/document-control/pending" className="text-sm font-medium text-primary hover:text-primary-dark">
            View all
          </Link>
        </div>
      </div>
      
      {isLoading ? (
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border border-neutral-200 rounded-md">
                <div className="h-4 bg-neutral-100 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-neutral-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {pendingApprovals?.map((approval) => (
            <li key={approval.id} className="p-5 hover:bg-neutral-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BadgeColored variant={getTypeVariant(approval.type)} className="h-8 w-8 flex items-center justify-center">
                      <span className="text-sm font-medium leading-none">{approval.type}</span>
                    </BadgeColored>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-neutral-900">{approval.title}</div>
                    <div className="text-sm text-neutral-500">
                      Submitted by: {approval.submittedBy} • {getTimeAgo(approval.submittedDate)}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Approve
                  </Button>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
