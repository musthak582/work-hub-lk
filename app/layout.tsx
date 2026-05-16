import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: "WorkHub LK — Find Local Skilled Workers in Sri Lanka",
    template: "%s | WorkHub LK",
  },
  description:
    "Connect with trusted electricians, plumbers, carpenters, painters, AC technicians, tutors and more across Sri Lanka. Hire skilled workers instantly.",
  keywords: [
    "skilled workers Sri Lanka",
    "electrician Colombo",
    "plumber Sri Lanka",
    "carpenter hire",
    "AC repair Sri Lanka",
    "tutor Sri Lanka",
    "local services Sri Lanka",
    "WorkHub LK",
  ],
  authors: [{ name: "WorkHub LK" }],
  creator: "WorkHub LK",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "WorkHub LK — Find Local Skilled Workers in Sri Lanka",
    description:
      "Connect with trusted skilled workers across Sri Lanka. Hire instantly.",
    siteName: "WorkHub LK",
  },
  twitter: {
    card: "summary_large_image",
    title: "WorkHub LK",
    description: "Find trusted skilled workers across Sri Lanka.",
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0f1117" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  "font-sans text-sm shadow-soft-md border border-border/60",
                title: "font-medium",
                description: "text-muted-foreground",
                success: "border-green-200 bg-green-50 text-green-900",
                error: "border-red-200 bg-red-50 text-red-900",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}