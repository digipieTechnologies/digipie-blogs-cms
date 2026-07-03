import * as React from "react";
import { cn } from "@/lib/utils";

interface HoverPopupProps {
  trigger: React.ReactNode;
  items: string[];
  itemClassName?: string;
}

export function HoverPopup({ trigger, items, itemClassName }: HoverPopupProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="cursor-pointer">{trigger}</div>

      {isOpen && items.length > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 min-w-[100px] bg-popover text-popover-foreground border border-border shadow-md rounded-lg p-1.5 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-1 duration-150">
          {items.map((item, index) => (
            <span
              key={index}
              className={cn(
                "px-2 py-0.5 text-xs font-medium rounded hover:bg-muted text-center whitespace-nowrap",
                itemClassName,
              )}
            >
              {item}
            </span>
          ))}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-border" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[4px] border-transparent border-t-popover" />
        </div>
      )}
    </div>
  );
}
