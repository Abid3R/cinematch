/**
 * Input + Textarea primitives.
 *
 * The styling is intentionally restrained — a 1px border, the translucent
 * surface fill from the token palette, brand-coloured focus ring. The
 * placeholder colour comes from the `ink-subtle` token so it stays legible
 * over the dark background without competing with the actual value.
 */

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

const inputBase =
  "flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink " +
  "placeholder:text-ink-subtle " +
  "transition-colors duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:border-brand-500/50 " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "file:border-0 file:bg-transparent file:text-sm file:font-medium";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(inputBase, "h-10", className)}
      {...rest}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(inputBase, "min-h-[80px] resize-y", className)}
      {...rest}
    />
  );
});
