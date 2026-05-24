import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const viewport = {
  themeColor: "#0A2D69",
}

export const metadata: Metadata = {
  title: "El Imperio Doña María - Sistema de Ferretería",
  description:
    "Sistema de gestión comercial para la Ferretería El Imperio Doña María. Control de inventario, ventas en mostrador y conciliación financiera.",
  keywords: [
    "ferretería",
    "inventario",
    "sistema de ventas",
    "punto de venta",
    "conciliación bancaria",
    "control de crédito",
    "Cumaná",
    "Venezuela",
  ],
  authors: [{ name: "Práctica Pre-Profesional" }],
  creator: "El Imperio Doña María",
  openGraph: {
    title: "El Imperio Doña María - Sistema de Ferretería",
    description:
      "Sistema de gestión comercial para la Ferretería El Imperio Doña María.",
    locale: "es_VE",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}