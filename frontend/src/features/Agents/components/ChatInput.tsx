import { Button } from "@/components/ui/button";
import { CTextarea } from "@/components/ui/c-textarea";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, SendHorizontal } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, placeholder = "Leave comment for my agent", disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    onSubmit(input);
    setInput("");
  };

  return (
    <div className="sticky z-40 w-full px-1 py-4 bg-gradient-to-t from-white via-white via-90% to-transparent -bottom-8 max-w-[760px] mx-auto">
      <div className="relative mx-2">
        <form className="flex items-center gap-4 w-full" onSubmit={handleSubmit}>
          <div className="flex items-center w-full relative transition-colors rounded-sm focus-within:ring-1 focus-within:ring-border-default bg-background-primary border border-solid border-border-default shadow-sm">

            <CTextarea
              autoGrow
              minHeight={30}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-0 box-shadow focus-visible:ring-0 resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              disabled={disabled}
            />

            <Button
              type="submit"
              size="icon"
              className="shrink-0 mr-3"
              disabled={disabled || !input.trim()}
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 