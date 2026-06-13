/**
 * Toast notification system.
 *
 * Two pieces:
 *  1. A Zustand store keeps the queue outside the React tree so any
 *     component (server actions, hook side effects, store mutations) can
 *     call `toast.success("Added to watchlist")` without prop drilling.
 *  2. `<Toaster />` is mounted once at the root and renders the queue with
 *     Framer Motion's `AnimatePresence` for slide/fade transitions.
 *
 * Toasts auto-dismiss after `duration` (default 4s) but pause when hovered.
 * Errors stay around longer by default — they need to be read.
 */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { create } from "zustand";

import { cn } from "@/utils/cn";

type ToastVariant = "default" | "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  title?: string;
  description?: ReactNode;
  variant: ToastVariant;
  duration: number;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { id, ...toast }] }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Imperative API. Stable across renders. */
export const toast = {
  show: (opts: {
    title?: string;
    description?: ReactNode;
    variant?: ToastVariant;
    duration?: number;
  }) =>
    useToastStore.getState().push({
      title: opts.title,
      description: opts.description,
      variant: opts.variant ?? "default",
      duration: opts.duration ?? 4000,
    }),
  success: (title: string, description?: ReactNode) =>
    useToastStore.getState().push({
      title,
      description,
      variant: "success",
      duration: 3500,
    }),
  error: (title: string, description?: ReactNode) =>
    useToastStore.getState().push({
      title,
      description,
      variant: "error",
      duration: 6000,
    }),
  warning: (title: string, description?: ReactNode) =>
    useToastStore.getState().push({
      title,
      description,
      variant: "warning",
      duration: 5000,
    }),
  info: (title: string, description?: ReactNode) =>
    useToastStore.getState().push({
      title,
      description,
      variant: "info",
      duration: 4000,
    }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};

/** Hook for components that want to read the queue (rarely needed). */
export function useToast() {
  const toasts = useToastStore((s) => s.toasts);
  return { toasts, ...toast };
}

const variantStyles: Record<
  ToastVariant,
  { ring: string; icon: ReactNode | null }
> = {
  default: { ring: "border-border-strong", icon: null },
  success: {
    ring: "border-success/40",
    icon: <CheckCircle2 className="size-4 text-success" />,
  },
  error: {
    ring: "border-danger/50",
    icon: <XCircle className="size-4 text-danger" />,
  },
  warning: {
    ring: "border-warning/50",
    icon: <AlertTriangle className="size-4 text-warning" />,
  },
  info: {
    ring: "border-accent-cyan/40",
    icon: <Info className="size-4 text-accent-cyan" />,
  },
};

function ToastCard({ toast: item }: { toast: ToastItem }): JSX.Element {
  const dismiss = useToastStore((s) => s.dismiss);
  const paused = useRef(false);

  useEffect(() => {
    let remaining = item.duration;
    let start = Date.now();
    let timer: number | null = null;
    function schedule(ms: number) {
      timer = window.setTimeout(() => dismiss(item.id), ms);
    }
    schedule(remaining);

    function onEnter() {
      paused.current = true;
      if (timer) window.clearTimeout(timer);
      remaining -= Date.now() - start;
    }
    function onLeave() {
      paused.current = false;
      start = Date.now();
      schedule(remaining);
    }
    const node = document.getElementById(`toast-${item.id}`);
    node?.addEventListener("mouseenter", onEnter);
    node?.addEventListener("mouseleave", onLeave);
    return () => {
      if (timer) window.clearTimeout(timer);
      node?.removeEventListener("mouseenter", onEnter);
      node?.removeEventListener("mouseleave", onLeave);
    };
  }, [item.id, item.duration, dismiss]);

  const style = variantStyles[item.variant];

  return (
    <motion.div
      layout
      id={`toast-${item.id}`}
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-bg-elevated/95",
        "p-4 shadow-glass-lg backdrop-blur-xl",
        style.ring,
      )}
    >
      {style.icon ? <div className="mt-0.5">{style.icon}</div> : null}
      <div className="min-w-0 flex-1">
        {item.title ? (
          <div className="text-sm font-semibold text-ink">{item.title}</div>
        ) : null}
        {item.description ? (
          <div className="mt-1 text-sm text-ink-muted">{item.description}</div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Dismiss"
        className="text-ink-subtle transition-colors hover:text-ink"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  );
}

/** Mount once at the root of the App Router tree. */
export function Toaster(): JSX.Element {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[300] flex w-full max-w-sm flex-col items-end gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
