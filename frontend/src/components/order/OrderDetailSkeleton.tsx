import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

export default function OrderDetailSkeleton() {
  return (
    <div className="container-custom py-8 md:py-12">
      {/* Header */}
      <div className="mb-8 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-10 md:h-14 w-72" />
        <Skeleton className="h-3 w-48" />
      </div>

      <Separator className="mb-8" />

      {/* Timeline */}
      <div className="mb-10 flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3 rounded-none" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>

      <Separator className="mb-8" />

      {/* 2-col content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-6">
              <Skeleton className="w-24 h-32 rounded-none" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
