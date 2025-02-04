import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type Option = {
  label: string;
  value: string;
};

interface CMultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  maxSelected?: number;
}

export function CMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  className,
  error,
  disabled,
  maxSelected = Infinity,
}: CMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLDivElement>(null);

  const handleUnselect = (value: string) => {
    if (disabled) return;
    onChange(selected.filter((item) => item !== value));
  };

  return (
    <Popover 
      open={disabled ? false : open} 
      onOpenChange={disabled ? undefined : setOpen}
    >
      <PopoverTrigger asChild>
        <div
          ref={inputRef}
          className={cn(
            "flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            error && "border-destructive",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          onClick={() => !disabled && setOpen(true)}
          aria-disabled={disabled}
        >
          <div className="flex flex-wrap gap-1">
            {selected.map((value) => {
              const option = options.find((opt) => opt.value === value);
              return option ? (
                <span
                  key={value}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-0.5 text-xs text-white",
                    disabled && "opacity-50"
                  )}
                >
                  {option.label}
                  {!disabled && (
                    <button
                      type="button"
                      className="text-white hover:text-white/70"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnselect(value);
                      }}
                      disabled={disabled}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ) : null;
            })}
            {selected.length === 0 && (
              <span className={cn(
                "text-muted-foreground",
                disabled && "opacity-50"
              )}>
                {placeholder}
              </span>
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search..." 
            className="h-9"
            disabled={disabled}
          />
          <CommandEmpty>No option found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            <CommandList>
              {options && options
                .filter(option => !selected?.includes(option.value))
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (disabled) return;
                      if (selected && selected.length < maxSelected) {
                        onChange([...selected, option.value]);
                      }
                      if (selected && selected.length + 1 >= maxSelected) {
                        setOpen(false);
                      }
                    }}
                    disabled={disabled || (selected && selected.length >= maxSelected)}
                  >
                    {option.label}
                  </CommandItem>
                ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 