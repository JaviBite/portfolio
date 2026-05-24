"use client";

import { Icon } from "@/components/Icon";

export function CVPrintButton() {
  const handlePrint = () => {
    const printWindow = window.open("/cv/print", "CVPrint", "width=800,height=600");
    if (printWindow) {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
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
