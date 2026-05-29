import type { Metadata } from 'next'
import { DM_Serif_Display, DM_Mono, Instrument_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Scalable Engineer Academy',
    template: '%s — Scalable Engineer Academy',
  },
  description:
    'Go from writing code to designing systems. The interactive engineering gym for developers who want to think like senior engineers.',
  openGraph: {
    title: 'Scalable Engineer Academy',
    description: 'Interactive system design learning platform.',
    url: 'https://scalableengineer.academy',
    siteName: 'Scalable Engineer Academy',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scalable Engineer Academy',
    description: 'Interactive system design learning platform.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${dmSerif.variable} ${dmMono.variable} ${instrumentSans.variable}`}
    >
      <body className="bg-paper text-ink font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0e0e0c',
              color: '#f5f3ed',
              border: '1px solid #3a3a35',
              borderRadius: '3px',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  )
}
