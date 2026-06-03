"use client";

import { useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";

function DashboardEffects() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let tx = cx, ty = cy;

    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; if (cursor) cursor.style.opacity = "1"; };
    const onLeave = () => { cursor.style.opacity = "0"; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    let rafId: number;
    function animCursor() {
      if (!cursor) return;
      cx += (tx - cx) * 0.15;
      cy += (ty - cy) * 0.15;
      cursor.style.left = cx + "px";
      cursor.style.top = cy + "px";
      rafId = requestAnimationFrame(animCursor);
    }
    animCursor();

    // 3D card tilt — applied to all .tilt-card elements
    function applyTilt(e: MouseEvent) {
      const card = (e.target as Element).closest(".tilt-card") as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(1200px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateZ(4px)`;
    }
    function resetTilt(e: MouseEvent) {
      const card = (e.target as Element).closest(".tilt-card") as HTMLElement | null;
      if (card) card.style.transform = "";
    }
    document.addEventListener("mousemove", applyTilt);
    document.addEventListener("mouseleave", resetTilt, true);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mousemove", applyTilt);
      document.removeEventListener("mouseleave", resetTilt, true);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed", pointerEvents: "none", zIndex: 9999,
        width: "40px", height: "40px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,229,204,0.45) 0%, rgba(0,229,204,0.1) 60%, transparent 100%)",
        transform: "translate(-50%,-50%)", left: "-100px", top: "-100px",
        opacity: 0, transition: "opacity 0.3s",
        mixBlendMode: "multiply",
      }}
    />
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F8FA" }}>
      <DashboardEffects />
      <Sidebar />
      <main style={{
        flex: 1, marginLeft: "240px", minHeight: "100vh",
        overflowY: "auto", padding: "48px",
        background: "#F7F8FA",
        animation: "pageFadeIn 0.2s ease forwards",
      }}>
        <style>{`
          @keyframes pageFadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .tilt-card { transition: transform 0.25s cubic-bezier(.22,1,.36,1), box-shadow 0.25s; }
        `}</style>
        {children}
      </main>
    </div>
  );
}
