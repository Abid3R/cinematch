/**
 * Card primitive.
 *
 * Glassmorphic surface used across the app — movie detail header, recommendation
 * sections, profile analytics, dialogs. Composed of six sub-components so the
 * layout stays declarative at the call site:
 *
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Top picks for you</CardTitle>
 *       <CardDescription>Based on what you've liked recently</CardDescription>
 *     </CardHeader>
 *     <CardContent>...</CardContent>
 *     <CardFooter>...</CardFooter>
 *   </Card>
 *
 * The base surface uses a subtle 1px gradient border via `bg-clip-padding` plus
 * a translucent fill so it reads on both the dark page and over poster art.
 */

import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

type DivProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, DivProps>(function Card(
  { className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-xl border border-border bg-bg-elevated/70 backdrop-blur-xl",
        "shadow-glass-md text-ink",
        className,
      )}
      {...rest}
    />
  );
});

export const CardHeader = forwardRef<HTMLDivElement, DivProps>(function CardHeader(
  { className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1.5 p-6", className)}
      {...rest}
    />
  );
});

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...rest }, ref) {
    return (
      <h3
        ref={ref}
        className={cn(
          "text-lg font-semibold leading-tight tracking-tight text-ink",
          className,
        )}
        {...rest}
      />
    );
  },
);

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  function CardDescription({ className, ...rest }, ref) {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-ink-muted", className)}
        {...rest}
      />
    );
  },
);

export const CardContent = forwardRef<HTMLDivElement, DivProps>(function CardContent(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cn("p-6 pt-0", className)} {...rest} />;
});

export const CardFooter = forwardRef<HTMLDivElement, DivProps>(function CardFooter(
  { className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...rest}
    />
  );
});
