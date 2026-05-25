import Sidebar from "@/components/Sidebar";

// Route is protected by clerkMiddleware in middleware.ts
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: "240px",
          minHeight: "100vh",
          overflowY: "auto",
          padding: "48px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
