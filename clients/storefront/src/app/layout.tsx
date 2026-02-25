import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EcomSaaS Storefront',
  description: 'Multi-vendor e-commerce storefront',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
