import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getTimeAgo } from "@/lib/utils";
import { CheckIcon, Edit, AlertTriangle, Clipboard, FileText } from "lucide-react";

interface Activity {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  userId: number;
  userName: string;
  timestamp: string;
  category: string; // Added to identify activity category
}

export function ActivityFeed() {
  // This would be replaced with actual API data when available
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activity-logs"],
    queryFn: async () => {
      // Remove mock data and return an empty array
      return [];
    }
  });
  
  // Filter activities to only show Quality Management and Production & Development
  // This removes User Management and System Settings activities
  const filteredActivities = activities?.filter(activity => {
    const qualityCategories = [
      'document',
      'capa',
      'audit',
      'training',
      'customer-feedback',
      'complaint',
      'calibration'
    ];
    
    const productionCategories = [
      'batch',
      'nonconforming-product',
      'design-project',
      'design-change'
    ];
    
    // Combine allowed categories
    const allowedCategories = [...qualityCategories, ...productionCategories];
    
    // Check if entityType is in the allowed categories list
    return allowedCategories.some(category => 
      activity.entityType.toLowerCase().includes(category) ||
      (activity.category && activity.category.toLowerCase().includes(category))
    );
  });

  const getActivityIcon = (activity: Activity) => {
    const iconMap: Record<string, React.ReactNode> = {
      "Approved": <CheckIcon className="h-5 w-5 text-white" />,
      "Created": <Edit className="h-5 w-5 text-white" />,
      "Flagged": <AlertTriangle className="h-5 w-5 text-white" />,
      "Scheduled": <Clipboard className="h-5 w-5 text-white" />,
      "Updated": <FileText className="h-5 w-5 text-white" />
    };
    return iconMap[activity.action] || <FileText className="h-5 w-5 text-white" />;
  };

  const getIconBgColor = (activity: Activity) => {
    const colorMap: Record<string, string> = {
      "Approved": "bg-green-600",
      "Created": "bg-primary",
      "Flagged": "bg-yellow-500",
      "Scheduled": "bg-purple-600",
      "Updated": "bg-blue-600"
    };
    return colorMap[activity.action] || "bg-neutral-600";
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-5 py-4 border-b border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900">Recent Activity</h3>
      </div>
      <div className="px-5 py-4">
        {isLoading ? (
          <div className="animate-pulse space-y-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="h-8 w-8 rounded-full bg-neutral-200"></div>
                <div className="flex-1">
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flow-root">
            {filteredActivities && filteredActivities.length > 0 ? (
              <ul className="-mb-8">
                {filteredActivities.map((activity, idx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {idx < filteredActivities.length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-neutral-200"
                          aria-hidden="true"
                        ></span>
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full ${getIconBgColor(activity)} flex items-center justify-center ring-8 ring-white`}>
                            {getActivityIcon(activity)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-sm text-neutral-500">
                              <Link href={`/users/${activity.userId}`} className="font-medium text-neutral-900">
                                {activity.userName}
                              </Link>{" "}
                              {activity.action.toLowerCase()}{" "}
                              <Link
                                href={`/${activity.entityType}/${activity.entityId}`}
                                className="font-medium text-primary"
                              >
                                {activity.details.split(' ')[0]}
                              </Link>
                            </div>
                            <p className="mt-0.5 text-sm text-neutral-500">
                              {getTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <p>No activities recorded yet</p>
                <p className="text-sm">Activities will appear here as you use the system</p>
              </div>
            )}
          </div>
        )}
        <div className="mt-6">
          <Button variant="outline" className="w-full">
            View all activity
          </Button>
        </div>
      </div>
    </div>
  );
}