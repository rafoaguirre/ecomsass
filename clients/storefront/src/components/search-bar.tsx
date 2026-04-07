'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, type ChangeEvent } from 'react';
import { ShadcnInput } from '@ecomsaas/ui/shadcn';

export function SearchBar({
  defaultValue,
  basePath = '/',
}: {
  defaultValue?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      params.delete('offset');
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    }, 350);
  }

  return (
    <div className="relative w-full max-w-lg">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z"
        />
      </svg>
      <ShadcnInput
        type="search"
        placeholder="Search stores…"
        defaultValue={defaultValue}
        onChange={handleChange}
        className="pl-9"
      />
    </div>
  );
}
