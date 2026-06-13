/**
 * Layout components barrel.
 *
 * Single import surface for the chrome that wraps every page: the sticky
 * glassmorphic Navbar, the minimal Footer with TMDB attribution, and the
 * fixed AnimatedBackground that paints the cinematic backdrop.
 */

export { Navbar } from "./navbar";
export type { NavbarProps } from "./navbar";

export { Footer } from "./footer";
export type { FooterProps } from "./footer";

export { AnimatedBackground } from "./animated-background";
export type { AnimatedBackgroundProps } from "./animated-background";
