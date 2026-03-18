import type { Metadata } from "next"
import { DM_Sans, DM_Mono } from "next/font/google"
import "./globals.css"
import Nav from "@/components/Nav"
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" })
const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono"
})

export const metadata: Metadata = {
  title: "json-schema observatory",
  description: "tracking the json-schema ecosystem over time",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}