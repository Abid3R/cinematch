/**
 * MoviePoster — atomic poster image wrapper.
 *
 * Thin wrapper around `next/image` that:
 *  - resolves TMDB's relative `poster_path` to a full CDN URL at the requested
 *    named size (`xs` → `xxl` → `original`), with a graceful SVG placeholder
 *    when the path is missing.
 *  - applies the aspect ratio (2:3) that all TMDB posters share.
 *  - exposes `priority` for above-the-fold posters (hero, first row).
 *
 * Intentionally has no hover state, no click handler, no link wrapping —
 * those concerns live in `MovieCard`. This way the same poster can be reused
 * in detail headers, lists, search results, and skeletons.
 */

import Image from "next/image";

import type { PosterSize } from "@/constants/tmdb";
import { getPosterUrl } from "@/utils/image";
import { cn } from "@/utils/cn";

export interface MoviePosterProps {
  /** TMDB relative path (e.g. "/abc123.jpg"). Pass null for placeholder. */
  path: string | null | undefined;
  /** TMDB size key — selects the CDN size variant. */
  size?: PosterSize;
  /** Alt text. Use the movie title; passed through to `next/image`. */
  alt: string;
  /** Above-the-fold? Skips lazy-loading. */
  priority?: boolean;
  /** Fill the parent rather than rendering at intrinsic size. */
  fill?: boolean;
  className?: string;
  /** Suppress the 2:3 aspect-ratio wrapper (caller controls layout). */
  raw?: boolean;
  /** sizes attr for responsive `next/image`. */
  sizes?: string;
}

/**
 * Intrinsic pixel widths for each named size, used by `next/image` when
 * `fill` isn't requested. Mirrors the TMDB size key names.
 */
const PIXEL_WIDTH: Record<PosterSize, number> = {
  xs: 92,
  sm: 154,
  md: 185,
  lg: 342,
  xl: 500,
  xxl: 780,
  original: 1000,
};

export function MoviePoster({
  path,
  size = "lg",
  alt,
  priority = false,
  fill = false,
  className,
  raw = false,
  sizes,
}: MoviePosterProps) {
  const src = getPosterUrl(path, size);

  if (raw) {
    // Caller is fully responsible for layout (used by avatar-like consumers).
    return (
      <Image
        src={src}
        alt={alt}
        width={PIXEL_WIDTH[size]}
        height={Math.round(PIXEL_WIDTH[size] * 1.5)}
        priority={priority}
        className={className}
        sizes={sizes}
        unoptimized={src.startsWith("data:")}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className={cn("object-cover", className)}
        sizes={sizes ?? "(max-width: 768px) 50vw, 33vw"}
        unoptimized={src.startsWith("data:")}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-bg-elevated",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes={sizes ?? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"}
        unoptimized={src.startsWith("data:")}
      />
    </div>
  );
}
