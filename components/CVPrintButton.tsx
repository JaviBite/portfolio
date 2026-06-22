"use client";

import { Icon } from "@/components/Icon";

export function CVPrintButton() {
  const handlePrint = () => {
    const printWindow = window.open("/cv/print", "CVPrint", "width=900,height=700");
    if (!printWindow) return;
    // The print page auto-fits its content to the page and sets __cvPrintReady
    // when settled. Wait for that flag (with a hard timeout fallback) so we never
    // print a half-laid-out page.
    const start = Date.now();
    const tryPrint = () => {
      if (printWindow.closed) return;
      let ready = false;
      try {
        ready = !!(printWindow as unknown as { __cvPrintReady?: boolean }).__cvPrintReady;
      } catch {
        ready = false;
      }
      if (ready || Date.now() - start > 4000) {
        printWindow.focus();
        printWindow.print();
      } else {
        setTimeout(tryPrint, 60);
      }
    };
    setTimeout(tryPrint, 150);
  };

  return (
    <button
      onClick={handlePrint}
      style={{
        padding: "8px 18px",
        borderRadius: 8,
        border: "1px solid var(--surface-card-border)",
        backgroundColor: "transparent",
        color: "var(--text-secondary)",
        fontSize: 13,
        cursor: "pointer",
        fontFamily: "var(--font-geist-mono)",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Icon name="file_download" size={16} />
      PDF
    </button>
  );
}
