import type { Metadata } from "next";
import Link from "next/link";
import { Aperture, LayoutDashboard, Network, Presentation } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "RetaiLens Agentic — Autonomous Store Ops",
  description: "A simulated autonomous retail operations command center with vision telemetry, tool orchestration, and safe manager approvals.",
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <Link href="/" className="brand" aria-label="RetaiLens command center">
              <span className="brand-mark"><Aperture size={17} strokeWidth={2.4} /></span>
              <span><span className="brand-name">RetaiLens</span><span className="brand-sub">AGENTIC</span></span>
            </Link>
            <nav className="main-nav" aria-label="Primary navigation">
              <Link href="/" className="nav-link"><LayoutDashboard size={13} />Command center</Link>
              <Link href="/architecture" className="nav-link"><Network size={13} />Architecture</Link>
              <Link href="/pitch" className="nav-link"><Presentation size={13} />Pitch notes</Link>
            </nav>
            <div className="topbar-right">
              <span className="topbar-time">STORE 01 / IN · IST</span>
              <span className="demo-indicator"><i className="demo-indicator-dot" />Simulation mode</span>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
