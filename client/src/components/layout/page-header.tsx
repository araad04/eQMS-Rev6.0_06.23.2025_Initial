import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  }[];
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="gradient-header mb-6 rounded-lg shadow-sm">
      <div className="py-5 px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-primary-foreground/80">{description}</p>}
          </div>
          {actions && actions.length > 0 && (
            <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
              {actions.map((action, index) => (
                action.href ? (
                  <Link key={index} href={action.href}>
                    <Button 
                      variant={action.variant || "secondary"} 
                      className="flex items-center bg-white/20 hover:bg-white/30 text-white border-transparent"
                    >
                      {action.icon && <span className="-ml-1 mr-2">{action.icon}</span>}
                      {action.label}
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    key={index} 
                    variant={action.variant || "secondary"} 
                    className="flex items-center bg-white/20 hover:bg-white/30 text-white border-transparent"
                    onClick={action.onClick}
                  >
                    {action.icon && <span className="-ml-1 mr-2">{action.icon}</span>}
                    {action.label}
                  </Button>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
