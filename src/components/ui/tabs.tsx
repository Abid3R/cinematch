/**
 * Tabs primitive — controlled or uncontrolled, keyboard accessible.
 *
 * Used in the User Profile (overview / activity / analytics) and on Movie
 * Details (cast / similar / reviews). The active indicator is an animated
 * underline driven by Framer Motion's layoutId so the highlight slides
 * between triggers instead of swapping styles abruptly.
 *
 *   <Tabs defaultValue="overview">
 *     <TabsList>
 *       <TabsTrigger value="overview">Overview</TabsTrigger>
 *       <TabsTrigger value="activity">Activity</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="overview">...</TabsContent>
 *     <TabsContent value="activity">...</TabsContent>
 *   </Tabs>
 */
"use client";

import { motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/utils/cn";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
  indicatorId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error(`<${component}> must be rendered inside <Tabs>`);
  }
  return ctx;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  defaultValue = "",
  value,
  onValueChange,
  className,
  children,
  ...rest
}: TabsProps): JSX.Element {
  const [internal, setInternal] = useState(defaultValue);
  const baseId = useId();
  const indicatorId = useId();

  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const setValue = useCallback(
    (next: string) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  const ctx = useMemo<TabsContextValue>(
    () => ({ value: current, setValue, baseId, indicatorId }),
    [current, setValue, baseId, indicatorId],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn("w-full", className)} {...rest}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, children, ...rest }: TabsListProps): JSX.Element {
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const triggers = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']") ?? [],
    );
    const current = triggers.findIndex((el) => el === document.activeElement);
    if (current < 0) return;
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = triggers[(current + delta + triggers.length) % triggers.length];
    next?.focus();
    event.preventDefault();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        "relative inline-flex h-11 items-center gap-1 rounded-lg border border-border bg-surface p-1 backdrop-blur-md",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
}

export function TabsTrigger({
  value,
  className,
  children,
  disabled,
  ...rest
}: TabsTriggerProps): JSX.Element {
  const { value: current, setValue, baseId, indicatorId } = useTabsContext("TabsTrigger");
  const active = current === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-trigger-${value}`}
      aria-controls={`${baseId}-content-${value}`}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      disabled={disabled}
      onClick={() => setValue(value)}
      className={cn(
        "relative inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60",
        "disabled:pointer-events-none disabled:opacity-50",
        active ? "text-ink" : "text-ink-muted hover:text-ink",
        className,
      )}
      {...rest}
    >
      {active ? (
        <motion.span
          layoutId={indicatorId}
          className="absolute inset-0 rounded-md bg-bg-elevated shadow-glass-sm"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      ) : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  /** When true, child content is mounted even when inactive (kept hidden via CSS). */
  forceMount?: boolean;
}

export function TabsContent({
  value,
  className,
  children,
  forceMount = false,
  ...rest
}: TabsContentProps): JSX.Element | null {
  const { value: current, baseId } = useTabsContext("TabsContent");
  const active = current === value;
  if (!active && !forceMount) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-content-${value}`}
      aria-labelledby={`${baseId}-trigger-${value}`}
      hidden={!active}
      className={cn(
        "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
