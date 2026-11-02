import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pragya AI — Indian Knowledge System & Modern Science",
  description:
    "A multilingual, multimodal AI knowledge platform connecting ancient Indian wisdom with modern science, mathematics, business, and psychology.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
