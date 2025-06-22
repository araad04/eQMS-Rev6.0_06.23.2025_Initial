import React from 'react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Alert 
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-md border-dashed h-60", 
        className
      )}
    >
      {icon && (
        <div className="text-muted-foreground mb-4">
          {icon}
        </div>
      )}
      <AlertTitle className="text-lg font-semibold mb-2">{title}</AlertTitle>
      <AlertDescription className="text-muted-foreground max-w-md">
        {description}
      </AlertDescription>
      {action && (
        <Button 
          onClick={action.onClick} 
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </Alert>
  );
}