"use client";

import { useEffect, useRef } from "react";
import type { GraphNode } from "@/lib/api";

const NODE_COLORS: Record<string, string> = {
  Decision:      "#00e5cc",
  Person:        "#7b2fff",
  Concept:       "#eab308",
  Risk:          "#ff5050",
  Contradiction: "#ef4444",
  Simulation:    "#3b82f6",
  Artifact:      "#888888",
};

interface GraphCanvasProps {
  nodes: GraphNode[];
  onNodeClick: (node: GraphNode) => void;
}

export default function GraphCanvas({ nodes, onNodeClick }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    let cancelled = false;

    const init = async () => {
      try {
        const { default: Sigma } = await import("sigma");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { default: GraphClass } = await import("graphology") as { default: any };

        if (cancelled || !containerRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const graph: any = new GraphClass();

        nodes.forEach((node) => {
          graph.addNode(node.id, {
            label: node.title ?? node.name ?? node.id.slice(0, 8),
            size: 8,
            color: NODE_COLORS[node.node_type] ?? "#555555",
            x: Math.random() * 10 - 5,
            y: Math.random() * 10 - 5,
          });
        });

        if (sigmaRef.current) {
          (sigmaRef.current as { kill: () => void }).kill();
        }

        const sigma = new Sigma(graph, containerRef.current, {
          defaultNodeColor: "#00e5cc",
          defaultEdgeColor: "#333333",
          labelColor: { color: "#888888" },
          renderLabels: true,
          labelSize: 11,
        });

        sigma.on("clickNode", ({ node }: { node: string }) => {
          const found = nodes.find((n) => n.id === node);
          if (found) onNodeClick(found);
        });

        sigmaRef.current = sigma;
      } catch (err) {
        console.error("Sigma init failed:", err);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (sigmaRef.current) {
        (sigmaRef.current as { kill: () => void }).kill();
        sigmaRef.current = null;
      }
    };
  }, [nodes, onNodeClick]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0a0a",
        borderRadius: "12px",
        border: "1px solid #2a2a2a",
      }}
    />
  );
}

export function GraphLegend() {
  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
      {Object.entries(NODE_COLORS).map(([type, color]) => (
        <div key={type} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 6px ${color}66`,
            }}
          />
          <span style={{ fontSize: "11px", color: "#888" }}>{type}</span>
        </div>
      ))}
    </div>
  );
}
