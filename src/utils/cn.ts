/**
 * className utility.
 *
 * Thin wrapper around `clsx` + `tailwind-merge` so component variants can be
 * composed conditionally without producing duplicate / conflicting Tailwind
 * classes (e.g. `px-2 px-4` collapses to `px-4`).
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
