import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "danger" | "ghost" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children?: ReactNode;
  size?: "sm" | "md";
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  danger: "bg-error text-white hover:bg-[#D63D39]",
  ghost: "bg-bg-sub text-text-secondary hover:bg-bg-hover",
  icon: "text-text-tertiary hover:bg-bg-sub hover:text-text-secondary",
};

export function Button({
  variant = "ghost",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const sizeStyles = size === "sm" ? "px-[10px] py-[3px] text-[11px]" : "px-[14px] py-[6px] text-[12px]";
  const base = variant === "icon"
    ? "w-[34px] h-[34px] flex items-center justify-center"
    : "";

  return (
    <button
      className={`rounded-[var(--radius-sm)] font-medium transition-all duration-150 ${variantStyles[variant]} ${sizeStyles} ${base} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
