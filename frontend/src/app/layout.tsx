import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "TRINETRA-P | Intelligent Parking Enforcement",
    template: "%s | TRINETRA-P",
  },
  description: "AI-powered parking intelligence platform. Real-time violation monitoring, PICQ analytics, and enforcement dispatch optimization.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230a0a0a'/><circle cx='16' cy='16' r='10' fill='none' stroke='%2339FF14' stroke-width='2.5'/><circle cx='16' cy='16' r='4' fill='%2339FF14'/><path d='M16 6 L16 10 M16 22 L16 26 M6 16 L10 16 M22 16 L26 16' stroke='%2339FF14' stroke-width='1.5' stroke-linecap='round'/></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-neutral-950 text-neutral-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}
