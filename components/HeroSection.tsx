"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

interface HeroProps {
  profile: {
    name: string;
    title: string;
    bio: string;
    motto: string;
    portrait: string;
  };
}

export function HeroSection({ profile }: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated particle grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cols = Math.floor(canvas.width / 60);
      const rows = Math.floor(canvas.height / 60);

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = (i / cols) * canvas.width;
          const y = (j / rows) * canvas.height;
          const dist = Math.sqrt(
            Math.pow(x - canvas.width / 2, 2) + Math.pow(y - canvas.height / 2, 2)
          );
          const wave = Math.sin(dist / 80 - t * 0.02) * 0.5 + 0.5;
          const alpha = wave * 0.25;

          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 245, 255, ${alpha})`;
          ctx.fill();
        }
      }
      t++;
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "85vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "0 24px",
      }}
    >
      {/* Canvas background */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Radial gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 0%, var(--bg) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          width: "100%",
          display: "flex",
          gap: 48,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          padding: "80px 0",
        }}
      >
        <div style={{ flex: "1 1 520px", minWidth: 320, textAlign: "left" }}>
          {/* Available badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 32,
              padding: "6px 14px",
              borderRadius: 99,
              border: "1px solid var(--accent-cyan)",
              backgroundColor: "var(--accent-cyan-glow)",
              fontSize: 12,
              fontFamily: "var(--font-geist-mono)",
              color: "var(--accent-cyan)",
              letterSpacing: "0.08em",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "var(--accent-cyan)",
                boxShadow: "0 0 6px var(--accent-cyan)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            DISPONIBLE PARA PROYECTOS
          </div>

          <h1
            style={{
              fontSize: "clamp(40px, 7vw, 80px)",
              fontWeight: 700,
              lineHeight: 1.05,
              marginBottom: 16,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            {profile.name.split(" ")[0]} {" "}
            <span style={{ color: "var(--accent-cyan)" }}>
              {profile.name.split(" ").slice(1).join(" ")}
            </span>
          </h1>

          <p
            style={{
              fontSize: "clamp(14px, 2vw, 18px)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-geist-mono)",
              letterSpacing: "0.1em",
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            {profile.title}
          </p>

          <p
            style={{
              fontSize: "clamp(16px, 2.5vw, 22px)",
              color: "var(--text-muted)",
              lineHeight: 1.8,
              marginBottom: 40,
              maxWidth: 560,
            }}
          >
            {profile.bio}
          </p>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link
              href="/projects"
              style={{
                padding: "14px 32px",
                borderRadius: 8,
                backgroundColor: "var(--accent-cyan)",
                color: "#080810",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                letterSpacing: "0.05em",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px var(--accent-cyan-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Ver Proyectos
            </Link>
            <Link
              href="/cv"
              style={{
                padding: "14px 32px",
                borderRadius: 8,
                border: "1px solid var(--surface-card-border)",
                backgroundColor: "var(--surface-card)",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                letterSpacing: "0.05em",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-cyan)";
                e.currentTarget.style.color = "var(--accent-cyan)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--surface-card-border)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
            >
              Ver CV
            </Link>
          </div>
        </div>

        <div
          style={{
            flex: "0 0 320px",
            width: 320,
            height: 320,
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid var(--accent-cyan)",
            backgroundColor: "var(--surface-card)",
            boxShadow: "0 0 24px rgba(6, 182, 212, 0.2)",
          }}
        >
          <img
            src={profile.portrait}
            alt={`Portrait of ${profile.name}`}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          color: "var(--text-muted)",
          fontSize: 11,
          fontFamily: "var(--font-geist-mono)",
          letterSpacing: "0.1em",
        }}
      >
        <span>SCROLL</span>
        <div
          style={{
            width: 1,
            height: 40,
            background:
              "linear-gradient(to bottom, var(--accent-cyan), transparent)",
            animation: "fadeInUp 2s ease infinite",
          }}
        />
      </div>
    </section>
  );
}
