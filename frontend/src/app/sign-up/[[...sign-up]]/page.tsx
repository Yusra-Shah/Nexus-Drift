import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#0a0a0a",
      }}
    >
      <SignUp
        appearance={{
          variables: {
            colorBackground: "#111111",
            colorInputBackground: "#1a1a1a",
            colorText: "#ffffff",
            colorTextSecondary: "#888888",
            colorPrimary: "#00e5cc",
            colorDanger: "#ef4444",
            borderRadius: "8px",
            fontFamily: "Inter, sans-serif",
          },
          elements: {
            card: {
              border: "1px solid #2a2a2a",
              boxShadow: "0 4px 16px rgba(0,0,0,0.8)",
            },
          },
        }}
      />
    </div>
  );
}
