"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Network, Search, X } from "lucide-react";
import type { GraphNode } from "@/lib/api";
import { getGraphNodes, searchGraph } from "@/lib/api";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorMessage from "@/components/ErrorMessage";
import StatusBadge from "@/components/StatusBadge";

const GraphCanvas = dynamic(() => import("@/components/GraphCanvas"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0a0a",
        borderRadius: "12px",
        border: "1px solid #2a2a2a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#555",
        fontSize: "14px",
      }}
    >
      Loading graph engine…
    </div>
  ),
});

export default function GraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getGraphNodes({ limit: 200 })
      .then((res) => setNodes(res.nodes))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchGraph(searchQuery.trim());
      const ids = new Set(results.map((r) => r.id));
      setNodes((prev) => prev.filter((n) => ids.has(n.id)));
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchQuery("");
    setLoading(true);
    try {
      const res = await getGraphNodes({ limit: 200 });
      setNodes(res.nodes);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelected(node);
  }, []);

  return (
    <div style={{ height: "calc(100vh - 96px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Network size={28} color="#00e5cc" />
          <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.01em", color: "#ffffff" }}>
            Knowledge Graph
          </h1>
        </div>

        {/* Search bar */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search nodes…"
              style={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                padding: "8px 36px 8px 14px",
                color: "#ffffff",
                fontSize: "13px",
                outline: "none",
                width: "220px",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#00e5cc")}
              onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#2a2a2a")}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#666",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            style={{
              padding: "8px 16px",
              background: "#00e5cc",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              opacity: searching || !searchQuery.trim() ? 0.5 : 1,
            }}
          >
            <Search size={14} />
            {searching ? "…" : "Search"}
          </button>
        </div>
      </div>

      {/* Canvas + detail panel */}
      <div style={{ flex: 1, display: "flex", gap: "16px", minHeight: 0 }}>
        {/* Graph canvas area */}
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          {loading ? (
            <div style={{ padding: "48px" }}>
              <LoadingSkeleton lines={8} />
            </div>
          ) : error ? (
            <ErrorMessage message={error} />
          ) : (
            <GraphCanvas nodes={nodes} onNodeClick={handleNodeClick} />
          )}
        </div>

        {/* Node detail panel */}
        {selected && (
          <div
            style={{
              width: "320px",
              flexShrink: 0,
              background: "#111111",
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              padding: "24px",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <StatusBadge status={selected.node_type} />
              <button
                onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", marginBottom: "16px" }}>
              {selected.title ?? selected.name ?? "Node"}
            </h2>

            {selected.description && (
              <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.6", marginBottom: "16px" }}>
                {selected.description}
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {Object.entries(selected)
                .filter(([k]) => !["id", "title", "name", "description", "node_type", "expertise_domains"].includes(k))
                .filter(([, v]) => v !== undefined && v !== null)
                .map(([k, v]) => (
                  <div key={k}>
                    <span style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {k.replace(/_/g, " ")}
                    </span>
                    <div style={{ fontSize: "13px", color: "#aaa", marginTop: "2px", fontFamily: typeof v === "number" ? "JetBrains Mono, monospace" : undefined }}>
                      {String(v)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Node count footer */}
      <div style={{ marginTop: "12px", fontSize: "11px", color: "#555", flexShrink: 0 }}>
        {nodes.length} nodes in view
      </div>
    </div>
  );
}
