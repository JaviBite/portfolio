"use client";

export function CVPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: "8px 18px",
        borderRadius: 8,
        border: "1px solid var(--surface-card-border)",
        backgroundColor: "transparent",
        color: "var(--text-secondary)",
        fontSize: 13,
        cursor: "pointer",
        fontFamily: "var(--font-geist-mono)",
      }}
    >
      ⎙ PDF
    </button>
  );
}
