import { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, actions, className }: PageHeaderProps) {
  return (
    <div className={`gradient-header mb-8 rounded-lg p-6 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-2 text-primary-foreground/80">{description}</p>
          )}
        </div>
        {actions ? (
          <div className="flex items-center gap-4">{actions}</div>
        ) : children ? (
          <div className="flex items-center gap-4">{children}</div>
        ) : null}
      </div>
    </div>
  );
}

// Also export as default for backward compatibility
export default PageHeader;