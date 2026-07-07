import { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";

interface MultiDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | { name: string; slug: string })[];
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

  // Normalize options to always be { name, slug } objects
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "string") {
      return { name: opt, slug: opt };
    }
    return opt;
  });

  const selectedSlugs = value
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

  const handleToggle = (slug: string) => {
    let newItems;
    if (selectedSlugs.includes(slug)) {
      newItems = selectedSlugs.filter((s) => s !== slug);
    } else {
      newItems = [...selectedSlugs, slug];
    }
    onChange(newItems.join(", "));
  };

  const handleAddOption = async () => {
    const trimmed = search.trim();
    if (!trimmed) return;

    const generatedSlug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    if (!selectedSlugs.includes(generatedSlug)) {
      const newItems = [...selectedSlugs, generatedSlug];
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
        {selectedSlugs.map((slug) => {
          const option = normalizedOptions.find((o) => o.slug === slug);
          const hasDuplicateName = option
            ? normalizedOptions.filter(
                (o) => o.name.toLowerCase() === option.name.toLowerCase(),
              ).length > 1
            : false;
          const displayName = option
            ? hasDuplicateName
              ? `${option.name} (${option.slug})`
              : option.name
            : slug;
          return (
            <span
              key={slug}
              className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded font-medium"
            >
              {displayName}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(slug);
                }}
                className="text-muted-foreground hover:text-foreground rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
        <input
          type="text"
          placeholder={selectedSlugs.length === 0 ? placeholder : ""}
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
            {normalizedOptions.map((option) => {
              const isSelected = selectedSlugs.includes(option.slug);
              const hasDuplicateName =
                normalizedOptions.filter(
                  (o) => o.name.toLowerCase() === option.name.toLowerCase(),
                ).length > 1;

              if (
                search &&
                !option.name.toLowerCase().includes(search.toLowerCase())
              ) {
                return null;
              }

              return (
                <div
                  key={option.slug}
                  onClick={() => handleToggle(option.slug)}
                  className="flex items-center justify-between px-2.5 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                >
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-foreground">
                      {option.name}
                    </span>
                    {hasDuplicateName && (
                      <span className="text-[10px] text-muted-foreground/80 font-mono">
                        {option.slug}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                  )}
                </div>
              );
            })}

            {search.trim() &&
              !normalizedOptions.some(
                (o) => o.name.toLowerCase() === search.trim().toLowerCase(),
              ) && (
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
