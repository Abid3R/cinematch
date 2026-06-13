/**
 * Tooltip primitive — show on hover/focus, portal to body, position-aware.
 *
 * No Radix — we implement a minimal version with a single `useTooltip` hook
 * powering the `Tooltip` wrapper. Positioning is a simple "place above the
 * trigger, flip below if there's no room" algorithm. Good enough for CineMatch:
 * the heaviest tooltip lives on the recommendation score badge, where the
 * trigger is small and the surface is wide.
 *
 *   <Tooltip content="Recommendation score">
 *     <ScoreBadge score={0.82} />
 *   </Tooltip>
 */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/utils/cn";

interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  /** Show delay in ms (default: 200). */
  delay?: number;
  /** Preferred side; will flip if there isn't enough room. */
  side?: "top" | "bottom";
  className?: string;
}

export function Tooltip({
  content,
  children,
  delay = 200,
  side = "top",
  className,
}: TooltipProps): JSX.Element {
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const timer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number; placement: "top" | "bottom" }>({
    x: 0,
    y: 0,
    placement: side,
  });
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const show = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setOpen(false);
  }, []);

  // Compute position whenever we open.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipHeight = tooltipRect?.height ?? 36;
    const tooltipWidth = tooltipRect?.width ?? 120;

    const wantsTop = side === "top";
    const fitsTop = triggerRect.top - tooltipHeight - 12 > 0;
    const placement = wantsTop && fitsTop ? "top" : wantsTop ? "bottom" : "bottom";

    const x = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
    const y =
      placement === "top"
        ? triggerRect.top - tooltipHeight - 8
        : triggerRect.bottom + 8;

    setPosition({
      x: Math.max(8, Math.min(window.innerWidth - tooltipWidth - 8, x)),
      y,
      placement,
    });
  }, [open, side]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (!isValidElement(children)) {
    throw new Error("<Tooltip> expects a single ReactElement child");
  }

  const trigger = cloneElement(children as ReactElement<Record<string, unknown>>, {
    ref: (node: HTMLElement) => {
      triggerRef.current = node;
      const { ref } = children as unknown as { ref?: unknown };
      if (typeof ref === "function") ref(node);
      else if (ref && typeof ref === "object" && "current" in (ref as object)) {
        (ref as { current: HTMLElement | null }).current = node;
      }
    },
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    "aria-describedby": open ? id : undefined,
  });

  return (
    <>
      {trigger}
      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  ref={tooltipRef}
                  role="tooltip"
                  id={id}
                  initial={{ opacity: 0, y: position.placement === "top" ? 4 : -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: position.placement === "top" ? 4 : -4 }}
                  transition={{ duration: 0.14 }}
                  style={{
                    position: "fixed",
                    top: position.y,
                    left: position.x,
                    zIndex: 200,
                  }}
                  className={cn(
                    "pointer-events-none rounded-md border border-border-strong bg-bg-elevated/95 px-2.5 py-1.5",
                    "text-xs text-ink shadow-glass-md backdrop-blur-xl",
                    className,
                  )}
                >
                  {content}
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
