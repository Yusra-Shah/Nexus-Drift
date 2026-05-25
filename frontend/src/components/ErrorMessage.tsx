import { AlertTriangle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "16px",
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: "8px",
        color: "#ef4444",
      }}
    >
      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
      <span style={{ fontSize: "14px", lineHeight: "1.5" }}>{message}</span>
    </div>
  );
}
