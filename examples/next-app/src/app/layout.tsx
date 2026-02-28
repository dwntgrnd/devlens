import type { Metadata } from 'next';
import { DevLens } from 'devlens';
import { devlensConfig } from '../devlens.config';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevLens Example',
  description: 'Example Next.js app with DevLens integration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* DevLens — with project-specific config */}
        {process.env.NODE_ENV === 'development' && (
          <DevLens {...devlensConfig} />
        )}
      </body>
    </html>
  );
}
