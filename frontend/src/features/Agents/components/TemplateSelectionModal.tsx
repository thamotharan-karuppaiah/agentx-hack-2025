import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { categories, templates } from '../data/agentTemplates';
import { cn } from "@/lib/utils";

interface TemplateSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (templateId: string) => void;
}

export const TemplateSelectionModal = ({
  open,
  onOpenChange,
  onTemplateSelect,
}: TemplateSelectionModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.categories.includes(selectedCategory);
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Browse Starter Agents</DialogTitle>
        </DialogHeader>
        <div className="flex gap-6 h-[600px]">
          {/* Left Sidebar */}
          <div className="w-64 border-r pr-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 w-full px-4 py-2 rounded-md text-sm transition-colors",
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <span>{category.icon}</span>
                <span>{category.title}</span>
              </button>
            ))}
          </div>

          {/* Right Content */}
          <div className="flex-1 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-2 gap-4 overflow-y-auto h-[500px] pr-4">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => onTemplateSelect(template.id)}
                  className="flex flex-col p-4 border rounded-lg text-left hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {template.icon && <span>{template.icon}</span>}
                    <h3 className="font-medium">{template.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 