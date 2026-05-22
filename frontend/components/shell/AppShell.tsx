"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 min-w-0">{children}</main>
        <footer className="px-6 lg:px-10 py-6 text-xs text-slate-300/80 flex items-center justify-between border-t border-white/[0.08]">
          <span>
            © {new Date().getFullYear()} ProITBridge ·{" "}
            <span className="italic text-cyan-200/80">
              Strive For Better Future
            </span>
          </span>
          <span className="opacity-70">
            Powered by Groq · Zapier · FastAPI · Next.js
          </span>
        </footer>
      </div>
    </div>
  );
}
