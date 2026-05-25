"use client";

import { useEffect, useState } from "react";
import { Eye, CheckCircle2 } from "lucide-react";
import type { Alert } from "@/lib/api";
import { getAlerts, acknowledgeAlert } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorMessage from "@/components/ErrorMessage";

const SEVERITY_BORDER: Record<string, string> = {
  critical: "#ff5050",
  high:     "#ef4444",
  medium:   "#eab308",
  low:      "#22d3ee",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ackIds, setAckIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getAlerts()
      .then(setAlerts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAcknowledge = async (id: string) => {
    setAckIds((prev) => new Set([...prev, id]));
    try {
      await acknowledgeAlert(id);
    } catch {
      setAckIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const visibleAlerts = alerts.filter((a) => !ackIds.has(a.alert_id) && !a.acknowledged);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <Eye size={28} color="#00e5cc" />
        <h1 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.01em", color: "#ffffff" }}>
          Watchtower Feed
        </h1>
      </div>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "32px" }}>
        Autonomous monitoring alerts
      </p>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "24px" }}>
              <LoadingSkeleton lines={3} />
            </div>
          ))}
        </div>
      )}

      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && visibleAlerts.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            padding: "64px 0",
          }}
        >
          <CheckCircle2 size={48} color="#22c55e" />
          <p style={{ color: "#22c55e", fontSize: "16px", fontWeight: 500 }}>
            No alerts — system is healthy
          </p>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {visibleAlerts.map((alert) => (
            <div
              key={alert.alert_id}
              style={{
                background: "#111111",
                border: "1px solid #2a2a2a",
                borderLeft: `3px solid ${SEVERITY_BORDER[alert.severity] ?? "#444"}`,
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff" }}>
                      {alert.alert_type}
                    </span>
                    <StatusBadge status={alert.severity} />
                  </div>
                  <p style={{ color: "#aaaaaa", fontSize: "14px", lineHeight: "1.6", marginBottom: "12px" }}>
                    {alert.explanation}
                  </p>
                  <span style={{ fontSize: "11px", color: "#666" }}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => handleAcknowledge(alert.alert_id)}
                  style={{
                    padding: "8px 16px",
                    background: "transparent",
                    border: "1px solid #2a2a2a",
                    borderRadius: "8px",
                    color: "#888",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#444";
                    (e.currentTarget as HTMLButtonElement).style.color = "#ccc";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a";
                    (e.currentTarget as HTMLButtonElement).style.color = "#888";
                  }}
                >
                  Acknowledge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
