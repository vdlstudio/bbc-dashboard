import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BBC Marketing Tool | Bali Business Club",
  description: "Autonomous content creation dashboard for Bali Business Club",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Barlow+Condensed:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-black text-white min-h-screen">{children}</body>
    </html>
  );
}
