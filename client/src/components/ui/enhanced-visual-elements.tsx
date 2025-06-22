
import React from 'react';
import { cn } from '@/lib/utils';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'premium' | 'glass';
  hover?: boolean;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  className,
  variant = 'default',
  hover = true
}) => {
  const baseClasses = "rounded-xl border transition-all duration-300 relative overflow-hidden";
  
  const variants = {
    default: "bg-card border-border/40 shadow-lg hover:shadow-xl hover:border-primary/20",
    accent: "bg-gradient-to-br from-card via-card/98 to-accent/5 border-accent/30 shadow-lg hover:shadow-2xl hover:border-accent/50",
    premium: "bg-gradient-to-br from-white via-white/98 to-muted/20 border-border/20 shadow-lg hover:shadow-xl",
    glass: "bg-white/80 backdrop-blur-lg border-white/20 shadow-2xl"
  };

  const hoverEffect = hover ? "hover:scale-[1.02]" : "";

  return (
    <div className={cn(baseClasses, variants[variant], hoverEffect, className)}>
      {(variant === 'accent' || variant === 'premium') && (
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      )}
      {variant === 'glass' && (
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      )}
      {children}
    </div>
  );
};

interface ModernButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  onClick
}) => {
  const baseClasses = "relative overflow-hidden font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98]";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl hover:scale-[1.02] focus:ring-primary/50",
    secondary: "bg-gradient-to-r from-secondary to-secondary/80 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] focus:ring-secondary/50",
    accent: "bg-gradient-to-r from-accent to-accent/80 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] focus:ring-accent/50",
    ghost: "bg-transparent border border-border/50 hover:bg-muted/50 hover:border-primary/30 text-foreground"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button 
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      onClick={onClick}
    >
      {(variant === 'primary' || variant === 'secondary' || variant === 'accent') && (
        <>
          <div className="absolute top-0 left-[-100%] h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-800 ease-in-out" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 rounded-lg opacity-0 transition-opacity duration-300" />
        </>
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

interface StatusBadgeProps {
  children: React.ReactNode;
  variant: 'success' | 'warning' | 'error' | 'info' | 'pending';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  variant,
  className
}) => {
  const variants = {
    success: "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200",
    warning: "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border-yellow-200",
    error: "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200",
    info: "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200",
    pending: "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border-gray-200"
  };

  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-all duration-200 hover:scale-105",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  showLabel = false,
  variant = 'default'
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const variants = {
    default: "from-primary to-secondary",
    success: "from-green-500 to-green-600",
    warning: "from-yellow-500 to-yellow-600",
    error: "from-red-500 to-red-600"
  };

  return (
    <div className={cn("progress-modern", className)}>
      <div 
        className={cn("progress-bar bg-gradient-to-r", variants[variant])}
        style={{ width: `${percentage}%` }}
      />
      {showLabel && (
        <div className="text-xs text-muted-foreground mt-1">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};
