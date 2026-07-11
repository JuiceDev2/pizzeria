import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/ui/pwa-register";

export const metadata: Metadata = {
  title: "Pizzería - Sistema administrativo",
  description: "Panel administrativo para pizzería",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pizzería",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7a3b1e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
