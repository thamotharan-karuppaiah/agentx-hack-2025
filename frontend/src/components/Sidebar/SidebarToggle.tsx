import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar();

  return (
    <div    
      onClick={toggleSidebar}
      className="absolute -right-1 top-8 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
    >
      <div className="flex h-5 w-5 items-center justify-center rounded-full border bg-background shadow-sm text-sidebar-primary">
        {state === 'collapsed' ? (
          <ChevronRight className="h-3 w-3 transition-transform duration-200" />
        ) : (
          <ChevronLeft className="h-3 w-3 transition-transform duration-200" />
        )}
      </div>
    </div>
  );
} 