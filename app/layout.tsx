import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../app/styles/globals.css"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
<html lang="es" suppressHydrationWarning></html>
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "INVEX - Sistema de Inventario",
  description: "Sistema completo de gestión de inventario para productos tecnológicos",
  keywords: ["inventario", "gestión", "productos", "descartables", "facturación", "stock", "ovidio"],
  authors: [{ name: "JN SOFT" }],
  creator: "JN SOFT",
  publisher: "JN SOFT",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "INVEX - Sistema de Inventario",
    description: "Sistema completo de gestión de inventario para productos descartables",
    type: "website",
    locale: "es_ES",
    siteName: "INVEX",
  },
  twitter: {
    card: "summary_large_image",
    title: "INVEX - Sistema de Inventario",
    description: "Sistema completo de gestión de inventario para productos descartables",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  generator: 'Next.js',
  applicationName: 'INVEX', 
  referrer: 'origin-when-cross-origin',
  category: 'business',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="es" 
      suppressHydrationWarning 
      className={`${inter.variable} scroll-smooth`}
    >
      <head>
        {/* Preconnect para mejorar performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Viewport optimizado para móviles */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        
        {/* Theme color para navegadores móviles */}
        <meta name="theme-color" content="#1d4ed8" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1e40af" media="(prefers-color-scheme: dark)" />
        
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Prevenir zoom en inputs en iOS */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body 
        className={`
          ${inter.className} 
          min-h-screen 
          bg-background 
          font-sans 
          antialiased 
          transition-colors 
          duration-300
          overflow-x-hidden
        `}
      >
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem 
          disableTransitionOnChange={false}
          storageKey="electroluxstore-theme"
        >
          {/* Skip to main content para accesibilidad */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Saltar al contenido principal
          </a>
          
          {/* Layout simplificado sin Header */}
          <div className="min-h-screen">
            {/* Contenido principal que incluye el Dashboard con su propio Header */}
            <main 
              id="main-content"
              className="min-h-screen"
              role="main"
              aria-label="Contenido principal"
            >
              {children}
            </main>
          </div>
          
          {/* Toaster con posición responsive */}
          <Toaster />
          
          {/* Loading indicator global */}
          <div 
            id="global-loading" 
            className="
              fixed 
              top-0 
              left-0 
              w-full 
              h-1 
              bg-blue-600 
              transform 
              scale-x-0 
              origin-left 
              transition-transform 
              duration-300 
              z-50
              hidden
            " 
          />
        </ThemeProvider>
        
        {/* Script para mejorar la experiencia de carga */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevenir FOUC (Flash of Unstyled Content)
              document.documentElement.style.visibility = 'visible';
              
              // Smooth scroll polyfill para navegadores antiguos
              if (!('scrollBehavior' in document.documentElement.style)) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/gh/iamdustan/smoothscroll@master/dist/smoothscroll.min.js';
                document.head.appendChild(script);
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
