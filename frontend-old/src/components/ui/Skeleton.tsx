import React from 'react';

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return <div className={`skeleton-shimmer rounded ${className}`} />;
};

export const CardSkeleton: React.FC = () => (
  <div className="card-enterprise p-6 space-y-4">
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <div className="grid grid-cols-3 gap-4 pt-2">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="card-enterprise overflow-hidden">
    <div className="p-4 border-b border-slate-200 flex justify-between">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-5 w-24" />
    </div>
    <div className="divide-y divide-slate-100 p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  </div>
);
