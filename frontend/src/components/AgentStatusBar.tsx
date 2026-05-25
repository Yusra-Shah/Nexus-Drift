"use client";

import { useEffect, useState } from "react";
import type { AgentStatus } from "@/lib/api";
import { getAgentStatus } from "@/lib/api";

export default function AgentStatusBar() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getAgentStatus();
        setAgents(Array.isArray(data) ? data : []);
      } catch {
        // silently fail — bar is informational
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (agents.length === 0) return null;

  return (
    <div
      style={{
        padding: "12px 20px",
        borderTop: "1px solid #1a1a1a",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "10px", color: "#666", marginRight: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Agents
      </span>
      {agents.map((agent) => (
        <div
          key={agent.agent_id}
          title={`${agent.name}: ${agent.status}`}
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: agent.status === "running" ? "#22c55e" : "#444444",
            cursor: "default",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}
