import type { ReactNode } from "react";
import Navbar from "./Navbar";
import LiveFeedToast from "./LiveFeedToast";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div
        style={{
          padding: "24px",
          paddingTop: 104,
          maxWidth: 1400,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </div>
      <LiveFeedToast />
    </>
  );
}