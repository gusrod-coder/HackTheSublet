import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { DemoSwitcher } from "@/components/shared/DemoSwitcher";

export const metadata: Metadata = {
  title: "Householdfit",
  description: "Ann Arbor sublets matched to the household you'll actually live with.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <a href="/" className="brand">Householdfit</a>
          <DemoSwitcher />
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
