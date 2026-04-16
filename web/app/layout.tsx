import "./globals.css";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Foundry",
  description: "Mobile-first shell for prompt-built micro apps"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
