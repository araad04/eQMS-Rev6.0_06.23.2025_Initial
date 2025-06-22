import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { navigateTo, isCurrentPath } from "@/lib/navigation";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  ShieldCheck,
  BookOpen,
  AlertTriangle,
  AlertCircle,
  Building,
  Users,
  Settings,
  ChevronDown,
  ChevronUp,
  Home,
  ClipboardCheck,
  PackageOpen,
  BarChart4,
  LineChart,
  MessageSquare,
  Wrench,
  CalendarCheck,
  Microscope,
  Activity,
  Gauge,
  BookCheck,
  CheckCircle2,
  Workflow,
  Server,
  Lock,
  Library,
  BarChart3,
  PuzzleIcon
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SubMenuItem {
  title: string;
  path: string;
  badge?: string;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  subItems?: SubMenuItem[];
  submenu?: boolean;
  badge?: string;
}

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const [location] = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Auto-open relevant sections based on current path
  useEffect(() => {
    const sections: Record<string, boolean> = {};

    if (location.includes('/supplier')) {
      sections["Supplier Management"] = true;
    }

    if (location.includes('/document-control')) {
      sections["Document Control"] = true;
    }

    if (location.includes('/capa-management')) {
      sections["CAPA Management"] = true;
    }

    if (location.includes('/production')) {
      sections["Production"] = true;
    }

    if (location.includes('/design-control')) {
      sections["Quality Management"] = true;
    }



    if (location.includes('/measurement-analysis')) {
      sections["Measurement & Analysis"] = true;
    }

    if (Object.keys(sections).length > 0) {
      setOpenMenus(prev => ({
        ...prev,
        ...sections
      }));
    }
  }, []);

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const isActive = (path: string) => isCurrentPath(path);

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      path: "/",
      icon: <LayoutDashboard className="h-5 w-5 mr-3 text-primary/70" />,
    },

    // Quality Management Section
    {
      title: "Document Control",
      path: "/document-control",
      icon: <FileText className="h-5 w-5 mr-3 text-primary/70" />,
      subItems: [
        { title: "All Documents", path: "/document-control" },
        { title: "Pending Approval", path: "/document-control/pending" },
        { title: "Create Document", path: "/document-control/create" },
      ],
    },
    {
      title: "CAPA Management",
      path: "/capa-management",
      icon: <ClipboardList className="h-5 w-5 mr-3 text-primary/70" />,
      subItems: [
        { title: "All CAPAs", path: "/capa-management" },
        { title: "Create CAPA", path: "/capa-management/create" },
      ],
    },
    {
      title: "Audit Management",
      path: "/audit-management",
      icon: <ShieldCheck className="h-5 w-5 mr-3 text-primary/70" />,
      subItems: [
        { title: "All Audits", path: "/audit-management" },
        { title: "Create New Audit", path: "/audit-create" },
        { title: "Internal Audits", path: "/audit-management?typeId=1" },
        { title: "Supplier Audits", path: "/audit-management?typeId=2" },
      ],
    },

    {
      title: "Training Records",
      path: "/training-records",
      icon: <BookCheck className="h-5 w-5 mr-3 text-primary/70" />,
    },
    {
      title: "Management Review",
      path: "/management-review",
      icon: <ClipboardCheck className="h-5 w-5 mr-3 text-primary/70" />,
    },
    {
      title: "Supplier Management",
      path: "/supplier-management",
      icon: <Users className="h-5 w-5 mr-3 text-primary/70" />,
      subItems: [
        { title: "All Suppliers", path: "/supplier-management" },
        { title: "Add Supplier", path: "/supplier-management/create" },
        { title: "Supplier Assessments", path: "/supplier-management/assessments" },
      ],
    },
    {
      title: "Measurement & Analysis",
      path: "/measurement-analysis/feedback",
      icon: <BarChart3 className="h-5 w-5 mr-3 text-primary/70" />,
      subItems: [
        { title: "Customer Feedback", path: "/measurement-analysis/feedback" },
        { title: "Complaints", path: "/measurement-analysis/complaints" },
        { title: "Calibration Assets", path: "/calibration-assets" },
      ],
    },
    {
      title: "Design Control",
      path: "/design-control",
      icon: <PuzzleIcon className="h-5 w-5 mr-3 text-primary/70" />,
      subItems: [
        { title: "All Projects", path: "/design-control" },
        { title: "Create New Project", path: "/design-control/create" },
        { title: "DP-2025-001 Cleanroom", path: "/design-control/project/16" },
        { title: "Project Templates", path: "/design-control/templates" },
        { title: "Global Traceability", path: "/design-control/dynamic-traceability" },
        { title: "Design History Files", path: "/design-control/history-file" },
      ],
    },
    {
      title: "Production & Development",
      path: "/production/batches",
      icon: <PackageOpen className="h-5 w-5 mr-3 text-primary/70" />,
      subItems: [
        { title: "Products", path: "/production/products" },
        { title: "Batch Records", path: "/production/batches" },
        { title: "Nonconforming Products", path: "/production/nonconforming-products" },
        { title: "Maintenance Assets", path: "/maintenance-assets" },
      ],
    },

    // System Management Section (only shown to admin users)
    {
      title: "User Management",
      path: "/user-management",
      icon: <Users className="h-5 w-5 mr-3 text-primary/70" />,
    },
    {
      title: "Storage Settings",
      path: "/storage-settings",
      icon: <Server className="h-5 w-5 mr-3 text-primary/70" />,
    },
    {
      title: "Settings",
      path: "/settings",
      icon: <Settings className="h-5 w-5 mr-3 text-primary/70" />,
    },
  ];

  // Extract items for each section  
  const quickAccess = [navItems[0]]; // Dashboard

  // Quality modules with Management Review and Measurement & Analysis included
  const qualityModules = [
    navItems[1], // Document Control
    navItems[2], // CAPA Management
    navItems[3], // Audit Management
    navItems[4], // Training Records
    navItems[5], // Management Review
    navItems[6], // Supplier Management
    navItems[7], // Measurement & Analysis
    navItems[8], // Design Control
    navItems[9], // Production & Development
    { 
      title: "Technical Documentation", 
      path: "/technical-documentation-interactive", 
      icon: <FileText className="h-5 w-5 mr-3 text-primary/70" />
    },
    { 
      title: "Organizational Chart", 
      path: "/organizational-chart", 
      icon: <Users className="h-5 w-5 mr-3 text-primary/70" /> 
    },
  ];

  // Supplier Management
  //const supplierModule = [navItems[7]]; 

  // System Management section - Admin only (login and subscription management)
  const systemModules = [
    { 
      title: "User Management", 
      path: "/user-management", 
      icon: <Users className="h-5 w-5 mr-3 text-primary/70" /> 
    },
    { 
      title: "Storage Settings", 
      path: "/storage-settings", 
      icon: <Server className="h-5 w-5 mr-3 text-primary/70" /> 
    },
    { 
      title: "System Settings",
      path: "/settings",
      icon: <Settings className="h-5 w-5 mr-3 text-primary/70" />,
      submenu: true,
      subItems: [
        {
          title: "Settings Overview",
          path: "/settings",
        },
        {
          title: "API Test",
          path: "/settings/api-test",
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={cn(
          "md:flex md:w-72 flex-col bg-sidebar border-r border-border/30 z-50 transition-all duration-300 relative",
          isOpen
            ? "fixed inset-y-0 left-0 w-3/4 h-full shadow-2xl"
            : "hidden"
        )}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-0 w-full h-[80%] bg-gradient-to-t from-primary/3 to-transparent"></div>
          <div className="absolute top-16 right-0 w-48 h-48 bg-primary/3 rounded-full filter blur-3xl opacity-30"></div>
          <div className="absolute bottom-48 left-0 w-24 h-64 bg-secondary/3 rounded-full filter blur-3xl opacity-30"></div>
        </div>

        {/* Sidebar content */}
        <div className="relative h-full flex flex-col">
          <ScrollArea className="flex-1 py-4">
            <div className="px-3 mb-6 mt-2">
              <div className="space-y-1">
                {/* Quick Access Section */}
                <div className="px-4 mb-3">
                  <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider flex items-center">
                    <span className="inline-block w-1 h-4 bg-gradient-to-b from-primary/60 to-primary/20 rounded-sm mr-2"></span>
                    Quick Access
                  </h3>
                </div>

                {quickAccess.map((item) => (
                  <SidebarItem 
                    key={item.title}
                    item={item}
                    isActive={isActive}
                    openMenus={openMenus}
                    toggleMenu={toggleMenu}
                    closeSidebar={closeSidebar}
                  />
                ))}

                {/* Quality Management Section */}
                <div className="px-4 mt-7 mb-3">
                  <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider flex items-center">
                    <span className="inline-block w-1 h-4 bg-gradient-to-b from-primary/60 to-primary/20 rounded-sm mr-2"></span>
                    Quality Management
                  </h3>
                </div>

                {qualityModules.map((item) => (
                  <SidebarItem 
                    key={item.title}
                    item={item}
                    isActive={isActive}
                    openMenus={openMenus}
                    toggleMenu={toggleMenu}
                    closeSidebar={closeSidebar}
                  />
                ))}



                {/* System Management Section */}
                <div className="px-4 mt-7 mb-3">
                  <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider flex items-center">
                    <span className="inline-block w-1 h-4 bg-gradient-to-b from-primary/60 to-primary/20 rounded-sm mr-2"></span>
                    System Management
                  </h3>
                </div>

                {systemModules.map((item) => (
                  <SidebarItem 
                    key={item.title}
                    item={item}
                    isActive={isActive}
                    openMenus={openMenus}
                    toggleMenu={toggleMenu}
                    closeSidebar={closeSidebar}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>

          <div className="border-t border-border/30 p-4 bg-sidebar-accent/5 backdrop-blur-sm">
            <div className="flex flex-col space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-sidebar-foreground/70">System Status</span>
                <div className="flex items-center text-xs font-medium text-success">
                  <span className="h-2 w-2 rounded-full bg-success/80 animate-pulse shadow-sm shadow-success/20 mr-1.5"></span>
                  Operational
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-sidebar-foreground/70">ISO 13485:2016</span>
                <span className="text-xs text-success flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Compliant
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-sidebar-foreground/70">21 CFR Part 11</span>
                <span className="text-xs text-success flex items-center">
                  <Lock className="h-3 w-3 mr-1" /> Compliant
                </span>
              </div>
              <div className="mt-1.5 py-1.5 px-2 rounded-md bg-sidebar-accent/10 border border-sidebar-border/40 text-xs text-sidebar-foreground/70 flex justify-between items-center">
                <Server className="h-3 w-3 mr-1.5 text-sidebar-primary/70" />
                <span>draft • {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function SidebarItem({ 
  item, 
  isActive, 
  openMenus, 
  toggleMenu, 
  closeSidebar 
}: { 
  item: NavItem, 
  isActive: (path: string) => boolean, 
  openMenus: Record<string, boolean>, 
  toggleMenu: (menu: string) => void, 
  closeSidebar: () => void 
}) {
  const active = isActive(item.path) || item.subItems?.some(sub => isActive(sub.path));

  return (
    <div className="space-y-1 px-2">
      {item.subItems ? (
        <>
          <button
            className={cn(
              "sidebar-item w-full justify-between group",
              active && "sidebar-item-active text-primary bg-primary/10"
            )}
            onClick={() => toggleMenu(item.title)}
          >
            <span className="flex items-center">
              {item.icon}
              <span>{item.title}</span>
            </span>

            <div className="flex items-center space-x-2">
              {item.badge && (
                <Badge variant="outline" className="text-xs h-5 bg-accent/10 hover:bg-accent/20 text-accent border-accent/20">
                  {item.badge}
                </Badge>
              )}
              {openMenus[item.title] ? (
                <ChevronUp className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              )}
            </div>
          </button>

          {openMenus[item.title] && (
            <div className="pl-9 space-y-1 mt-1 animate-in fade-in-50 duration-200">
              {item.subItems?.map((subItem) => (
                <a
                  key={subItem.title}
                  href={subItem.path}
                  onClick={(e) => {
                    e.preventDefault();
                    closeSidebar();
                    navigateTo(subItem.path);
                  }}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      "flex justify-between items-center rounded-md py-1.5 px-2 text-sm transition-colors",
                      isActive(subItem.path)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="flex items-center">{subItem.title}</span>
                    {subItem.badge && (
                      <Badge variant={isActive(subItem.path) ? "default" : "outline"} 
                        className={cn(
                          "text-xs h-5",
                          isActive(subItem.path) 
                            ? "bg-primary/90 hover:bg-primary/80" 
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        )}
                      >
                        {subItem.badge}
                      </Badge>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      ) : (
        <a
          href={item.path}
          onClick={(e) => {
            e.preventDefault();
            closeSidebar();
            navigateTo(item.path);
          }}
          className="cursor-pointer"
        >
          <div
            className={cn(
              "sidebar-item group justify-between",
              isActive(item.path) && "sidebar-item-active text-primary bg-primary/10"
            )}
          >
            <span className="flex items-center">
              {item.icon}
              <span>{item.title}</span>
            </span>

            {item.badge && (
              <Badge variant={isActive(item.path) ? "default" : "outline"} 
                className={cn(
                  "text-xs h-5",
                  isActive(item.path) 
                    ? "bg-primary/90 hover:bg-primary/80" 
                    : "bg-accent/10 hover:bg-accent/20 text-accent border-accent/20"
                )}
              >
                {item.badge}
              </Badge>
            )}
          </div>
        </a>
      )}
    </div>
  );
}