import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Regalia | AI-Powered Custom Apparel",
  description:
    "Create custom apparel with AI. Generate designs, coordinate group orders, and get high-quality print-on-demand fulfillment. Perfect for teams, businesses, and events.",
  keywords: [
    "custom apparel",
    "AI design",
    "group orders",
    "print on demand",
    "custom t-shirts",
    "team merchandise",
    "DALL-E 3",
  ],
  authors: [{ name: "Regalia" }],
  creator: "Regalia",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://regalia.com",
    siteName: "Regalia",
    title: "Regalia | AI-Powered Custom Apparel",
    description:
      "Create custom apparel with AI. Generate designs, coordinate group orders, and get high-quality print-on-demand fulfillment.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Regalia - AI-Powered Custom Apparel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Regalia | AI-Powered Custom Apparel",
    description:
      "Create custom apparel with AI. Generate designs, coordinate group orders, and get high-quality print-on-demand fulfillment.",
    images: ["/og-image.png"],
    creator: "@regalia",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/design/create"
      signUpFallbackRedirectUrl="/design/create"
    >
      <html lang="en" className="scroll-smooth">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Navbar />
          <main>{children}</main>
          <ConditionalFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
