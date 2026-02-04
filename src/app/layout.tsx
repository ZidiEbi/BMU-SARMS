import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-background text-foreground"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}
