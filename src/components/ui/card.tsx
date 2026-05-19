import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--gray-200)] bg-white p-0 shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-[var(--gray-100)] px-6 py-5", className)} {...props} />;
}

type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2" | "h3";
};

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Tag = "h2", ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn("text-lg font-semibold text-[var(--primary-900)] md:text-xl", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}
