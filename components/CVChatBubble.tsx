"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/Icon";
import { useLocale } from "@/i18n/LocaleContext";

const MAX_QUESTIONS = 8;
const STORAGE_KEY = "cv_chat_count";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CVChatBubbleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CVChatBubble({ open, onOpenChange }: CVChatBubbleProps) {
  const { messages: t } = useLocale();
  const chatT = t.chat ?? {};

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        chatT.greeting ??
        "Hola, soy el asistente de Javier. Tengo acceso a todo su CV y trayectoria profesional. ¿Qué quieres saber?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    setQuestionsUsed(saved);
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  async function send() {
    const text = input.trim();
    if (!text || loading || questionsUsed >= MAX_QUESTIONS) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const newCount = questionsUsed + 1;
    setQuestionsUsed(newCount);
    localStorage.setItem(STORAGE_KEY, String(newCount));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            chatT.error ??
            "Lo siento, ha habido un error al procesar tu pregunta. Por favor, inténtalo de nuevo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const questionsLeft = MAX_QUESTIONS - questionsUsed;
  const limitReached = questionsUsed >= MAX_QUESTIONS;

  return (
    <div className="no-print">
      {/* Floating panel */}
      <div
        className="cv-chat-panel"
        style={{
          position: "fixed",
          bottom: 92,
          right: 24,
          zIndex: 60,
          width: "min(380px, calc(100vw - 32px))",
          height: "min(560px, calc(100vh - 140px))",
          display: "flex",
          flexDirection: "column",
          borderRadius: 16,
          border: "1px solid var(--surface-card-border)",
          backgroundColor: "var(--surface-card)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
          transformOrigin: "bottom right",
          transition: "opacity 0.22s ease, transform 0.22s ease",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(12px) scale(0.96)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "14px 16px",
            borderBottom: "1px solid var(--surface-card-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                backgroundColor: "var(--accent-cyan-glow)",
                border: "1px solid var(--accent-cyan)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="smart_toy" size={18} style={{ color: "var(--accent-cyan)" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                {chatT.title ?? "Pregunta a mi CV"}
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 10.5,
                  color: limitReached ? "#ef4444" : "var(--text-muted)",
                }}
              >
                {limitReached ? (
                  chatT.no_questions ?? "Sin preguntas"
                ) : (
                  <>
                    <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{questionsLeft}</span>{" "}
                    {chatT.questions_left ?? "preguntas restantes"}
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar chat"
            style={{
              flexShrink: 0,
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid var(--surface-card-border)",
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  ...(msg.role === "user"
                    ? {
                        backgroundColor: "var(--accent-cyan)",
                        color: "#080810",
                        borderBottomRightRadius: 4,
                        fontWeight: 500,
                      }
                    : {
                        backgroundColor: "var(--surface-bg, rgba(255,255,255,0.03))",
                        border: "1px solid var(--surface-card-border)",
                        color: "var(--text-primary)",
                        borderBottomLeftRadius: 4,
                      }),
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  backgroundColor: "var(--surface-bg, rgba(255,255,255,0.03))",
                  border: "1px solid var(--surface-card-border)",
                  borderBottomLeftRadius: 4,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((j) => (
                  <div
                    key={j}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "var(--accent-cyan)",
                      animation: `cvChatBounce 1.2s ease-in-out ${j * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input / limit */}
        <div style={{ padding: 12, borderTop: "1px solid var(--surface-card-border)" }}>
          {limitReached ? (
            <a
              href="mailto:javiergimenezgarces@gmail.com"
              style={{
                display: "block",
                padding: "11px 16px",
                borderRadius: 10,
                backgroundColor: "var(--accent-cyan)",
                color: "#080810",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              {chatT.contact ?? "Contactar directamente"}
            </a>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={chatT.placeholder ?? "Escribe tu pregunta..."}
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--surface-card-border)",
                  backgroundColor: "var(--surface-bg, rgba(255,255,255,0.03))",
                  color: "var(--text-primary)",
                  fontSize: 13.5,
                  outline: "none",
                  fontFamily: "var(--font-geist-sans)",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-cyan)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--surface-card-border)";
                }}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                aria-label={chatT.send ?? "Enviar"}
                style={{
                  flexShrink: 0,
                  width: 44,
                  borderRadius: 10,
                  backgroundColor:
                    loading || !input.trim() ? "var(--surface-card)" : "var(--accent-cyan)",
                  color: loading || !input.trim() ? "var(--text-muted)" : "#080810",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  border: "1px solid var(--surface-card-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={loading ? "more_horiz" : "arrow_upward"} size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating action button */}
      <button
        onClick={() => onOpenChange(!open)}
        aria-label={chatT.title ?? "Pregunta a mi CV"}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 61,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          backgroundColor: "var(--accent-cyan)",
          color: "#080810",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(6, 182, 212, 0.45)",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <Icon name={open ? "close" : "forum"} size={26} fill />
      </button>

      <style>{`
        @keyframes cvChatBounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
