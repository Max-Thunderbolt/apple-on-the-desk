import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-lg font-bold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_6px_0_hsl(270_30%_75%)] hover:-translate-y-0.5 hover:shadow-[0_8px_0_hsl(270_30%_72%)] active:translate-y-1 active:shadow-[0_2px_0_hsl(270_30%_65%)]",
        destructive: "bg-destructive text-destructive-foreground shadow-[0_6px_0_hsl(0_60%_45%)] hover:-translate-y-0.5 active:translate-y-1",
        outline: "border-2 border-primary bg-background text-primary shadow-[0_6px_0_hsl(270_30%_75%)] hover:-translate-y-0.5 active:translate-y-1",
        secondary: "bg-secondary text-secondary-foreground shadow-[0_6px_0_hsl(180_40%_55%)] hover:-translate-y-0.5 active:translate-y-1",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-xl",
        link: "text-primary underline-offset-4 hover:underline",
        kahoot: "bg-primary text-primary-foreground shadow-[0_6px_0_hsl(270_30%_75%)] hover:-translate-y-0.5 hover:shadow-[0_8px_0_hsl(270_30%_72%)] active:translate-y-1 active:shadow-[0_2px_0_hsl(270_30%_65%)]",
        "kahoot-secondary": "bg-secondary text-secondary-foreground shadow-[0_6px_0_hsl(180_40%_55%)] hover:-translate-y-0.5 hover:shadow-[0_8px_0_hsl(180_40%_52%)] active:translate-y-1 active:shadow-[0_2px_0_hsl(180_40%_48%)]",
        "kahoot-accent": "bg-accent text-accent-foreground shadow-[0_6px_0_hsl(45_70%_50%)] hover:-translate-y-0.5 active:translate-y-1",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4 text-base",
        lg: "h-14 rounded-2xl px-10 text-xl",
        xl: "h-16 rounded-2xl px-12 text-2xl",
        icon: "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
