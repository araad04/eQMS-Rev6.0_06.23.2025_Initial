import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useLocation } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const [pageTransition, setPageTransition] = useState(false);

  // Handle page transitions with subtle animation effect
  useEffect(() => {
    setPageTransition(true);
    const timer = setTimeout(() => {
      setPageTransition(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [location]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Get page title based on current location
  const getPageTitle = () => {
    if (location === '/') return 'Dashboard';
    const parts = location.split('/').filter(Boolean);
    if (parts.length) {
      // Convert kebab-case to Title Case (e.g., "document-control" to "Document Control")
      return parts[0]
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    return '';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        
        <main className="flex-1 overflow-auto bg-background">
          <div 
            className={`transition-all duration-300 min-h-screen ${
              pageTransition 
                ? 'opacity-90 translate-y-2 blur-[1px]' 
                : 'opacity-100 translate-y-0 blur-0'
            }`}
          >
            {/* Optional futuristic decorative elements */}
            <div className="fixed top-20 right-5 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl -z-10 animate-pulse-slow"></div>
            <div className="fixed bottom-20 left-5 w-96 h-96 bg-secondary/5 rounded-full filter blur-3xl -z-10 animate-blob"></div>
            
            {/* Main content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
