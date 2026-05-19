import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactElement;
  className?: string;
};

export function FormField({ id, label, required, error, hint, children, className }: FormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [hintId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;

  const control = React.cloneElement(children, {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <>
            <span aria-hidden="true"> *</span>
            <span className="sr-only"> (obbligatorio)</span>
          </>
        ) : null}
      </Label>
      {hint ? (
        <p id={hintId} className="text-sm text-slate-700">
          {hint}
        </p>
      ) : null}
      {control}
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
