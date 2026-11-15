import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sokha — Your space to think",
  description: "A calm space for conversations, ideas and projects.",
};

export const viewport: Viewport = { colorScheme: "dark light" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
