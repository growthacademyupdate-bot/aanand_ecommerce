import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Morpankh Saree - Traditional & Contemporary Sarees",
  description: "Shop the finest collection of traditional and contemporary sarees. Banarasi, Paithani, Kanjivaram & more at Morpankh Saree.",
  icons: {
    icon: "/favicon1.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
