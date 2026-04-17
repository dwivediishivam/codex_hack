import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "700"]
});

export const metadata: Metadata = {
  title: "Pocket Foundry V2",
  description: "Prompt-built live micro apps with a fresh endpoint on every create"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
