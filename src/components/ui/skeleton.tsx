/**
 * Skeleton placeholder.
 *
 * Two visual modes:
 *  - The default `Skeleton` is a single translucent block with the
 *    `pulse-glow` keyframe from the Tailwind config — used in card grids
 *    while TMDB is loading.
 *  - `ShimmerBlock` adds a moving highlight bar via the `shimmer` keyframe.
 *    Slightly more expensive, so reserved for above-the-fold heroes.
 */

import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-surface animate-pulse",
        className,
      )}
      {...rest}
    />
  );
});

export const ShimmerBlock = forwardRef<HTMLDivElement, SkeletonProps>(function ShimmerBlock(
  { className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-surface",
        className,
      )}
      {...rest}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
});
