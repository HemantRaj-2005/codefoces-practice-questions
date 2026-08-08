"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  title?: string;
  description: string;
  type?: ToastType;
  duration?: number;
}

const ToastContext = React.createContext<{
  toast: (message: Omit<ToastMessage, "id">) => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}>({
  toast: () => {},
  toasts: [],
  removeToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((message: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...message, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = message.duration || 4000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex w-full items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 pointer-events-auto animate-in slide-in-from-bottom-5",
            t.type === "success" && "border-emerald-500/20 bg-emerald-950/40 text-emerald-200 shadow-[0_8px_30px_rgba(16,185,129,0.15)]",
            t.type === "error" && "border-red-500/20 bg-red-950/40 text-red-200 shadow-[0_8px_30px_rgba(239,68,68,0.15)]",
            (t.type === "info" || !t.type) && "border-blue-500/20 bg-blue-950/40 text-blue-200 shadow-[0_8px_30px_rgba(59,130,246,0.15)]"
          )}
        >
          {t.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />}
          {t.type === "error" && <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />}
          {(t.type === "info" || !t.type) && <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />}
          
          <div className="flex-1">
            {t.title && <div className="font-semibold text-white text-sm">{t.title}</div>}
            <div className="text-xs text-zinc-300">{t.description}</div>
          </div>
          
          <button
            onClick={() => removeToast(t.id)}
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
