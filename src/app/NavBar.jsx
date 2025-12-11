"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/tracker", label: "Daily Log" },
  { href: "/baseline", label: "Baseline" },
  { href: "/coach", label: "AI Coach" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        marginBottom: 20,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "10px 12px 8px",
          borderRadius: 999,
          border: "1px solid rgba(148,163,184,0.55)",
          background:
            "radial-gradient(circle at top left, rgba(248,250,252,0.95), rgba(226,232,240,0.92))",
          boxShadow:
            "0 18px 40px rgba(15,23,42,0.18), 0 0 0 1px rgba(255,255,255,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              background:
                "conic-gradient(from 210deg,#fb7185,#f97316,#facc15,#22c55e,#38bdf8,#6366f1,#fb7185)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 28px rgba(15,23,42,0.45)",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#0b1120",
              }}
            >
              NM
            </span>
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color: "#0f172a",
              }}
            >
              NutriMind&nbsp;AI
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                letterSpacing: ".16em",
                textTransform: "uppercase",
              }}
            >
              Fuel · Train · Recover
            </div>
          </div>
        </div>

        {/* Links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: 2,
            borderRadius: 999,
            background: "rgba(15,23,42,0.03)",
            overflowX: "auto",
          }}
        >
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname?.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  background: active
                    ? "linear-gradient(135deg,#0f172a,#111827)"
                    : "transparent",
                  color: active ? "#f9fafb" : "#4b5563",
                  border: active
                    ? "1px solid rgba(248,250,252,0.7)"
                    : "1px solid transparent",
                  boxShadow: active
                    ? "0 10px 26px rgba(15,23,42,0.55)"
                    : "none",
                  transition:
                    "background .15s ease-out, box-shadow .15s ease-out, transform .1s ease-out",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
