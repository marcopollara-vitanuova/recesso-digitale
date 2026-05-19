import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary-400)] focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-[var(--primary-700)] bg-[var(--primary-700)] text-white shadow-[var(--shadow-button)] hover:border-[var(--primary-600)] hover:bg-[var(--primary-600)] active:border-[var(--primary-800)] active:bg-[var(--primary-800)]",
        secondary:
          "border border-[var(--primary-700)] bg-white text-[var(--primary-700)] hover:border-[var(--primary-600)] hover:bg-[var(--primary-600)] hover:text-white active:bg-[var(--primary-800)] active:text-white",
        outline:
          "border border-[var(--gray-300)] bg-white text-[var(--gray-700)] hover:border-[var(--primary-600)] hover:bg-[var(--primary-50)] hover:text-[var(--primary-700)]",
        primary:
          "border border-[var(--primary-700)] bg-[var(--primary-700)] text-white shadow-[var(--shadow-button)] hover:border-[var(--primary-600)] hover:bg-[var(--primary-600)] active:border-[var(--primary-800)] active:bg-[var(--primary-800)]",
        teal:
          "border border-[var(--primary-700)] bg-[var(--primary-700)] text-white shadow-[var(--shadow-button)] hover:border-[var(--primary-600)] hover:bg-[var(--primary-600)] active:border-[var(--primary-800)] active:bg-[var(--primary-800)]",
        destructive:
          "border border-[var(--error-500)] bg-[var(--error-500)] text-white hover:bg-[var(--error-400)]",
      },
      size: {
        default: "h-11 px-8 py-4",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-8 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
);
Button.displayName = "Button";
