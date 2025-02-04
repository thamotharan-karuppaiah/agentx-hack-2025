import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { workflowHistoryService, type HistoryEntry } from './services/workflowHistoryService';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO } from 'date-fns';

const timeRanges = [
  { label: '2h', value: '2h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: 'All Time', value: 'all' },
] as const;

interface Column {
  id: string;
  label: string;
  required: boolean;
  type: 'system' | 'input';
}

const WorkflowHistory: React.FC = () => {
  const { workflowId } = useParams();
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');
  const [selectedStatus, setSelectedStatus] = useState<string>('any');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<Column[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadColumns();
  }, []);

  useEffect(() => {
    if (workflowId) {
      loadHistory();
    }
  }, [workflowId, selectedTimeRange, selectedStatus, currentPage]);

  const loadColumns = async () => {
    if (!workflowId) return;
    const columns = await workflowHistoryService.getAvailableColumns(workflowId);
    setAvailableColumns(columns);
    setSelectedColumns(columns.filter(col => col.type === 'system').map(col => col.id));
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await workflowHistoryService.fetchHistory({
        workflowId: workflowId!,
        timeRange: selectedTimeRange,
        status: selectedStatus,
        page: currentPage,
        pageSize: 10
      });
      setHistory(response.data);
      setTotalRecords(response.pagination.totalRecords);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: HistoryEntry['status']) => {
    const styles = {
      running: "bg-blue-100 text-blue-700",
      review_needed: "bg-yellow-100 text-yellow-700",
      cancelled: "bg-gray-100 text-gray-700",
      success: "bg-green-100 text-green-700",
    };

    const labels = {
      running: "Running",
      review_needed: "Review needed",
      cancelled: "Cancelled",
      success: "Success",
    };

    return (
      <span className={cn("px-2 py-1 text-xs rounded-md", styles[status])}>
        {labels[status]}
      </span>
    );
  };

  const toggleColumn = (columnId: string) => {
    setSelectedColumns(current => {
      const column = availableColumns.find(col => col.id === columnId);
      if (!column) return current;
      
      if (column.required) return current;
      
      return current.includes(columnId)
        ? current.filter(id => id !== columnId)
        : [...current, columnId];
    });
  };

  const renderColumnValue = (entry: HistoryEntry, columnId: string) => {
    switch (columnId) {
      case 'status':
        return getStatusBadge(entry.status);
      case 'createdAt':
        return format(parseISO(entry.createdAt), 'MM/dd/yy at h:mm a');
      case 'runtime':
        return entry.runtime || '-';
      case 'tasks':
        return entry.tasks;
      case 'source':
        return entry.source;
      default:
        // Handle input columns
        return entry.inputs[columnId] || '-';
    }
  };

  return (
    <div className="p-8">
      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-8">
          {/* Status Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-500">
              Status
            </label>
            <Select 
              value={selectedStatus} 
              onValueChange={setSelectedStatus}
              disabled={loading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="review_needed">Review needed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Columns Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-500">
              Columns
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[180px]">
                  ({selectedColumns.length} shown)
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>System Columns</DropdownMenuLabel>
                {availableColumns
                  .filter(col => col.type === 'system')
                  .map(column => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={() => toggleColumn(column.id)}
                      disabled={column.required}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Input Columns</DropdownMenuLabel>
                {availableColumns
                  .filter(col => col.type === 'input')
                  .map(column => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={() => toggleColumn(column.id)}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Time Range Buttons */}
        <div className="flex rounded-md shadow-sm">
          {timeRanges.map(({ label, value }) => (
            <Button
              key={value}
              variant="outline"
              size="sm"
              onClick={() => setSelectedTimeRange(value)}
              disabled={loading}
              className={cn(
                "px-3 py-2 first:rounded-l-md first:border-r-0 last:rounded-r-md last:border-l-0 rounded-none",
                selectedTimeRange === value && "bg-gray-100 border-gray-200",
                "hover:bg-gray-50"
              )}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              {selectedColumns.map(columnId => {
                const column = availableColumns.find(col => col.id === columnId);
                return column ? (
                  <th key={columnId} className="text-left p-4 text-sm font-medium text-gray-500">
                    {column.label}
                  </th>
                ) : null;
              })}
              <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={selectedColumns.length + 1} className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading history...
                  </div>
                </td>
              </tr>
            ) : (
              history.map(entry => (
                <tr key={entry.id} className="border-b">
                  {selectedColumns.map(columnId => (
                    <td key={columnId} className="p-4 text-sm">
                      {renderColumnValue(entry, columnId)}
                    </td>
                  ))}
                  <td className="p-4">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Records count */}
      <div className="mt-4 text-sm text-gray-500 text-right">
        ({totalRecords} records)
      </div>
    </div>
  );
};

export default WorkflowHistory; 