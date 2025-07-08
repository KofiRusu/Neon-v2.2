import { toast } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export const useToast = () => {
  const showToast = ({
    title,
    description,
    variant = "default",
    action,
    duration = 5000,
  }: ToastProps) => {
    const message = title
      ? `${title}${description ? `: ${description}` : ""}`
      : description || "";

    if (variant === "destructive") {
      return toast.error(message, {
        duration,
        action: action
          ? {
              label: action.label,
              onClick: action.onClick,
            }
          : undefined,
      });
    }

    return toast.success(message, {
      duration,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    });
  };

  return {
    toast: showToast,
    dismiss: toast.dismiss,
    success: (message: string, options?: { duration?: number }) =>
      toast.success(message, { duration: options?.duration || 5000 }),
    error: (message: string, options?: { duration?: number }) =>
      toast.error(message, { duration: options?.duration || 5000 }),
    info: (message: string, options?: { duration?: number }) =>
      toast(message, { duration: options?.duration || 5000 }),
    loading: (message: string) => toast.loading(message),
    promise: toast.promise,
  };
};

export { toast };
