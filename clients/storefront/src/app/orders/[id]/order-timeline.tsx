import { TIMELINE_STATUSES, ORDER_STATUS_CONFIG } from '@/lib/order-utils';

interface OrderTimelineProps {
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
}

const TERMINAL_NEGATIVE = new Set(['CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED']);

export function OrderTimeline({ currentStatus, createdAt, updatedAt }: OrderTimelineProps) {
  const isNegativeTerminal = TERMINAL_NEGATIVE.has(currentStatus);

  // Find the index of the current status in the happy-path timeline
  const currentIdx = TIMELINE_STATUSES.indexOf(currentStatus as (typeof TIMELINE_STATUSES)[number]);

  return (
    <div className="space-y-4">
      {/* Happy-path timeline */}
      <ol className="relative border-l-2 border-neutral-200 pl-6">
        {TIMELINE_STATUSES.map((status, idx) => {
          const cfg = ORDER_STATUS_CONFIG[status];
          const isPast = !isNegativeTerminal && currentIdx >= 0 && idx <= currentIdx;
          const isCurrent = !isNegativeTerminal && idx === currentIdx;

          return (
            <li key={status} className="relative mb-6 last:mb-0">
              {/* Dot */}
              <span
                className={`absolute -left-[calc(1.5rem+5px)] flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-white ${
                  isCurrent ? 'bg-brand-500' : isPast ? 'bg-green-500' : 'bg-neutral-300'
                }`}
              />
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${isPast ? 'text-foreground' : 'text-muted'}`}>
                  {cfg?.label ?? status}
                </p>
                {isCurrent && (
                  <span className="text-xs text-muted">
                    {new Date(updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                )}
                {idx === 0 && !isCurrent && isPast && (
                  <span className="text-xs text-muted">
                    {new Date(createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Terminal negative state banner */}
      {isNegativeTerminal && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">
            {ORDER_STATUS_CONFIG[currentStatus]?.label ?? currentStatus}
          </p>
          <p className="mt-0.5 text-xs text-red-600">
            {new Date(updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  );
}
