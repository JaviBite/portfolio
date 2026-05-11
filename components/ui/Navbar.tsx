"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState<"es" | "en">("es");
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const saved = document.cookie.match(/locale=([^;]+)/)?.[1] as "es" | "en" | undefined;
    if (saved) setLocale(saved);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function toggleLocale() {
    const next = locale === "es" ? "en" : "es";
    setLocale(next);
    document.cookie = `locale=${next};path=/;max-age=31536000`;
    window.location.reload();
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  const navLinks = [
    { href: "/projects", label: locale === "es" ? "Proyectos" : "Projects" },
    { href: "/cv", label: "CV" },
  ];

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "all 0.3s ease",
        backgroundColor: scrolled ? "var(--bg)" : "transparent",
        borderBottom: scrolled ? "1px solid var(--surface-card-border)" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      <nav
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--accent-cyan)",
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}
        >
          JG<span style={{ color: "var(--text-muted)" }}>_</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                color: pathname === href ? "var(--accent-cyan)" : "var(--text-secondary)",
                textDecoration: "none",
                backgroundColor: pathname === href ? "var(--accent-cyan-glow)" : "transparent",
                transition: "all 0.2s ease",
              }}
            >
              {label}
            </Link>
          ))}

          <div style={{ width: 1, height: 20, backgroundColor: "var(--surface-card-border)", margin: "0 4px" }} />

          {/* Locale toggle */}
          <button
            onClick={toggleLocale}
            title="Switch language"
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              border: "1px solid var(--surface-card-border)",
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "var(--font-geist-mono)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              transition: "all 0.2s ease",
            }}
          >
            {locale === "es" ? "EN" : "ES"}
          </button>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                border: "1px solid var(--surface-card-border)",
                backgroundColor: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                transition: "all 0.2s ease",
              }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
