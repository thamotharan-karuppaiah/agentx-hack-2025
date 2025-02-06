import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  BookOpen,
  Database,
  FileText,
  Link,
  Brain,
  Upload,
  Search,
  MessageSquareText
} from 'lucide-react';

interface KnowledgeBaseProps {
  form: UseFormReturn<any>;
}

export default function KnowledgeBase({ form }: KnowledgeBaseProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Knowledge Base</h2>
          <p className="text-sm text-muted-foreground">
            Add documents and data sources to power your agent's responses
          </p>
        </div>
        <Button variant="outline" disabled>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="mb-8 relative">
          {/* Central brain icon with floating knowledge sources */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-accent/30">
              <Brain className="h-12 w-12 text-muted-foreground/40" />
            </div>
            {/* Floating source icons */}
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center">
              <Database className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center">
              <Link className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="absolute -top-2 -left-2 w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          {/* Connection lines */}
          <div className="absolute inset-0 flex items-center justify-center -z-10">
            <div className="w-40 h-40 rounded-full border-2 border-dashed border-muted-foreground/10" />
          </div>
        </div>

        <h3 className="text-lg font-medium mb-2 text-center">
          Build Your Agent's Knowledge
        </h3>
        
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          Enhance your agent's capabilities by providing it with relevant information sources.
          Upload documents, connect databases, or add web references.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-lg w-full mb-8">
          <div className="p-4 rounded-lg bg-accent/40 space-y-2 group cursor-not-allowed">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Upload className="h-4 w-4" />
              <span>Document Upload</span>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, TXT files for context
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-accent/40 space-y-2 group cursor-not-allowed">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link className="h-4 w-4" />
              <span>Web Sources</span>
            </div>
            <p className="text-xs text-muted-foreground">
              URLs, APIs, and web scraping
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-accent/40 space-y-2 group cursor-not-allowed">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Database className="h-4 w-4" />
              <span>Databases</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Connect to SQL or NoSQL databases
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-accent/40 space-y-2 group cursor-not-allowed">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquareText className="h-4 w-4" />
              <span>Custom Input</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Direct text or structured data
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button className="w-full" disabled>
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
          <p className="text-xs text-muted-foreground">
            or drag and drop files here
          </p>
        </div>
      </div>
    </div>
  );
} 