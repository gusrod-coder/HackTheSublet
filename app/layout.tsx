import type { Metadata, Viewport } from "next";
import { Inclusive_Sans, Sigmar, Skranji } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AppHeader } from "@/components/shared/AppHeader";

// Figma design system fonts. Exposed as CSS variables used in app/globals.css.
const display = Sigmar({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const heading = Skranji({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-heading", display: "swap" });
const body = Inclusive_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Householdfit",
  description: "Ann Arbor sublets matched to the household you'll actually live with.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${heading.variable} ${body.variable}`}>
      <body>
        <AppHeader />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
