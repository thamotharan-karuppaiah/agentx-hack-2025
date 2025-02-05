import { formatDistanceToNow } from 'date-fns';

interface TaskHeaderProps {
  title: string;
  triggeredBy: string;
  timestamp: string;
  content?: string;
}

export function TaskHeader({ title, triggeredBy, timestamp, content }: TaskHeaderProps) {
  return (
    <div className="flex flex-col rounded-md bg-background-primary child-glow-target elevation-bulge">
      <div className="flex flex-col">
        <div className="p-px">
          <div className="flex items-start py-3 px-4 bg-background-secondary rounded-t-md">
            <div className="flex items-start space-x-2 w-full">
              <div className="flex flex-col w-full">
                <div className="flex items-center space-x-1">
                  <span className="text text-muted-foreground text-xs">Triggered by</span>
                  <span className="text text-muted-foreground text-xs">{triggeredBy}</span>
                </div>
                <div className="w-full break-all">
                  <span className="text text-primary text-md font-bold">{title}</span>
                </div>
              </div>
            </div>
            <span className="text text-muted-foreground text-xs ml-auto shrink-0">
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </span>
          </div>
        </div>
        {content && (
          <div className="flex flex-col w-full p-4">
            <div className="prose prose-sm prose-indigo prose-li:marker:text-current inline">
              <p>{content}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 