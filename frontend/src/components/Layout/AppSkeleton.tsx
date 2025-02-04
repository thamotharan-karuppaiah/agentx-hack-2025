import { Skeleton } from "@/components/ui/skeleton";

const AppSkeleton = () => {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-sidebar p-6 flex flex-col">
        {/* Workspace Switcher Skeleton */}
        <div className="flex items-center space-x-2 mb-8">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Navigation Items Skeleton */}
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        {/* Bottom User Profile Skeleton */}
        <div className="mt-auto pt-6">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1">
        {/* Header Section */}
        <div className="border-b">
          <div className="p-8 pb-6">
            <Skeleton className="h-7 w-48" />
          </div>
        </div>

       
      </div>
    </div>
  );
};

export default AppSkeleton; 