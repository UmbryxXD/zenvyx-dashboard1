import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { Background } from "@/components/Background";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  title: "Zenvyx Dashboard",
  description: "Manage your Zenvyx Discord bot from one place.",
  icons: { icon: "/icon.png", apple: "/logo-192.png" },
};

export const viewport: Viewport = { themeColor: "#05030b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Background />
        {children}
      </body>
    </html>
  );
}
