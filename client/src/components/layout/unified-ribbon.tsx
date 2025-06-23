/**
 * Unified Ribbon Navigation Component
 * Enterprise-level standardized navigation for all eQMS modules
 * Provides consistent UX across Document Control, CAPA, Audit, Design Control, etc.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Plus, Search, Filter, Download, Upload, Settings, 
  RefreshCw, Save, Edit, Trash2, Share, Archive, CheckCircle,
  AlertTriangle, Clock, Users, Target, BarChart3, Shield,
  Workflow, GitBranch, Calendar, Bell, Bookmark, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface RibbonAction {
  id: string;
  label: string;
  icon: React.ElementType;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
  badge?: string | number;
  onClick?: () => void;
  className?: string;
}

export interface RibbonSection {
  id: string;
  title: string;
  actions: RibbonAction[];
}

export interface RibbonTab {
  id: string;
  label: string;
  sections: RibbonSection[];
}

interface UnifiedRibbonProps {
  moduleName: string;
  tabs: RibbonTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * Standard ribbon configurations for each module
 */
export const STANDARD_RIBBONS = {
  documentControl: {
    tabs: [
      {
        id: "home",
        label: "Home",
        sections: [
          {
            id: "file",
            title: "File",
            actions: [
              { id: "new", label: "New Document", icon: Plus },
              { id: "upload", label: "Upload", icon: Upload },
              { id: "save", label: "Save", icon: Save }
            ]
          },
          {
            id: "actions",
            title: "Actions",
            actions: [
              { id: "edit", label: "Edit", icon: Edit },
              { id: "approve", label: "Approve", icon: CheckCircle },
              { id: "archive", label: "Archive", icon: Archive }
            ]
          },
          {
            id: "view",
            title: "View",
            actions: [
              { id: "search", label: "Search", icon: Search },
              { id: "filter", label: "Filter", icon: Filter },
              { id: "refresh", label: "Refresh", icon: RefreshCw }
            ]
          }
        ]
      },
      {
        id: "review",
        label: "Review",
        sections: [
          {
            id: "workflow",
            title: "Workflow",
            actions: [
              { id: "submit", label: "Submit for Review", icon: Workflow },
              { id: "approve", label: "Approve", icon: CheckCircle },
              { id: "reject", label: "Reject", icon: AlertTriangle, variant: "destructive" as const }
            ]
          },
          {
            id: "collaboration",
            title: "Collaboration",
            actions: [
              { id: "share", label: "Share", icon: Share },
              { id: "comments", label: "Comments", icon: Users },
              { id: "notify", label: "Notify", icon: Bell }
            ]
          }
        ]
      }
    ]
  },
  capaManagement: {
    tabs: [
      {
        id: "home",
        label: "Home",
        sections: [
          {
            id: "capa",
            title: "CAPA",
            actions: [
              { id: "new", label: "New CAPA", icon: Plus },
              { id: "fromAudit", label: "From Audit", icon: GitBranch },
              { id: "fromComplaint", label: "From Complaint", icon: AlertTriangle }
            ]
          },
          {
            id: "analysis",
            title: "Analysis",
            actions: [
              { id: "rootCause", label: "Root Cause", icon: Target },
              { id: "riskAnalysis", label: "Risk Analysis", icon: Shield },
              { id: "effectiveness", label: "Effectiveness", icon: BarChart3 }
            ]
          },
          {
            id: "actions",
            title: "Actions",
            actions: [
              { id: "assign", label: "Assign", icon: Users },
              { id: "schedule", label: "Schedule", icon: Calendar },
              { id: "close", label: "Close CAPA", icon: CheckCircle }
            ]
          }
        ]
      },
      {
        id: "tracking",
        label: "Tracking",
        sections: [
          {
            id: "status",
            title: "Status",
            actions: [
              { id: "open", label: "Open", icon: Clock, badge: "5" },
              { id: "inProgress", label: "In Progress", icon: Workflow, badge: "12" },
              { id: "overdue", label: "Overdue", icon: AlertTriangle, variant: "destructive" as const, badge: "2" }
            ]
          },
          {
            id: "reports",
            title: "Reports",
            actions: [
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "metrics", label: "Metrics", icon: Target },
              { id: "export", label: "Export", icon: Download }
            ]
          }
        ]
      }
    ]
  },
  auditManagement: {
    tabs: [
      {
        id: "home",
        label: "Home",
        sections: [
          {
            id: "audit",
            title: "Audit",
            actions: [
              { id: "new", label: "New Audit", icon: Plus },
              { id: "schedule", label: "Schedule", icon: Calendar },
              { id: "checklist", label: "Checklist", icon: FileText }
            ]
          },
          {
            id: "findings",
            title: "Findings",
            actions: [
              { id: "addFinding", label: "Add Finding", icon: AlertTriangle },
              { id: "createCapa", label: "Create CAPA", icon: GitBranch },
              { id: "linkCapa", label: "Link CAPA", icon: Target }
            ]
          },
          {
            id: "team",
            title: "Team",
            actions: [
              { id: "assignAuditor", label: "Assign Auditor", icon: Users },
              { id: "auditTeam", label: "Audit Team", icon: Shield },
              { id: "notifications", label: "Notifications", icon: Bell }
            ]
          }
        ]
      },
      {
        id: "execution",
        label: "Execution",
        sections: [
          {
            id: "workflow",
            title: "Workflow",
            actions: [
              { id: "planning", label: "Planning", icon: Target },
              { id: "fieldwork", label: "Fieldwork", icon: Search },
              { id: "reporting", label: "Reporting", icon: FileText }
            ]
          },
          {
            id: "evidence",
            title: "Evidence",
            actions: [
              { id: "collect", label: "Collect Evidence", icon: Upload },
              { id: "document", label: "Document", icon: Edit },
              { id: "review", label: "Review", icon: CheckCircle }
            ]
          }
        ]
      }
    ]
  },
  designControl: {
    tabs: [
      {
        id: "home",
        label: "Home",
        sections: [
          {
            id: "project",
            title: "Project",
            actions: [
              { id: "new", label: "New Project", icon: Plus },
              { id: "templates", label: "Templates", icon: FileText },
              { id: "dhf", label: "Design History File", icon: Archive }
            ]
          },
          {
            id: "phases",
            title: "Phases",
            actions: [
              { id: "planning", label: "Planning & URS", icon: Target },
              { id: "inputs", label: "Design Inputs", icon: GitBranch },
              { id: "outputs", label: "Design Outputs", icon: Workflow }
            ]
          },
          {
            id: "control",
            title: "Control",
            actions: [
              { id: "verification", label: "Verification", icon: CheckCircle },
              { id: "validation", label: "Validation", icon: Shield },
              { id: "transfer", label: "Transfer", icon: Share }
            ]
          }
        ]
      },
      {
        id: "traceability",
        label: "Traceability",
        sections: [
          {
            id: "matrix",
            title: "Matrix",
            actions: [
              { id: "viewMatrix", label: "View Matrix", icon: BarChart3 },
              { id: "coverage", label: "Coverage", icon: Target },
              { id: "gaps", label: "Gap Analysis", icon: AlertTriangle }
            ]
          },
          {
            id: "links",
            title: "Links",
            actions: [
              { id: "requirements", label: "Requirements", icon: FileText },
              { id: "design", label: "Design Elements", icon: Edit },
              { id: "verification", label: "V&V Records", icon: CheckCircle }
            ]
          }
        ]
      }
    ]
  }
};

export function UnifiedRibbon({ moduleName, tabs, activeTab, onTabChange, className }: UnifiedRibbonProps) {
  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={cn("border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      {/* Module Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">{moduleName}</h2>
          <Badge variant="outline" className="text-xs">
            ISO 13485
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 py-2">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="grid w-full max-w-md" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Ribbon Actions */}
      {currentTab && (
        <div className="px-6 py-3">
          <div className="flex items-start gap-8">
            {currentTab.sections.map((section, index) => (
              <div key={section.id} className="flex items-start gap-4">
                {index > 0 && <Separator orientation="vertical" className="h-12" />}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {section.title}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {section.actions.map(action => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={action.id}
                          variant={action.variant || "outline"}
                          size={action.size || "sm"}
                          disabled={action.disabled}
                          onClick={action.onClick}
                          className={cn(
                            "flex items-center gap-2 relative",
                            action.className
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{action.label}</span>
                          {action.badge && (
                            <Badge 
                              variant="secondary" 
                              className="ml-1 h-4 px-1 text-xs absolute -top-1 -right-1"
                            >
                              {action.badge}
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to manage ribbon state
 */
export function useRibbon(moduleType: keyof typeof STANDARD_RIBBONS) {
  const [activeTab, setActiveTab] = useState(STANDARD_RIBBONS[moduleType].tabs[0].id);
  
  return {
    tabs: STANDARD_RIBBONS[moduleType].tabs,
    activeTab,
    setActiveTab
  };
}

export default UnifiedRibbon;