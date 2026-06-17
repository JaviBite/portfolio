"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const MAX_QUESTIONS = 8;
const STORAGE_KEY = "cv_chat_count";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hola, soy el asistente de Javier. Tengo acceso a todo su CV y trayectoria profesional. ¿Qué quieres saber?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    setQuestionsUsed(saved);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <main
      style={{
        minHeight: "100vh",
        paddingTop: 80,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          width: "100%",
          padding: "0 24px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: "32px 0 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 11,
                  color: "var(--accent-cyan)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                // CV_CHAT
              </p>
              <h1
                style={{
                  fontSize: "clamp(22px, 3vw, 32px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                Pregunta a mi CV
              </h1>
            </div>

            {/* Counter */}
            <div
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: limitReached ? "#ef4444" : "var(--surface-card-border)",
                backgroundColor: "var(--surface-card)",
                fontFamily: "var(--font-geist-mono)",
                fontSize: 12,
                color: limitReached ? "#ef4444" : "var(--text-muted)",
                textAlign: "center",
              }}
            >
              {limitReached ? "Sin preguntas" : (
                <>
                  <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{questionsLeft}</span>
                  {" "}preguntas restantes
                </>
              )}
            </div>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 8 }}>
            Tengo contexto completo de la trayectoria de Javier. Pregúntame lo que quieras sobre su experiencia, proyectos o skills.
          </p>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 0",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minHeight: 400,
            maxHeight: "calc(100vh - 380px)",
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
                  maxWidth: "75%",
                  padding: "12px 18px",
                  borderRadius: 12,
                  fontSize: 14,
                  lineHeight: 1.6,
                  ...(msg.role === "user"
                    ? {
                        backgroundColor: "var(--accent-cyan)",
                        color: "#080810",
                        borderBottomRightRadius: 4,
                        fontWeight: 500,
                      }
                    : {
                        backgroundColor: "var(--surface-card)",
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
                  padding: "12px 18px",
                  borderRadius: 12,
                  backgroundColor: "var(--surface-card)",
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
                      animation: `bounce 1.2s ease-in-out ${j * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            padding: "16px 0 40px",
            borderTop: "1px solid var(--surface-card-border)",
          }}
        >
          {limitReached ? (
            <div
              style={{
                padding: 24,
                borderRadius: 12,
                border: "1px solid var(--surface-card-border)",
                backgroundColor: "var(--surface-card)",
                textAlign: "center",
              }}
            >
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
                Has agotado las preguntas de esta sesión. ¿Quieres saber más?
              </p>
              <a
                href="mailto:javiergimenezgarces@gmail.com"
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  backgroundColor: "var(--accent-cyan)",
                  color: "#080810",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Contactar directamente
              </a>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="¿Cuántos años de experiencia tiene en Computer Vision?"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "13px 18px",
                  borderRadius: 10,
                  border: "1px solid var(--surface-card-border)",
                  backgroundColor: "var(--surface-card)",
                  color: "var(--text-primary)",
                  fontSize: 14,
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
                style={{
                  padding: "13px 22px",
                  borderRadius: 10,

                  backgroundColor:
                    loading || !input.trim() ? "var(--surface-card)" : "var(--accent-cyan)",
                  color: loading || !input.trim() ? "var(--text-muted)" : "#080810",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  border: "1px solid var(--surface-card-border)",
                }}
              >
                {loading ? "..." : "Enviar"}
              </button>
            </div>
          )}

          <div style={{ marginTop: 12, textAlign: "center" }}>
            <Link
              href="/cv"
              style={{
                fontSize: 12,
                fontFamily: "var(--font-geist-mono)",
                color: "var(--text-muted)",
                textDecoration: "none",
              }}
            >
              ← Ver CV completo
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </main>
  );
}
