import { toast } from '@/components/ui/use-toast';

// Thin wrappers over the existing toast system so success/warning/error
// notifications share one consistent sci-fi command aesthetic. No new
// notification framework — each call forwards to the same toaster.
const SUCCESS_CLASS = 'border-cyan-400/50 bg-cyan-950/80 text-cyan-100';
const WARN_CLASS = 'border-amber-400/50 bg-amber-950/80 text-amber-100';

export function toastSuccess(title, description) {
  toast({ title, description, className: SUCCESS_CLASS });
}

export function toastWarning(title, description) {
  toast({ title, description, className: WARN_CLASS });
}

export function toastError(title, description) {
  toast({ title, description, variant: 'destructive' });
}