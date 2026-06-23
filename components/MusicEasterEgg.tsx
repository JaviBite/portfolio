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
 * Drop royalty-free / CC tracks in public/music/ and list them in TRACKS below;
 * each activation cycles to the next one. Until a file is there, clicking still
 * works visually: we fall back to a synthetic 120 BPM pulse (no sound) so the
 * effect is demonstrable, and it switches to real audio analysis automatically
 * once a file exists. No track needs a known BPM — the beat is read live.
 */

// Royalty-free / Creative Commons tracks only — keep each one's license &
// attribution (see public/music/README.md). Add/rename freely.
const TRACKS = ["/music/Chrome_Boulevard.mp3"];
const FALLBACK_BPM = 120;
// Overall punch of the beat reaction. Auto-gain already fills the 0..1 range,
// so this is just a final nudge — bump it up if you want the web to react harder.
const SENSITIVITY = 1.25;
// How much of the beat comes from a clean on-beat pulse (a decaying thump on
// each detected kick — locked to the track's tempo) vs. the raw bass energy.
// 1 = pure on-beat pulse, 0 = pure energy (busier). 0.7 = mostly on-beat + body.
const PULSE_MIX = 0.7;

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
  const peakRef = useRef(0.12); // adaptive ceiling for beat auto-gain
  const floorRef = useRef(0.04); // adaptive floor for beat auto-gain
  const prevEnergyRef = useRef(0); // last frame's energy (onset rising-edge check)
  const lastOnsetRef = useRef(0); // ms timestamp of last detected kick (refractory)
  const pulseRef = useRef(0); // current on-beat pulse envelope (decays each frame)
  const activeRef = useRef(false);
  const tickRef = useRef<() => void>(() => {});
  const trackIndexRef = useRef(0);

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
      analyser.fftSize = 512; // finer low-end resolution for the kick/bass
      analyser.smoothingTimeConstant = 0.6; // less smoothing -> snappier peaks
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
        // Average the low (kick/bass) bins ~40–800 Hz at 44.1 kHz / fftSize 512.
        let sum = 0;
        const lo = 1;
        const hi = 9;
        for (let i = lo; i <= hi; i++) sum += data[i];
        const energy = sum / ((hi - lo + 1) * 255); // 0..1 raw

        // (1) ENERGY track: auto-gain with an adaptive floor AND ceiling (both
        // snap fast toward a new extreme, release slowly). Mapping energy across
        // that recent range gives contrast on *any* track — sustained level near
        // 0, kicks near 1 — instead of pinning at max or topping out at ~0.5.
        peakRef.current += (energy - peakRef.current) * (energy > peakRef.current ? 0.5 : 0.02);
        floorRef.current += (energy - floorRef.current) * (energy < floorRef.current ? 0.5 : 0.02);
        const range = Math.max(0.04, peakRef.current - floorRef.current);
        const norm = Math.max(0, (energy - floorRef.current) / range); // 0..1 across recent dynamics
        const energyBeat = Math.min(1, norm * SENSITIVITY);

        // (2) ON-BEAT pulse: fire a clean decaying thump each time the energy
        // crosses the upper part of its current dynamic range on a rising edge
        // (reusing the floor/ceiling, so it's robust on any track), past a
        // refractory gap. "Locked to the tempo" without fragile global-BPM code.
        const now = performance.now();
        pulseRef.current *= 0.9; // decay the previous pulse (~0.4s tail)
        const trigger = floorRef.current + range * 0.4;
        if (
          energy > trigger &&
          prevEnergyRef.current <= trigger &&
          now - lastOnsetRef.current > 110 // ms refractory (caps ~9 hits/s)
        ) {
          lastOnsetRef.current = now;
          pulseRef.current = 1;
        }
        prevEnergyRef.current = energy;

        // (3) MIX the on-beat pulse with the energy body (PULSE_MIX knob).
        beat = Math.min(1, pulseRef.current * PULSE_MIX + energyBeat * (1 - PULSE_MIX));
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
    // Cycle to the next track in the list before playing.
    const audio = audioRef.current;
    if (audio && TRACKS.length > 0) {
      const next = TRACKS[trackIndexRef.current % TRACKS.length];
      trackIndexRef.current += 1;
      if (!audio.src.endsWith(next)) audio.src = next;
    }
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
      {/* src is set per-activation (cycles TRACKS); preload="none" so nothing
          is fetched until the user clicks. */}
      <audio ref={audioRef} loop preload="none" onEnded={stop} style={{ display: "none" }} />
      {children}
      {active && <BeatLights />}
      {active && <StopButton onStop={stop} />}
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
 * Floating "stop the music" control, bottom-left (the chat bubble is bottom-
 * right, so they don't collide). A little equalizer bounces with the beat; the
 * pill glows with it too. Shown only while playing.
 */
function StopButton({ onStop }: { onStop: () => void }) {
  return (
    <button
      type="button"
      onClick={onStop}
      aria-label="Parar la música"
      className="music-stop"
      style={{
        position: "fixed",
        left: 24,
        // Clear of the Next.js dev-tools indicator (bottom-left, dev only).
        bottom: 84,
        zIndex: 9991,
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        padding: "10px 16px 10px 13px",
        borderRadius: 999,
        border: "1px solid var(--accent-cyan)",
        backgroundColor: "var(--surface-card)",
        color: "var(--accent-cyan)",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "var(--font-geist-mono)",
        cursor: "pointer",
        boxShadow:
          "0 8px 24px rgba(0, 0, 0, 0.18), 0 0 calc(6px + var(--beat, 0) * 26px) var(--accent-cyan-glow)",
      }}
    >
      <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 13 }}>
        {[0.6, 1, 0.45].map((m, i) => (
          <span
            key={i}
            className="music-eq-bar"
            style={{
              width: 3,
              borderRadius: 1,
              backgroundColor: "var(--accent-cyan)",
              height: `calc(3px + var(--beat, 0) * ${(m * 10).toFixed(1)}px)`,
            }}
          />
        ))}
      </span>
      Parar música
    </button>
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
