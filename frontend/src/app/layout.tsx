import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

// Separate viewport export (Next.js 14 requirement)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Onflix - Stream Movies & TV Shows",
    template: "%s | Onflix",
  },
  description:
    "Watch unlimited movies, TV shows, and more with Onflix streaming service.",
  keywords: [
    "streaming",
    "movies",
    "tv shows",
    "entertainment",
    "video on demand",
    "netflix",
    "onflix",
  ],
  authors: [{ name: "Onflix Team" }],
  creator: "Onflix",
  publisher: "Onflix",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Onflix - Stream Movies & TV Shows",
    description:
      "Watch unlimited movies, TV shows, and more with Onflix streaming service.",
    type: "website",
    url: "/",
    siteName: "Onflix",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Onflix - Stream Movies & TV Shows",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Onflix - Stream Movies & TV Shows",
    description:
      "Watch unlimited movies, TV shows, and more with Onflix streaming service.",
    creator: "@onflix",
    images: ["/og-image.jpg"],
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
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
        {/* Analytics */}
        {process.env.NODE_ENV === "production" && (
          <script
            defer
            data-domain="onflix.com"
            src="https://plausible.io/js/script.js"
          />
        )}
      </body>
    </html>
  );
}
