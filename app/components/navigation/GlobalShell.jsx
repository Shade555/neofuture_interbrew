"use client";

import { usePathname } from "next/navigation";
import SidePanel from "./SidePanel";
import TopNav from "./TopNav";
import Background from "../Background";

export default function GlobalShell({ children }) {
  const pathname = usePathname() || "/";
  const isLanding = pathname === "/";
  const isAuthPage = pathname.startsWith("/auth");

  if (isLanding || isAuthPage)
    return (
      <>
        <Background />
        <div
          className={`px-4 py-4 ${isLanding ? "home-no-scrollbar" : ""} min-h-screen overflow-hidden`}
        >
          {children}
        </div>
      </>
    );

  return (
    <div className="min-h-screen">
      <Background />
      <TopNav />
      <SidePanel />
      {/* connector: sits above side panel (z-40) but below TopNav (z-50) to mask seam */}
      <div
        className="absolute left-0 top-0 h-16 w-16 z-40 bg-zinc-950/95"
        aria-hidden="true"
      />

      <main className="pt-16">
        <div className="pl-16">{children}</div>
      </main>
    </div>
  );
}
