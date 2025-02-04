import React, { useEffect, useRef } from "react";
import { Textarea } from "./textarea";
import { cn } from "@/lib/utils";

interface CustomTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoGrow?: boolean;
  minHeight?: number;
}

const CTextarea = React.forwardRef<HTMLTextAreaElement, CustomTextareaProps>(
  ({ className, autoGrow = false, minHeight = 70, value, onChange, onInput, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const autoResize = (element: HTMLTextAreaElement) => {
      if (!autoGrow) return;
      element.style.height = 'auto';
      element.style.height = `${Math.max(element.scrollHeight, minHeight)}px`;
    };

    // Handle initial height and value changes
    useEffect(() => {
      if (textareaRef.current) {
        autoResize(textareaRef.current);
      }
    }, [value, autoGrow, minHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e);
      }
      if (autoGrow && textareaRef.current) {
        autoResize(textareaRef.current);
      }
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (onInput) {
        onInput(e);
      }
      if (autoGrow && textareaRef.current) {
        autoResize(textareaRef.current);
      }
    };

    return (
      <Textarea
        ref={(element) => {
          // Handle both refs
          textareaRef.current = element;
          if (typeof ref === 'function') {
            ref(element);
          } else if (ref) {
            ref.current = element;
          }
        }}
        className={cn(
          autoGrow && "resize-none",
          className
        )}
        style={{
          minHeight: minHeight ? `${minHeight}px` : undefined,
          ...props.style
        }}
        value={value}
        onChange={handleChange}
        onInput={handleInput}
        {...props}
      />
    );
  }
);

CTextarea.displayName = "CTextarea";

export { CTextarea }; 