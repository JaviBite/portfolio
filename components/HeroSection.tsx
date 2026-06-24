"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLocale } from "@/i18n/LocaleContext";

type AvailabilityStatus = "available" | "working" | "looking";

interface HeroProps {
  profile: {
    name: string;
    title: string;
    bio: string;
    motto: string;
    portrait: string;
    availability?: {
      status: string;
      label: string;
    };
  };
}

const AVAILABILITY_STATUSES: AvailabilityStatus[] = ["available", "working", "looking"];

export function HeroSection({ profile }: HeroProps) {
  const { messages } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const availability = profile.availability;
  const status: AvailabilityStatus =
    availability && AVAILABILITY_STATUSES.includes(availability.status as AvailabilityStatus)
      ? (availability.status as AvailabilityStatus)
      : "available";
  const availabilityLabel =
    availability?.label || messages.hero?.available || "DISPONIBLE PARA PROYECTOS";

  // Animated particle grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    // Respect reduced motion (and keep visual tests deterministic): render a
    // single static frame instead of an endless requestAnimationFrame loop.
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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
      if (reduceMotion) return;
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="hero-section">
      {/* Canvas background */}
      <canvas ref={canvasRef} className="hero-canvas" />

      {/* Radial gradient overlay */}
      <div className="hero-overlay" />

      {/* Content */}
      <div className="hero-inner">
        <div className="hero-copy">
          {/* Availability badge */}
          <div className={`hero-badge hero-badge--${status}`}>
            <span className="hero-badge-dot" />
            {availabilityLabel}
          </div>

          <h1 className="hero-title">
            {profile.name.split(" ")[0]} {" "}
            <span>{profile.name.split(" ").slice(1).join(" ")}</span>
          </h1>

          <p className="hero-subtitle">{profile.title}</p>

          <p className="hero-paragraph">{profile.bio}</p>

          <div className="hero-actions">
            <Link href="/projects" className="button button-primary">
              {messages.hero?.cta_projects || "Ver Proyectos"}
            </Link>
            <Link href="/cv" className="button button-secondary">
              {messages.hero?.cta_cv || "Ver CV"}
            </Link>
          </div>
        </div>

        <div className="hero-portrait">
          <img src={profile.portrait} alt={`Portrait of ${profile.name}`} className="figure-cover" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <span>SCROLL</span>
        <div className="scroll-indicator-line" />
      </div>
    </section>
  );
}
