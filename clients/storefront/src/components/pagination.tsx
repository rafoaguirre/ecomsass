import Link from 'next/link';

interface PaginationProps {
  basePath: string;
  q?: string;
  storeType?: string;
  offset: number;
  hasMore: boolean;
  pageSize?: number;
}

function buildHref(basePath: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  basePath,
  q,
  storeType,
  offset,
  hasMore,
  pageSize = 20,
}: PaginationProps) {
  if (!hasMore && offset <= 0) return null;

  const shared: Record<string, string> = {};
  if (q) shared.q = q;
  if (storeType) shared.storeType = storeType;

  return (
    <div className="mt-10 flex items-center justify-center gap-4">
      {offset > 0 && (
        <Link
          href={buildHref(basePath, { ...shared, offset: String(Math.max(0, offset - pageSize)) })}
          className="rounded-[--radius-md] border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-neutral-50"
        >
          &larr; Previous
        </Link>
      )}
      {hasMore && (
        <Link
          href={buildHref(basePath, { ...shared, offset: String(offset + pageSize) })}
          className="rounded-[--radius-md] border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-neutral-50"
        >
          Next &rarr;
        </Link>
      )}
    </div>
  );
}
