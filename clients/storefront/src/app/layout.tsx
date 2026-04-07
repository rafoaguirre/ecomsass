import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/lib/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'EcomSaaS Storefront',
  description: 'Multi-vendor e-commerce storefront',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
