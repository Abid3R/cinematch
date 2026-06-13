/**
 * Barrel for UI primitives.
 *
 * Keeping a flat re-export means consumers can write
 *
 *   import { Button, Card, Dialog, Tabs, toast } from "@/components/ui";
 *
 * without paying attention to which file each primitive lives in. The shape of
 * the public surface mirrors shadcn-style libraries: each primitive bundle
 * exports its root component plus its compound parts (e.g. `Card`,
 * `CardHeader`, `CardTitle`, ...).
 */

export { Button, type ButtonProps } from "./button";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
export {
  CommandPalette,
  commandPalette,
  useCommandPalette,
} from "./command-palette";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  type DialogProps,
  type DialogContentProps,
} from "./dialog";
export { Input, Textarea, type InputProps, type TextareaProps } from "./input";
export { Skeleton, ShimmerBlock } from "./skeleton";
export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
} from "./tabs";
export { toast, Toaster, useToast } from "./toast";
export { Tooltip } from "./tooltip";
