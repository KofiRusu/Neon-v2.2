import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '../lib/providers'
import { Toaster } from '../components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NeonHub - AI Marketing Platform',
  description: 'Advanced AI-powered marketing automation and campaign management platform',
  keywords: ['ai', 'marketing', 'automation', 'campaigns', 'analytics'],
  authors: [{ name: 'NeonHub Team' }],
  creator: 'NeonHub',
  publisher: 'NeonHub',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    title: 'NeonHub - AI Marketing Platform',
    description: 'Advanced AI-powered marketing automation and campaign management platform',
    siteName: 'NeonHub',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeonHub - AI Marketing Platform',
    description: 'Advanced AI-powered marketing automation and campaign management platform',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
