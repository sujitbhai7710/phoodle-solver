import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Phoodle Solver - Free Online Word Game Helper",
  description: "Stuck on today's Phoodle puzzle? Get instant word suggestions and solve in fewer guesses. Free, no signup, works in your browser.",
  keywords: ["Phoodle", "Phoodle solver", "word game", "word puzzle", "wordle helper", "food word game"],
  authors: [{ name: "Phoodle Solver" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Phoodle Solver - Free Online Word Game Helper",
    description: "Get the best word suggestions for today's Phoodle puzzle instantly",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Phoodle Solver",
    description: "Get the best word suggestions for today's Phoodle puzzle instantly",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
