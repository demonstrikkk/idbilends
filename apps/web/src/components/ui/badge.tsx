import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-navy text-ivory shadow",
        secondary: "border-transparent bg-subtle text-ink",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-ink",
        positive: "border-positive/20 bg-positive/10 text-positive",
        warning: "border-amber/20 bg-amber/10 text-amber",
        info: "border-cyan/20 bg-cyan/10 text-cyan",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
