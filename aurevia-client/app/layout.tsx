import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Aurevia by tigo - Luxury Travel Platform",
  description:
    "Discover the world's finest hotels, restaurants, and transportation with Aurevia's comprehensive luxury travel platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Pridi:wght@200;300;400;500;600;700&family=Varela+Round&display=swap" rel="stylesheet"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>
          <NotificationProvider>
            {children}
            <Toaster 
              position="top-right"
              style={{
                marginTop: '6rem',
              }}
              toastOptions={{
                style: {
                  background: '#E2B59A',
                  color: '#4A3B2F',
                  border: '1px solid rgba(183, 116, 102, 0.3)',
                },
                classNames: {
                  error: 'toast-error',
                  success: 'toast-success',
                },
              }}
            />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
