import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Search, Bell, ChevronDown, Settings, Activity, Shield, LogOut, User, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const [time, setTime] = useState(new Date());

  // Add scroll listener for glass effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    // Force a refresh after logout to ensure proper state reset
    setTimeout(() => {
      console.log("Performing hard reload after logout");
      window.location.href = '/auth';
    }, 500);
  };

  // Get current section for header highlighting
  const getCurrentSection = () => {
    if (location.startsWith('/document-control')) return 'Documents';
    if (location.startsWith('/capa-management')) return 'CAPA';
    if (location.startsWith('/audit-management')) return 'Audits';
    if (location.startsWith('/training-records')) return 'Training';
    if (location.startsWith('/design-control')) return 'Design Control';
    if (location.startsWith('/production')) return 'Production';
    if (location.startsWith('/supplier-management')) return 'Suppliers';
    if (location.startsWith('/system-analytics')) return 'Analytics';
    return 'Dashboard';
  };

  // Format time for header display
  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-background/70 backdrop-blur-xl border-b border-border/30 shadow-sm' 
          : 'bg-background border-b border-border/50'
      }`}
    >
      {/* Decorative header elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[350px] -right-[250px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -top-[200px] -left-[250px] w-[300px] h-[300px] bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground/80 hover:bg-primary/5 hover:text-primary"
            onClick={toggleSidebar}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/" className="flex items-center ml-1 md:ml-0 group">
              <div className="relative h-9 w-9 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary animate-gradient-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-lg">
                  eQ
                </div>
                <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/50 to-secondary/50 rounded-xl blur-[2px] opacity-50 group-hover:opacity-70 transition-opacity"></div>
              </div>
              <div className="ml-2.5 flex flex-col">
                <h1 className="text-foreground font-bold text-xl tracking-tight flex items-center">
                  eQMS
                  <Zap className="ml-1 h-4 w-4 text-primary" />
                </h1>
                <span className="text-xs text-muted-foreground -mt-1">Medical Device Edition</span>
              </div>
          </Link>

          <div className="hidden lg:flex items-center ml-8 space-x-0.5">
            <Link href="/" className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${getCurrentSection() === 'Dashboard' ? 'text-primary bg-primary/10 shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>Dashboard</Link>
            <Link href="/document-control" className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${getCurrentSection() === 'Documents' ? 'text-primary bg-primary/10 shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>Documents</Link>
            <Link href="/design-control" className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${getCurrentSection() === 'Design Control' ? 'text-primary bg-primary/10 shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>Design</Link>
            <Link href="/production/products" className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${getCurrentSection() === 'Production' ? 'text-primary bg-primary/10 shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>Production</Link>
          </div>
        </div>

        <div className="hidden md:flex items-center mr-4">
          <div className="text-right border-r border-border/50 pr-4 mr-3">
            <div className="text-xs text-muted-foreground">{formattedDate}</div>
            <div className="text-sm font-medium">{formattedTime}</div>
          </div>
        </div>

        <div className="flex items-center">
          <form onSubmit={handleSearch} className="relative mx-2 hidden md:block">
            <Input
              type="text"
              placeholder="Search..."
              className="w-64 py-1.5 pl-9 pr-3 bg-muted/30 border-border/40 focus:border-primary/50 focus:bg-muted/10 transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
          </form>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-muted-foreground hover:text-primary hover:bg-primary/5"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Link href="/system-analytics">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/5"
                    aria-label="Analytics"
                  >
                    <Activity className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Analytics</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Link>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/5 relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-destructive rounded-full animate-pulse-slow shadow-sm ring-2 ring-background"></span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-2 relative flex items-center space-x-1 hover:bg-primary/5">
                <div className="relative h-8 w-8 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/30"></div>
                  <div className="absolute inset-0 flex items-center justify-center font-semibold text-primary">
                    {user?.firstName?.[0] || ''}
                    {user?.lastName?.[0] || ''}
                  </div>
                  <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-primary/20"></div>
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-1 p-1" sideOffset={8}>
              <div className="px-3 py-2 border-b border-border/50 mb-1 bg-gradient-to-br from-muted/50 to-transparent rounded-t-sm">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/10">
                    {user?.role}
                  </span>
                </div>
              </div>
              <DropdownMenuItem className="flex items-center gap-2 rounded-md cursor-pointer hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 rounded-md cursor-pointer hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 rounded-md cursor-pointer hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary">
                <Shield className="h-4 w-4" />
                <span>Privacy</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 rounded-md cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}