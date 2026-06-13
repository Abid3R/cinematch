/**
 * Dialog (modal) primitive — hand-rolled, no Radix.
 *
 * Behaviour
 *  - Portal-rendered into `document.body` so the modal isn't trapped inside
 *    transformed/scrollable ancestors.
 *  - Locks body scroll while open and restores it on close.
 *  - Closes on ESC, on backdrop click, and on programmatic `onOpenChange`.
 *  - Returns focus to the previously focused element after close.
 *  - Animates with Framer Motion (fade + scale-from-95%).
 *
 * API mirrors shadcn/ui so consumers feel at home:
 *
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogContent>
 *       <DialogHeader>
 *         <DialogTitle>Are you sure?</DialogTitle>
 *         <DialogDescription>This cannot be undone.</DialogDescription>
 *       </DialogHeader>
 *       <DialogFooter>...</DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/utils/cn";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labelId: string;
  descriptionId: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(component: string): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error(`<${component}> must be used inside a <Dialog>`);
  }
  return ctx;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps): JSX.Element {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <DialogContext.Provider value={{ open, onOpenChange, labelId, descriptionId }}>
      {children}
    </DialogContext.Provider>
  );
}

export interface DialogContentProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  // Drag events — Framer Motion redefines these with incompatible signatures
  | "onDrag" | "onDragCapture" | "onDragEnd" | "onDragEndCapture"
  | "onDragEnter" | "onDragEnterCapture" | "onDragExit" | "onDragExitCapture"
  | "onDragLeave" | "onDragLeaveCapture" | "onDragOver" | "onDragOverCapture"
  | "onDragStart" | "onDragStartCapture" | "onDrop" | "onDropCapture"
  // Animation events — Framer Motion redefines these with incompatible signatures
  | "onAnimationStart" | "onAnimationStartCapture"
  | "onAnimationEnd" | "onAnimationEndCapture"
  | "onAnimationIteration" | "onAnimationIterationCapture"
> {
  /** When false, removes the close (X) button in the header. */
  showCloseButton?: boolean;
}

export function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...rest
}: DialogContentProps): JSX.Element | null {
  const { open, onOpenChange, labelId, descriptionId } = useDialogContext("DialogContent");
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Body-scroll lock + restore focus.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog on next paint.
    const handle = window.setTimeout(() => {
      contentRef.current?.focus();
    }, 0);
    return () => {
      window.clearTimeout(handle);
      document.body.style.overflow = original;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // ESC to close.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          <motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative z-10 w-full max-w-lg rounded-2xl border border-border-strong",
              "bg-bg-elevated/95 backdrop-blur-2xl shadow-glass-lg",
              "p-6 text-ink outline-none",
              className,
            )}
            {...rest}
          >
            {showCloseButton ? (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
              >
                <X className="size-4" />
              </button>
            ) : null}
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function DialogHeader({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn("flex flex-col gap-1.5 pb-4", className)}
      {...rest}
    />
  );
}

export function DialogFooter({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...rest}
    />
  );
}

export function DialogTitle({
  className,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  const { labelId } = useDialogContext("DialogTitle");
  return (
    <h2
      id={labelId}
      className={cn("text-lg font-semibold tracking-tight text-ink", className)}
      {...rest}
    />
  );
}

export function DialogDescription({
  className,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>): JSX.Element {
  const { descriptionId } = useDialogContext("DialogDescription");
  return (
    <p
      id={descriptionId}
      className={cn("text-sm text-ink-muted", className)}
      {...rest}
    />
  );
}

/** Imperative trigger helper — opens the dialog when clicked. */
export function DialogClose({ children }: { children: ReactNode }): JSX.Element {
  const { onOpenChange } = useDialogContext("DialogClose");
  const handleClick = useCallback(() => onOpenChange(false), [onOpenChange]);
  return (
    <span onClick={handleClick} className="contents">
      {children}
    </span>
  );
}
