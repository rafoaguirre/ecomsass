import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EcomSaaS Vendor Dashboard',
  description: 'Multi-vendor e-commerce vendor management dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
