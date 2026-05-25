interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  critical:    { bg: "#ff5050", text: "#0a0a0a" },
  high:        { bg: "#ef4444", text: "#0a0a0a" },
  medium:      { bg: "#f59e0b", text: "#0a0a0a" },
  low:         { bg: "#22d3ee", text: "#0a0a0a" },
  success:     { bg: "#22c55e", text: "#0a0a0a" },
  running:     { bg: "#22c55e", text: "#0a0a0a" },
  completed:   { bg: "#22c55e", text: "#0a0a0a" },
  queued:      { bg: "#3b82f6", text: "#ffffff" },
  pending:     { bg: "#eab308", text: "#0a0a0a" },
  warning:     { bg: "#eab308", text: "#0a0a0a" },
  failed:      { bg: "#ef4444", text: "#ffffff" },
  error:       { bg: "#ef4444", text: "#ffffff" },
  stopped:     { bg: "#444444", text: "#888888" },
  unknown:     { bg: "#333333", text: "#888888" },
  decision:    { bg: "#00e5cc22", text: "#00e5cc" },
  person:      { bg: "#7b2fff22", text: "#b07eff" },
  concept:     { bg: "#eab30822", text: "#eab308" },
  risk:        { bg: "#ff505022", text: "#ff5050" },
  contradiction:{ bg: "#ef444422", text: "#ef4444" },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const colors = STATUS_COLORS[key] ?? { bg: "#333333", text: "#888888" };

  const padding = size === "sm" ? "2px 8px" : "4px 12px";
  const fontSize = size === "sm" ? "11px" : "13px";

  return (
    <span
      style={{
        display: "inline-block",
        background: colors.bg,
        color: colors.text,
        padding,
        fontSize,
        fontWeight: 600,
        borderRadius: "4px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        lineHeight: "1.4",
      }}
    >
      {status}
    </span>
  );
}
