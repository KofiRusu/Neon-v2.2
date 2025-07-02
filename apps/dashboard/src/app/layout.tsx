'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { api } from '../utils/trpc';
import CopilotWidget from '../components/CopilotWidget';
import { useEffect, useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render tRPC provider until client-side is mounted
  if (!mounted) {
    return (
      <html lang="en">
        <head>
          <title>NeonHub Dashboard</title>
          <meta name="description" content="AI-powered marketing automation platform" />
        </head>
        <body className={inter.className}>
          <div className="min-h-screen bg-dark text-white">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading NeonHub Dashboard...</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>NeonHub Dashboard</title>
        <meta name="description" content="AI-powered marketing automation platform" />
      </head>
      <body className={inter.className}>
        <api.Provider>
          {children}
          <CopilotWidget
            initialPosition="bottom-right"
            enableVoice={true}
            enableDrag={true}
            persistState={true}
          />
        </api.Provider>
      </body>
    </html>
  );
}
