"use client";

import {
  type CSSProperties,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Music easter egg.
 *
 * Click the "Músico" skill badge -> a track plays and a few elements of the CV
 * pulse with the beat. The beat is extracted in real time from the audio (bass
 * energy via the Web Audio API), so it reacts to *any* track without us having
 * to know its BPM. The live value is written to the `--beat` CSS custom property
 * on <html> every animation frame (0..1); elements just reference `var(--beat)`.
 *
 * Drop the track at: public/music/easter-egg.mp3
 * Until a file is there, clicking still works visually: we fall back to a
 * synthetic 120 BPM pulse (no sound) so the effect is demonstrable, and it
 * switches to the real audio analysis automatically once the file exists.
 */

const MUSIC_SRC = "/music/easter-egg.mp3";
const FALLBACK_BPM = 120;

type MusicEasterEggValue = {
  active: boolean;
  toggle: () => void;
};

const MusicEasterEggContext = createContext<MusicEasterEggValue | null>(null);

export function MusicEasterEggProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);
  const beatRef = useRef(0);
  const activeRef = useRef(false);
  const tickRef = useRef<() => void>(() => {});

  const [active, setActive] = useState(false);

  // Build the audio graph lazily, on the first user gesture (browsers require it).
  const ensureGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || ctxRef.current) return;
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      // Web Audio unavailable -> we'll drive the synthetic beat instead.
    }
  }, []);

  // The per-frame loop lives in a ref so it can reschedule itself without a
  // stale-closure / self-reference dance. It only reads refs, so defining it
  // once on mount is enough.
  useEffect(() => {
    tickRef.current = () => {
      let beat = 0;
      const audio = audioRef.current;
      const analyser = analyserRef.current;
      const data = dataRef.current;
      const playing =
        !!audio && !audio.paused && !audio.ended && audio.currentTime > 0 && audio.readyState >= 2;

      if (playing && analyser && data) {
        analyser.getByteFrequencyData(data);
        // Bass energy ~ bins 1..8 (≈ 180–1500 Hz at 48 kHz / fftSize 256).
        let sum = 0;
        const lo = 1;
        const hi = 8;
        for (let i = lo; i <= hi; i++) sum += data[i];
        const energy = sum / ((hi - lo + 1) * 255); // 0..1
        const prev = beatRef.current;
        // Fast attack, slow decay -> a punchy, kick-like pulse.
        beat = energy > prev ? energy : prev * 0.86 + energy * 0.14;
      } else {
        // No track yet (or blocked): synthetic pulse so the effect is still visible.
        const phase = ((performance.now() / 1000) * (FALLBACK_BPM / 60)) % 1;
        beat = Math.pow(1 - phase, 2.2);
      }

      beatRef.current = beat;
      document.documentElement.style.setProperty("--beat", beat.toFixed(3));
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    };
  }, []);

  const start = useCallback(async () => {
    ensureGraph();
    // Scroll up so the portrait is in view — the shades drop in a beat later
    // (MusicianPortrait delays them), making the entrance visible.
    try {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    } catch {
      /* ignore */
    }
    try {
      if (ctxRef.current?.state === "suspended") await ctxRef.current.resume();
    } catch {
      /* ignore */
    }
    try {
      await audioRef.current?.play();
    } catch {
      // No file / autoplay blocked: keep going in synthetic (silent) visual mode.
    }
    activeRef.current = true;
    setActive(true);
    document.documentElement.dataset.musicLive = "1";
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(() => tickRef.current());
  }, [ensureGraph]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    beatRef.current = 0;
    activeRef.current = false;
    setActive(false);
    delete document.documentElement.dataset.musicLive;
    document.documentElement.style.setProperty("--beat", "0");
  }, []);

  const toggle = useCallback(() => {
    if (activeRef.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close().catch(() => {});
      document.documentElement.style.setProperty("--beat", "0");
      delete document.documentElement.dataset.musicLive;
    };
  }, []);

  return (
    <MusicEasterEggContext.Provider value={{ active, toggle }}>
      {/* preload="none" so we don't fetch (and 404) the track until activated */}
      <audio ref={audioRef} src={MUSIC_SRC} loop preload="none" onEnded={stop} style={{ display: "none" }} />
      {children}
      {active && <BeatLights />}
    </MusicEasterEggContext.Provider>
  );
}

export function useMusicEasterEgg() {
  const ctx = useContext(MusicEasterEggContext);
  if (!ctx) {
    throw new Error("useMusicEasterEgg must be used within <MusicEasterEggProvider>");
  }
  return ctx;
}

/**
 * Pulsing "disco" glows in the four screen corners while the music plays.
 * Fixed + pointer-events:none, so it's purely decorative. Each corner pulses
 * with the beat (cyan/purple, alternating) via inline styles on --beat.
 */
function BeatLights() {
  const corners = [
    { pos: "top left", color: "var(--accent-cyan)" },
    { pos: "top right", color: "var(--accent-purple)" },
    { pos: "bottom left", color: "var(--accent-purple)" },
    { pos: "bottom right", color: "var(--accent-cyan)" },
  ];
  return (
    <div
      aria-hidden="true"
      className="beat-lights"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9990, overflow: "hidden" }}
    >
      {corners.map(({ pos, color }) => {
        const [v, h] = pos.split(" ");
        // Big, soft, blurred glow anchored just *off* the corner. It pulses by
        // opacity only (no scaling), so its faded edge never moves — that's what
        // removes the hard "cut": the gradient is huge and blurred, and its
        // transparent boundary sits off-screen.
        const style: CSSProperties = {
          position: "absolute",
          width: "80vw",
          height: "80vh",
          background: `radial-gradient(circle at ${pos}, ${color} 0%, transparent 72%)`,
          opacity: "calc(0.05 + var(--beat, 0) * 0.5)",
          filter: "blur(55px)",
          willChange: "opacity",
          ...(v === "top" ? { top: "-12vh" } : { bottom: "-12vh" }),
          ...(h === "left" ? { left: "-12vw" } : { right: "-12vw" }),
        };
        return <span key={pos} className="beat-light" style={style} />;
      })}
    </div>
  );
}

/**
 * The clickable "Músico" badge. Idle: a soft glow + an occasional nudge invite
 * the click. Active: it pulses with the beat (via `var(--beat)`).
 */
export function MusicianTrait({ label }: { label: string }) {
  const { active, toggle } = useMusicEasterEgg();
  const [hovered, setHovered] = useState(false);
  const en = label === "Musician";
  const title = active
    ? en
      ? "Stop the music"
      : "Parar la música"
    : en
      ? "Press play 🎵"
      : "Dale al play 🎵";

  // Same look as the sibling skill badges, kept inline so it never depends on a
  // stylesheet reload. The cyan note + soft glow invite the click; when playing
  // it pulses with the beat (--beat, updated every frame by the provider).
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px",
    borderRadius: 4,
    fontSize: 12,
    lineHeight: 1.4,
    fontFamily: "var(--font-geist-mono)",
    cursor: "pointer",
    position: "relative",
    color: active || hovered ? "var(--accent-cyan)" : "var(--text-secondary)",
    backgroundColor: active ? "var(--accent-cyan-glow)" : "var(--surface-card)",
    border: `1px solid ${active || hovered ? "var(--accent-cyan)" : "var(--surface-card-border)"}`,
    transition: "color .2s ease, border-color .2s ease, background-color .2s ease, box-shadow .12s ease",
    boxShadow: active
      ? "0 0 calc(6px + var(--beat, 0) * 34px) var(--accent-cyan-glow)"
      : hovered
        ? "0 0 14px var(--accent-cyan-glow)"
        : "0 0 8px var(--accent-cyan-glow)",
    transform: active ? "scale(calc(1 + var(--beat, 0) * 0.2))" : undefined,
    willChange: active ? "transform" : undefined,
  };

  return (
    <button
      type="button"
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`musician-trait${active ? " is-playing" : ""}`}
      aria-pressed={active}
      aria-label={en ? "Musician — toggle music" : "Músico — activar música"}
      title={title}
      style={style}
    >
      <span
        className="musician-trait__note"
        aria-hidden="true"
        style={{
          color: "var(--accent-cyan)",
          fontSize: 13,
          lineHeight: 1,
          display: "inline-block",
          transformOrigin: "center 70%",
          transform: active
            ? "scale(calc(1 + var(--beat, 0) * 0.8)) rotate(calc(var(--beat, 0) * -12deg))"
            : undefined,
        }}
      >
        {active ? "♫" : "♪"}
      </span>
      {label}
    </button>
  );
}

/** Pure SVG sunglasses used as a fallback when there is no real shades photo. */
function ShadesOverlay() {
  return (
    <svg
      className="shades-overlay"
      viewBox="0 0 100 42"
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "47.5%",
        top: "45%", // ≈ eye line — tweak if it sits high/low on your photo
        width: "40%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 2,
        filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35))",
      }}
    >
      <defs>
        <linearGradient id="shadesLens" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c1c22" />
          <stop offset="1" stopColor="#050507" />
        </linearGradient>
      </defs>
      {/* arms */}
      <path d="M7 15 L0 9" stroke="#0b0b0d" strokeWidth="4" strokeLinecap="round" />
      <path d="M93 15 L100 9" stroke="#0b0b0d" strokeWidth="4" strokeLinecap="round" />
      {/* bridge */}
      <path d="M41 13 Q50 7 59 13" fill="none" stroke="#0b0b0d" strokeWidth="5" strokeLinecap="round" />
      {/* lenses */}
      <rect x="5" y="6" width="37" height="28" rx="13" fill="url(#shadesLens)" stroke="#4bc4d9" strokeWidth="1.5" />
      <rect x="58" y="6" width="37" height="28" rx="13" fill="url(#shadesLens)" stroke="#4bc4d9" strokeWidth="1.5" />
      {/* shine */}
      <path d="M12 26 L24 12" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M65 26 L77 12" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The CV portrait. When the easter egg is active it puts shades on:
 *  - if public/portrait-shades.jpg exists, it crossfades to that real photo;
 *  - otherwise the SVG sunglasses drop onto the current photo.
 * The ring also pulses with the beat. All structural styling is inline so the
 * circle shape is correct even if globals.css hasn't hot-reloaded.
 */
export function MusicianPortrait({ src, alt }: { src: string; alt: string }) {
  const { active } = useMusicEasterEgg();
  // "unknown" until we try to load the real shades photo on first activation.
  const [realShades, setRealShades] = useState<"unknown" | "yes" | "no">("unknown");
  // Hold the shades back briefly so the page can scroll to the top first — then
  // they "drop in" while the portrait is in view. The ring still pulses from the
  // moment you click (it keys off `active`, not `shadesOn`).
  const [dropReady, setDropReady] = useState(false);
  useEffect(() => {
    if (!active) {
      setDropReady(false);
      return;
    }
    const t = setTimeout(() => setDropReady(true), 600);
    return () => clearTimeout(t);
  }, [active]);

  const shadesOn = active && dropReady;
  const showRealShades = shadesOn && realShades === "yes";

  const imgStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "opacity .5s ease",
  };

  return (
    <div
      className={`no-print portrait-ring${active ? " is-playing" : ""}`}
      style={{
        position: "relative",
        width: 160,
        height: 160,
        borderRadius: "50%",
        border: "3px solid var(--accent-cyan)",
        backgroundColor: "var(--surface-card)",
        flexShrink: 0,
        transition: "box-shadow .12s ease",
        boxShadow: active
          ? "0 0 calc(18px + var(--beat, 0) * 54px) rgba(75, 196, 217, calc(0.3 + var(--beat, 0) * 0.5))"
          : "0 0 24px rgba(75, 196, 217, 0.30)",
        transform: active ? "scale(calc(1 + var(--beat, 0) * 0.08))" : undefined,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden" }}>
        <img src={src} alt={alt} style={{ ...imgStyle, opacity: showRealShades ? 0 : 1 }} />
        {shadesOn && realShades !== "no" && (
          <img
            src="/portrait-shades.jpg"
            alt=""
            aria-hidden="true"
            onLoad={() => setRealShades("yes")}
            onError={() => setRealShades("no")}
            style={{ ...imgStyle, opacity: showRealShades ? 1 : 0 }}
          />
        )}
      </div>
      {shadesOn && !showRealShades && <ShadesOverlay />}
    </div>
  );
}
