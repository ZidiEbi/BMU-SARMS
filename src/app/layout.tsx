import type { Metadata } from 'next'
import { Inter } from 'next/font/google' // Import a professional font
import './globals.css'

// Configure the font
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'BMU SAMS',
  description: 'Bayelsa Medical University Student & Result Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased`}
        suppressHydrationWarning
      >
        {/* Using bg-slate-50 instead of bg-background gives 
          that subtle "dashboard" feel where the white cards 
          actually stand out from the background.
        */}
        {children}
      </body>
    </html>
  )
}