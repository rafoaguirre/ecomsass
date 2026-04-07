import Link from 'next/link';
import { Logo } from '@/components/logo';

export function Footer() {
  return (
    <footer className="border-t border-border bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted">
              Multi-vendor marketplace connecting customers with amazing stores.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Marketplace</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted hover:text-foreground">
                  Browse Stores
                </Link>
              </li>
              <li>
                <Link href="/stores" className="text-sm text-muted hover:text-foreground">
                  All Stores
                </Link>
              </li>
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">For Vendors</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href={process.env.NEXT_PUBLIC_VENDOR_URL ?? 'http://localhost:3002'}
                  className="text-sm text-muted hover:text-foreground"
                >
                  Vendor Dashboard
                </a>
              </li>
              <li>
                <a
                  href={`${process.env.NEXT_PUBLIC_VENDOR_URL ?? 'http://localhost:3002'}/register`}
                  className="text-sm text-muted hover:text-foreground"
                >
                  Become a Vendor
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-muted">Privacy Policy</span>
              </li>
              <li>
                <span className="text-sm text-muted">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted">
          &copy; {new Date().getFullYear()} EcomSaaS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
