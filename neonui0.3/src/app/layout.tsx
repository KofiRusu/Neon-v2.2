import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '../lib/providers'
import { Toaster } from '../components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NeonHub - AI Marketing Platform | Automate Your Marketing Success',
  description: 'Transform your marketing with AI-powered automation, real-time analytics, and intelligent campaign management. Deploy specialized AI agents, track performance, and scale your campaigns effortlessly.',
  keywords: ['ai marketing', 'marketing automation', 'campaign management', 'digital marketing', 'analytics', 'ai agents', 'marketing platform', 'social media automation', 'email marketing', 'performance tracking'],
  authors: [{ name: 'NeonHub Team' }],
  creator: 'NeonHub',
  publisher: 'NeonHub',
  robots: 'index, follow',
  applicationName: 'NeonHub',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://neonhub.com',
    title: 'NeonHub - AI Marketing Platform | Automate Your Marketing Success',
    description: 'Transform your marketing with AI-powered automation, real-time analytics, and intelligent campaign management. Deploy specialized AI agents and scale your campaigns effortlessly.',
    siteName: 'NeonHub',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NeonHub AI Marketing Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeonHub - AI Marketing Platform',
    description: 'Transform your marketing with AI-powered automation, real-time analytics, and intelligent campaign management.',
    site: '@neonhub',
    creator: '@neonhub',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
  alternates: {
    canonical: 'https://neonhub.com',
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
