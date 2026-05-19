import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn("field-control min-h-[5rem] resize-y py-3 text-sm", className)}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
