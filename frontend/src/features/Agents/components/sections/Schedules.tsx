import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Calendar, 
  Clock, 
  Repeat, 
  Bell, 
  CalendarClock,
  Zap,
  Calendar as CalendarIcon
} from 'lucide-react';

interface SchedulesProps {
  form: UseFormReturn<any>;
}

export default function Schedules({ form }: SchedulesProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Schedules</h2>
          <p className="text-sm text-muted-foreground">
            Set up when and how often your agent should run tasks
          </p>
        </div>
        <Button variant="outline" disabled>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="mb-8 relative">
          {/* Visual calendar representation */}
          <div className="relative">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-accent/30">
              <CalendarIcon className="h-12 w-12 text-muted-foreground/40" />
            </div>
            {/* Floating icons around the calendar */}
            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Repeat className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute inset-0 flex items-center justify-center -z-10">
            <CalendarClock className="h-32 w-32 text-muted-foreground/10" />
          </div>
        </div>

        <h3 className="text-lg font-medium mb-2 text-center">
          Schedule Your Agent's Tasks
        </h3>
        
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          Keep your agent running like clockwork. Set up automated schedules 
          for recurring tasks and time-based operations.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-lg w-full mb-8">
          <div className="p-4 rounded-lg bg-accent/40 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              <span>Time-based</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Run tasks at specific times or intervals
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-accent/40 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Repeat className="h-4 w-4" />
              <span>Recurring</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Set up daily, weekly, or custom patterns
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-accent/40 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bell className="h-4 w-4" />
              <span>Reminders</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Get notified of scheduled executions
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-accent/40 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4" />
              <span>Auto-trigger</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Schedule based on events or conditions
            </p>
          </div>
        </div>

        <Button className="mt-2" disabled>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Your First Schedule
        </Button>
      </div>
    </div>
  );
} 