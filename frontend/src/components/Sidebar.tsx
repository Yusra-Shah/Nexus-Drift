"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Network, Clock, AlertTriangle, Users, FlaskConical, Eye } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import AgentStatusBar from "./AgentStatusBar";

const NAV_ITEMS = [
  { label: "Graph Explorer", icon: Network,       href: "/dashboard/graph" },
  { label: "Time Machine",   icon: Clock,         href: "/dashboard/timeline" },
  { label: "Risk Dashboard", icon: AlertTriangle, href: "/dashboard/risks" },
  { label: "Expertise Map",  icon: Users,         href: "/dashboard/expertise" },
  { label: "Sim Studio",     icon: FlaskConical,  href: "/dashboard/simulate" },
  { label: "Watchtower",     icon: Eye,           href: "/dashboard/alerts" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: "240px", minWidth: "240px", height: "100vh",
      background: "#FFFFFF", borderRight: "1px solid #EEEEEE",
      display: "flex", flexDirection: "column",
      position: "fixed", top: 0, left: 0, zIndex: 50, overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{
        height: "64px", display: "flex", alignItems: "center", padding: "0 20px",
        borderBottom: "1px solid #EEEEEE", flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "13px",
          color: "#00e5cc", letterSpacing: "0.12em", textTransform: "uppercase",
        }}>
          ⬡ Nexus Drift
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: "12px",
              height: "44px", padding: "0 12px", margin: "2px 8px", borderRadius: "8px",
              textDecoration: "none",
              borderLeft: isActive ? "2px solid #00e5cc" : "2px solid transparent",
              background: isActive ? "#F5FFFE" : "transparent",
              color: isActive ? "#111111" : "#666666",
              transition: "all 0.15s ease",
            }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "#F9F9F9";
                  (e.currentTarget as HTMLElement).style.color = "#333333";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#666666";
                }
              }}
            >
              <Icon size={18} color={isActive ? "#00e5cc" : "currentColor"} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 400 }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <AgentStatusBar />

      <div style={{
        padding: "16px 20px 24px", borderTop: "1px solid #EEEEEE",
        display: "flex", alignItems: "center",
      }}>
        <UserButton appearance={{ elements: { avatarBox: { width: "32px", height: "32px" } } }} />
      </div>
    </aside>
  );
}
