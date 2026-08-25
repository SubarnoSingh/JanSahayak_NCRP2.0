"use client";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  children: (id: string, describedBy?: string) => ReactNode;
}

export function FieldShell({ label, hint, error, optional, children }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-ink-faint">(optional)</span>}
      </label>
      {children(id, [hint ? hintId : "", error ? errId : ""].filter(Boolean).join(" ") || undefined)}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-2xs leading-relaxed text-ink-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="mt-1.5 flex items-start gap-1 text-xs text-danger">
          <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden>
            <path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0-8a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const baseControl =
  "w-full rounded-control border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint/70 transition-colors focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, optional, className = "", ...props },
  ref
) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional}>
      {(id, describedBy) => (
        <input
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={`${baseControl} h-10 ${error ? "border-danger" : "border-line"} ${className}`}
          {...props}
        />
      )}
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string | null;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className = "", ...props },
  ref
) {
  if (!label) {
    return (
      <textarea
        ref={ref}
        aria-label={props["aria-label"]}
        className={`${baseControl} min-h-[120px] py-2.5 leading-relaxed ${
          error ? "border-danger" : "border-line"
        } ${className}`}
        {...props}
      />
    );
  }
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <textarea
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={`${baseControl} min-h-[120px] py-2.5 leading-relaxed ${
            error ? "border-danger" : "border-line"
          } ${className}`}
          {...props}
        />
      )}
    </FieldShell>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  options: { value: string; label: string }[];
}
export function Select({ label, hint, error, optional, options, className = "", ...props }: SelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional}>
      {(id, describedBy) => (
        <select
          id={id}
          aria-describedby={describedBy}
          className={`${baseControl} h-10 pr-8 ${error ? "border-danger" : "border-line"} ${className}`}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}
