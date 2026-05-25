"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { startSimulation, getSimulation } from "@/lib/api";
import type { SimulationResult } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import ErrorMessage from "@/components/ErrorMessage";

export default function SimulatePage() {
  const [scenarioName, setScenarioName] = useState("");
  const [decisionIds, setDecisionIds] = useState("");
  const [complexity, setComplexity] = useState<"low" | "medium" | "high">("medium");
  const [teamSize, setTeamSize] = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [polling, setPolling] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setResult(null);

    try {
      const ids = decisionIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const { job_id } = await startSimulation({
        scenario_name: scenarioName,
        decision_node_ids: ids,
        parameters: {
          architecture_complexity: complexity,
          team_size: teamSize,
        },
      });

      setResult({ job_id, status: "queued" });
      setPolling(true);

      // Poll until done
      const poll = setInterval(async () => {
        try {
          const data = await getSimulation(job_id);
          setResult(data);
          if (data.status !== "queued" && data.status !== "running") {
            clearInterval(poll);
            setPolling(false);
          }
        } catch (err: unknown) {
          clearInterval(poll);
          setPolling(false);
          setSubmitError(err instanceof Error ? err.message : String(err));
        }
      }, 3000);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.15s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    color: "#888",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <FlaskConical size={28} color="#00e5cc" />
        <h1 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.01em", color: "#ffffff" }}>
          Simulation Studio
        </h1>
      </div>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "32px" }}>
        Model decision outcomes with AI-powered scenario analysis
      </p>

      <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
        {/* Form */}
        <div
          style={{
            width: "640px",
            flexShrink: 0,
            background: "#111111",
            border: "1px solid #2a2a2a",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={labelStyle}>Scenario Name</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g. Migrate to microservices"
                required
                style={inputStyle}
                onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#00e5cc")}
                onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#2a2a2a")}
              />
            </div>

            <div>
              <label style={labelStyle}>Decision Node IDs (comma-separated)</label>
              <textarea
                value={decisionIds}
                onChange={(e) => setDecisionIds(e.target.value)}
                placeholder="uuid-1, uuid-2, uuid-3"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "#00e5cc")}
                onBlur={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "#2a2a2a")}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Architecture Complexity</label>
                <select
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value as "low" | "medium" | "high")}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  onFocus={(e) => ((e.currentTarget as HTMLSelectElement).style.borderColor = "#00e5cc")}
                  onBlur={(e) => ((e.currentTarget as HTMLSelectElement).style.borderColor = "#2a2a2a")}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Team Size</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  style={inputStyle}
                  onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#00e5cc")}
                  onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#2a2a2a")}
                />
              </div>
            </div>

            {submitError && <ErrorMessage message={submitError} />}

            <button
              type="submit"
              disabled={submitting || polling}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 24px",
                background: submitting || polling ? "#1a1a1a" : "#00e5cc",
                color: submitting || polling ? "#666" : "#0a0a0a",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: submitting || polling ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <FlaskConical size={16} />
              {submitting ? "Launching…" : polling ? "Running…" : "Run Simulation"}
            </button>
          </form>
        </div>

        {/* Results */}
        <div style={{ flex: 1 }}>
          {result && (
            <div
              style={{
                background: "#111111",
                border: "1px solid #2a2a2a",
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>Simulation Result</h2>
                <StatusBadge status={result.status} />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Job ID
                </span>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "13px", color: "#888", marginTop: "4px" }}>
                  {result.job_id}
                </div>
              </div>

              {result.scenario_name && (
                <div style={{ marginBottom: "12px" }}>
                  <span style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Scenario
                  </span>
                  <div style={{ fontSize: "14px", color: "#ccc", marginTop: "4px" }}>{result.scenario_name}</div>
                </div>
              )}

              {result.confidence_interval !== undefined && (
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Confidence
                  </span>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "24px", color: "#00e5cc", fontWeight: 700, marginTop: "4px" }}>
                    {(result.confidence_interval * 100).toFixed(1)}%
                  </div>
                </div>
              )}

              {result.outcomes && (
                <div>
                  <span style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                    Outcomes
                  </span>
                  <pre
                    style={{
                      background: "#0a0a0a",
                      border: "1px solid #1a1a1a",
                      borderRadius: "8px",
                      padding: "16px",
                      fontSize: "12px",
                      fontFamily: "JetBrains Mono, monospace",
                      color: "#aaa",
                      overflowX: "auto",
                      lineHeight: "1.6",
                    }}
                  >
                    {JSON.stringify(result.outcomes, null, 2)}
                  </pre>
                </div>
              )}

              {polling && (
                <div style={{ marginTop: "12px", fontSize: "13px", color: "#666", fontStyle: "italic" }}>
                  Polling for results every 3 seconds…
                </div>
              )}
            </div>
          )}

          {!result && (
            <div
              style={{
                background: "#111111",
                border: "1px dashed #2a2a2a",
                borderRadius: "12px",
                padding: "48px",
                textAlign: "center",
                color: "#555",
              }}
            >
              <FlaskConical size={40} style={{ margin: "0 auto 16px" }} />
              <p style={{ fontSize: "14px" }}>Run a simulation to see results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
