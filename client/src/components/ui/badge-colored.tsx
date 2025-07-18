import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// This extends the shadcn Badge component with additional color variants
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        warning:
          "border-transparent bg-amber-500 text-white hover:bg-amber-600",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-600",
        info:
          "border-transparent bg-blue-500 text-white hover:bg-blue-600",
        // Additional color variants for the production module
        gray:
          "border-transparent bg-gray-500 text-white hover:bg-gray-600",
        blue:
          "border-transparent bg-blue-500 text-white hover:bg-blue-600",
        green:
          "border-transparent bg-green-500 text-white hover:bg-green-600",
        yellow:
          "border-transparent bg-amber-500 text-white hover:bg-amber-600",
        red:
          "border-transparent bg-red-500 text-white hover:bg-red-600",
        orange:
          "border-transparent bg-orange-500 text-white hover:bg-orange-600",
        purple:
          "border-transparent bg-purple-500 text-white hover:bg-purple-600",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function BadgeColored({
  className,
  variant,
  size,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { BadgeColored, badgeVariants };