import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
})

export const metadata: Metadata = {
  title: {
    default: "ستیا - مدیریت خانه بازی",
    template: "%s | ستیا"
  },
  description: "سیستم مدیریت خانه بازی ستیا - مدیریت مشتریان، خدمات و جلسات",
  keywords: ["خانه بازی", "مدیریت", "ستیا", "gaming house", "management"],
  authors: [{ name: "Setia Gaming House" }],
  creator: "Setia Gaming House",
  publisher: "Setia Gaming House",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"),
  openGraph: {
    title: "ستیا - مدیریت خانه بازی",
    description: "سیستم مدیریت خانه بازی ستیا",
    type: "website",
    locale: "fa_IR",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
