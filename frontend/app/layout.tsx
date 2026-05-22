import "./globals.css";
import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "ProITBridge — Engineering Workflow Automation",
  description:
    "Strive For Better Future. AI-powered engineering workflow automation by ProITBridge — detect deployment risk, analyze incidents, and orchestrate Zapier in real time.",
  icons: {
    icon: "/proitbridge-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
