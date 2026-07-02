import { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";

interface MultiDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  onAddOption?: (option: string) => void | Promise<void>;
  addOptionLabel?: string;
}

export function MultiDropdown({
  value,
  onChange,
  options,
  placeholder = "Select options...",
  onAddOption,
  addOptionLabel = "Add",
}: MultiDropdownProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItems = value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (item: string) => {
    let newItems;
    if (selectedItems.includes(item)) {
      newItems = selectedItems.filter((i) => i !== item);
    } else {
      newItems = [...selectedItems, item];
    }
    onChange(newItems.join(", "));
  };

  const handleAddOption = async () => {
    const trimmed = search.trim();
    if (!trimmed) return;

    if (!selectedItems.includes(trimmed)) {
      const newItems = [...selectedItems, trimmed];
      onChange(newItems.join(", "));
      if (onAddOption) {
        await onAddOption(trimmed);
      }
    }
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input / Badge Container */}
      <div
        onClick={() => setIsOpen(true)}
        className="flex flex-wrap gap-1.5 p-2 rounded-md border border-input bg-background min-h-[40px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-pointer transition-all"
      >
        {selectedItems.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded font-medium"
          >
            {item}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(item);
              }}
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder={selectedItems.length === 0 ? placeholder : ""}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddOption();
            }
          }}
          className="flex-1 bg-transparent border-none outline-none text-sm min-w-[120px] h-6 p-0 focus:ring-0"
        />
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-popover p-1 shadow-xl text-popover-foreground">
          <div className="py-1">
            {options.map((option) => {
              const isSelected = selectedItems.includes(option);

              if (search && !option.toLowerCase().includes(search.toLowerCase())) {
                return null;
              }

              return (
                <div
                  key={option}
                  onClick={() => handleToggle(option)}
                  className="flex items-center justify-between px-2.5 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                >
                  <span>{option}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              );
            })}

            {search.trim() &&
              !options.some((o) => o.toLowerCase() === search.trim().toLowerCase()) && (
                <div
                  onClick={handleAddOption}
                  className="px-2.5 py-1.5 text-sm text-primary hover:bg-accent rounded-sm cursor-pointer transition-colors font-medium"
                >
                  {addOptionLabel} "{search.trim()}"
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
