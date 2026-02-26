"use client"

import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import * as React from "react"

const Accordion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { type?: "single" | "multiple", collapsible?: boolean }
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("border-b", className)} {...props} />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false) // Simplified for now, real accordion needs context

  return (
    <div className="flex">
      <button
        ref={ref}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className
        )}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
    </div>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  // Simplified: relies on parent state or just renders.
  // Wait, for LocalizedInput I need it to actually Toggle.
  // My simplified Trigger above has local state but doesn't control Content.
  // I need a context or simple prop.

  // Let's rewrite to use a simple context for this file since I can't easily use Radix primitives if they aren't installed.
  // Actually, for the specific use case in LocalizedInput, I can just use a simple collapsible div controlled by the Trigger's state if I structure it right,
  // OR I can build a proper Context.

  <div
    ref={ref}
    className={cn(
      "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className
    )}
    {...props}
  >
    <div className="pb-4 pt-0">{children}</div>
  </div>
))
AccordionContent.displayName = "AccordionContent"

// Re-implementing with Context for proper coordination
const AccordionContext = React.createContext<{
  openItems: string[];
  toggleItem: (value: string) => void;
}>({ openItems: [], toggleItem: () => {} });

const AccordionRoot = ({ type, collapsible, className, children }: any) => {
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const toggleItem = (value: string) => {
    setOpenItems(prev => {
      if (type === 'single') {
         if (prev.includes(value)) return collapsible ? [] : [value];
         return [value];
      }
      return prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value];
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  );
};

const AccordionItemWithContext = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => (
   <div ref={ref} className={cn("border-b", className)} data-value={value} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { value });
        }
        return child;
      })}
   </div>
))
AccordionItemWithContext.displayName = "AccordionItem"


const AccordionTriggerWithContext = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string }
>(({ className, children, value, ...props }, ref) => {
  const { openItems, toggleItem } = React.useContext(AccordionContext);
  const isOpen = value ? openItems.includes(value) : false;

  return (
      <div className="flex">
        <button
          ref={ref}
          onClick={() => value && toggleItem(value)}
          className={cn(
            "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
            className
          )}
          type="button"
          {...props}
        >
          {children}
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
        </button>
      </div>
  )
})
AccordionTriggerWithContext.displayName = "AccordionTrigger"


const AccordionContentWithContext = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string }
>(({ className, children, value, ...props }, ref) => {
  const { openItems } = React.useContext(AccordionContext);
  const isOpen = value ? openItems.includes(value) : false;

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all",
        className
      )}
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </div>
  )
})
AccordionContentWithContext.displayName = "AccordionContent"

export { AccordionRoot as Accordion, AccordionContentWithContext as AccordionContent, AccordionItemWithContext as AccordionItem, AccordionTriggerWithContext as AccordionTrigger }
