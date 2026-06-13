/**
 * Button primitive.
 *
 * A single, opinionated button component with variants that map to CineMatch's
 * design tokens. We hand-roll the variants (rather than depend on cva) to keep
 * the component tree small and predictable.
 *
 * Variants
 *  - `primary`   — the brand red call-to-action. Used for "Get Started", form
 *                  submits, and the hero CTA.
 *  - `secondary` — translucent surface chip. Used inside dialogs and rails.
 *  - `ghost`     — transparent until hover. Used in navbars and toolbars.
 *  - `outline`   — bordered surface that still reads on dark gradients.
 *  - `destructive` — for "Remove from watchlist" etc.
 *  - `link`      — looks like an inline link but is still a real <button>.
 *
 * Sizes
 *  - `sm` (h-8, px-3) — table rows, chips
 *  - `md` (h-10, px-4) — default
 *  - `lg` (h-12, px-6) — hero CTAs
 *  - `icon` (h-10, w-10) — circular icon button
 *
 * Polymorphism: `asChild` clones the single child element and forwards class
 * names + refs, so we can wrap a `<Link>` from next/link without losing focus
 * styles. This is the same pattern shadcn/ui uses (via Radix Slot); we
 * implement a minimal Slot inline below to avoid a Radix dependency.
 */
"use client";

import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type Ref,
} from "react";

import { cn } from "@/utils/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "destructive"
  | "link";

type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** When true, clones the single child element instead of rendering a button. */
  asChild?: boolean;
  /** Renders a small spinner and disables the button. */
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg " +
  "font-medium select-none transition-all duration-200 ease-spring " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-white shadow-glow hover:bg-brand-600 hover:shadow-[0_0_50px_rgba(255,45,85,0.5)] active:scale-[0.98]",
  secondary:
    "bg-surface text-ink backdrop-blur-md border border-border hover:bg-surface-hover hover:border-border-strong active:scale-[0.98]",
  ghost:
    "bg-transparent text-ink-muted hover:bg-surface hover:text-ink active:scale-[0.98]",
  outline:
    "border border-border-strong bg-transparent text-ink hover:bg-surface active:scale-[0.98]",
  destructive:
    "bg-danger/90 text-white hover:bg-danger active:scale-[0.98]",
  link:
    "bg-transparent text-brand-400 underline-offset-4 hover:underline hover:text-brand-300 px-0 py-0 h-auto",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
};

/**
 * Minimal Slot polyfill — merges classes/refs into the single child element.
 * Kept private to this file because Button is the only consumer.
 */
interface SlotProps {
  className?: string;
  children: React.ReactNode;
  // Anything else is forwarded onto the cloned child.
  [key: string]: unknown;
}

const Slot = forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, className, ...rest },
  ref,
) {
  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  const element = child as ReactElement<{ className?: string; ref?: Ref<HTMLElement> }>;
  return cloneElement(element, {
    ...rest,
    ref,
    className: cn(element.props.className, className),
  } as Partial<typeof element.props>);
});

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    asChild = false,
    loading = false,
    disabled,
    children,
    ...rest
  },
  ref,
) {
  const composedClassName = cn(
    base,
    variantClass[variant],
    sizeClass[size],
    className,
  );

  if (asChild) {
    return (
      <Slot
        ref={ref as unknown as Ref<HTMLElement>}
        className={composedClassName}
        {...rest}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      className={composedClassName}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
});

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 rounded-full border-2 border-current border-r-transparent animate-spin-slow"
      style={{ animationDuration: "0.7s" }}
    />
  );
}
