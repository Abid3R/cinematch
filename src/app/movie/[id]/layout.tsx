/**
 * Movie details route layout — provides dynamic per-title metadata.
 *
 * The page itself is a client component (motion, trailer modal, store wiring),
 * so it cannot export `generateMetadata` directly. This server-only layout
 * fetches the same `MovieDetails` payload that the page will hydrate from
 * cache, and projects it into `<title>`, description, and OG/Twitter card
 * fields. The fetch is deduped/cached by the TMDB client, so it costs nothing
 * extra in practice.
 *
 * On bad ids or upstream failure we fall back to neutral metadata rather than
 * crashing — `notFound()` is the page's job, not the metadata layer's.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SITE_NAME } from "@/constants/site";
import { getMovieDetails } from "@/services/tmdb";
import { getBackdropUrl } from "@/utils/image";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) {
    return {
      title: "Movie",
      description: `Movie details on ${SITE_NAME}.`,
    };
  }

  try {
    const movie = await getMovieDetails(id);

    const year = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : null;
    const titleLine = year ? `${movie.title} (${year})` : movie.title;

    // Prefer the official overview; fall back to tagline; fall back to a
    // generic line so OG cards never ship empty.
    const description =
      (movie.overview && movie.overview.trim().length > 0
        ? movie.overview
        : movie.tagline) ??
      `${movie.title} — full cast, crew, trailer, ratings, and similar picks on ${SITE_NAME}.`;

    const backdrop = getBackdropUrl(movie.backdrop_path, "lg");
    const canonical = `/movie/${id}`;

    return {
      title: titleLine,
      description,
      alternates: { canonical },
      openGraph: {
        title: `${titleLine} · ${SITE_NAME}`,
        description,
        url: canonical,
        type: "video.movie",
        images: backdrop
          ? [
              {
                url: backdrop,
                width: 1280,
                height: 720,
                alt: `${movie.title} backdrop`,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${titleLine} · ${SITE_NAME}`,
        description,
        images: backdrop ? [backdrop] : undefined,
      },
    };
  } catch {
    return {
      title: "Movie",
      description: `Movie details on ${SITE_NAME}.`,
    };
  }
}

export default function MovieLayout({ children }: LayoutProps): JSX.Element {
  return <>{children}</>;
}
