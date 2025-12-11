// src/app/layout.js
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "NutriMind AI",
  description: "Precision fuel. Real coaching.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="nm-app">
          {/* Top nav */}
          <header className="nm-topbar">
            <div className="nm-topbar-left">
              <div className="nm-logo-circle">N</div>
              <div className="nm-logo-text">
                <div className="nm-logo-title">NutriMind AI</div>
                <div className="nm-logo-sub">Precision fuel · Real coaching</div>
              </div>
            </div>

            <nav className="nm-nav">
              <Link href="/" className="nm-nav-link">
                Dashboard
              </Link>
              <Link href="/coach" className="nm-nav-link">
                Coach
              </Link>
              <Link href="/baseline" className="nm-nav-link">
                My Baseline
              </Link>
              <Link href="/tracker" className="nm-nav-link">
                Daily Log
              </Link>
            </nav>
          </header>

          {/* Page content */}
          <main className="nm-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
