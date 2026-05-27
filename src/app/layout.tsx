import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoastMySite AI - Get Your Website Roasted by AI",
  description: "Instant AI-powered UI, SEO, speed, and accessibility audits. Get brutally honest feedback about your website in seconds.",
  keywords: ["website analysis", "AI roast", "SEO audit", "UI/UX review", "accessibility audit", "performance check"],
  authors: [{ name: "RoastMySite AI" }],
  icons: {
    icon: "/favicon-logo.png",
  },
  openGraph: {
    title: "RoastMySite AI - Get Your Website Roasted by AI",
    description: "Instant AI-powered website analysis with hilarious roasts",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RoastMySite AI",
    description: "Get your website roasted by AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground overflow-x-hidden`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
