import { useWorkflow } from './WorkflowContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, CheckCircle2, XCircle, BarChart3, Zap } from "lucide-react";

const WorkflowAnalytics: React.FC = () => {
  const { workflow } = useWorkflow();

  // This would come from an API in real implementation
  const analyticsData = {
    totalRuns: 0,
    averageRunTime: '0s',
    successRate: '0%',
    lastRun: 'Never',
    failedRuns: 0,
    completedRuns: 0
  };

  const stats = [
    {
      title: "Total Runs",
      value: analyticsData.totalRuns,
      icon: Activity,
      description: "Total number of workflow executions",
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "Average Runtime",
      value: analyticsData.averageRunTime,
      icon: Clock,
      description: "Average time to complete workflow",
      color: "text-indigo-500",
      bgColor: "bg-indigo-50"
    },
    {
      title: "Success Rate",
      value: analyticsData.successRate,
      icon: BarChart3,
      description: "Percentage of successful runs",
      color: "text-emerald-500",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Last Run",
      value: analyticsData.lastRun,
      icon: Zap,
      description: "Most recent execution time",
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      title: "Completed Runs",
      value: analyticsData.completedRuns,
      icon: CheckCircle2,
      description: "Number of successful executions",
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      title: "Failed Runs",
      value: analyticsData.failedRuns,
      icon: XCircle,
      description: "Number of failed executions",
      color: "text-red-500",
      bgColor: "bg-red-50"
    }
  ];

  if (!workflow) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Workflow Analytics</h2>
        <p className="text-sm text-gray-500">
          Performance metrics and execution statistics for this workflow
        </p>
      </div>

      {analyticsData.totalRuns === 0 ? (
        <div className="rounded-lg border border-dashed p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No Analytics Available
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-sm">
              Run this workflow to start collecting analytics data. Statistics will appear here after the first execution.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} ${stat.color} p-2 rounded-full`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkflowAnalytics; 