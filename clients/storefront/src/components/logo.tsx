import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
        E
      </div>
      <span className="font-display text-lg font-bold text-foreground">EcomSaaS</span>
    </Link>
  );
}
