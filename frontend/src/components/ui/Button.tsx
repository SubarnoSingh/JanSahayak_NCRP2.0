"use client";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outlineDanger" | "saffron";
type Size = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy-deep active:bg-navy-deep disabled:bg-navy-soft",
  secondary: "bg-navy-tint text-navy border border-navy-border hover:bg-[#e2ebf4] disabled:opacity-60",
  ghost: "text-navy hover:bg-navy-tint disabled:opacity-50",
  outlineDanger: "border border-danger text-danger hover:bg-danger-tint",
  saffron: "bg-saffron text-white hover:bg-saffron-deep disabled:opacity-60",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-control",
  md: "h-10 px-4 text-sm gap-2 rounded-control font-medium",
  lg: "h-12 px-6 text-base gap-2 rounded-control font-medium",
  xl: "h-14 px-8 text-base md:text-lg gap-2 rounded-control font-semibold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center transition-colors duration-150 disabled:cursor-not-allowed select-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
});
