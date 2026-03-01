import type { Metadata, Viewport } from "next";
import { Arvo, Inter } from "next/font/google";
import "./globals.css";

const arvo = Arvo({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-arvo",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Arido | Simple Fitness Access",
  description: "Generate 24 Hour Fitness guest passes instantly.",
  appleWebApp: {
    title: "Arido",
    statusBarStyle: "default",
    capable: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fdfaf6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${arvo.variable} ${inter.variable} font-sans antialiased bg-[#fdfaf6] text-zinc-900`}>
        {children}
      </body>
    </html>
  );
}
