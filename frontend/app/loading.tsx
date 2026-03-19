import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Hero Skeleton */}
      <Skeleton className="h-[300px] md:h-[500px] w-full" />

      {/* Features Skeleton */}
      <section className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-8 border rounded-lg bg-card shadow-sm">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-3 p-4 border-r last:border-r-0"
            >
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section Skeleton */}
      {[1, 2, 3].map((section) => (
        <div key={section} className="container space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
