"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

interface AccordionTriggerProps {
  className?: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onClick?: () => void;
}

interface AccordionContentProps {
  className?: string;
  children: React.ReactNode;
  isOpen?: boolean;
}

export const AccordionContext = React.createContext<{
  openItems: string[];
  toggleItem: (value: string) => void;
}>({
  openItems: [],
  toggleItem: () => {},
});

export function Accordion({
  children,
  className,
  type = "single",
  defaultValue,
}: {
  children: React.ReactNode;
  className?: string;
  type?: "single" | "multiple";
  defaultValue?: string | string[];
}) {
  const [openItems, setOpenItems] = React.useState<string[]>(() => {
    if (!defaultValue) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  const toggleItem = React.useCallback(
    (value: string) => {
      setOpenItems((prev) => {
        if (type === "single") {
          return prev.includes(value) ? [] : [value];
        } else {
          return prev.includes(value)
            ? prev.filter((item) => item !== value)
            : [...prev, value];
        }
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn("space-y-3", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ value, className, children }: AccordionItemProps) {
  const { openItems, toggleItem } = React.useContext(AccordionContext);
  const isOpen = openItems.includes(value);

  return (
    <div
      className={cn(
        "rounded-2xl glass-2 glass-reflect overflow-hidden transition-all duration-350",
        isOpen && "shadow-[0_12px_40px_rgba(0,0,0,0.35),0_0_30px_rgba(98,92,255,0.04)]",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            // @ts-ignore
            isOpen,
            onClick: () => toggleItem(value),
          });
        }
        return child;
      })}
    </div>
  );
}

export function AccordionTrigger({
  className,
  children,
  isOpen,
  onClick,
}: AccordionTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-zinc-200 hover:text-white transition-all duration-250 hover:bg-white/3 cursor-pointer",
        isOpen && "bg-white/2",
        className
      )}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 text-zinc-500 transition-all duration-300 ease-out shrink-0",
          isOpen && "rotate-180 text-zinc-200"
        )}
      />
    </button>
  );
}

export function AccordionContent({
  className,
  children,
  isOpen,
}: AccordionContentProps) {
  return (
    <div
      className={cn(
        "transition-all duration-350 ease-out overflow-hidden",
        isOpen
          ? "max-h-[5000px] opacity-100 p-5 border-t border-white/5 bg-white/1"
          : "max-h-0 opacity-0 p-0 pointer-events-none"
      )}
    >
      <div className={className}>{children}</div>
    </div>
  );
}
