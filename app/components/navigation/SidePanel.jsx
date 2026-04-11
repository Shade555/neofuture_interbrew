"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard.png" },
  { href: "/collections", label: "Collection", icon: "folder.png" },
  {
    href: "/scenario-practice",
    label: "Scenario Practice",
    icon: "scenario-practice.png",
  },
  { href: "/leaderboard", label: "Leaderboard", icon: "leaderboard.png" },
  { href: "/challenge", label: "Challenge", icon: "challenges.png" },
];

export default function SidePanel() {
  const pathname = usePathname() || "/";

  return (
    <aside className="fixed left-0 top-0 h-full z-30 bg-zinc-950/95 border-r border-white/10">
      <div className="sidebar flex h-full flex-col items-start">
        <div className="flex items-center h-16 w-16 sidebar-expandable transition-all duration-200 ease-in-out px-3">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full bg-zinc-500/40 dark:bg-zinc-600/40"
              aria-hidden="true"
            />
            <div className="sr-only">InterBrew</div>
          </div>
        </div>

        <nav className="mt-4 w-16 sidebar-expandable transition-all duration-200 flex flex-col gap-3">
          {items.map((it) => {
            const active = pathname.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`relative group flex items-center gap-3 px-3 h-12 text-sm rounded-md transition-all duration-200 overflow-hidden hover:rounded-lg hover:bg-white/10 ${active ? "bg-white/12" : ""}`}
              >
                {/* removed right-side glow/pill to avoid global pill effect */}

                <div className="w-10 h-10 flex-none shrink-0 flex items-center justify-center">
                  <img
                    src={`/SidePanel/${it.icon}`}
                    alt={it.label}
                    className="w-7 h-7 object-contain nav-icon-tint"
                  />
                </div>

                <div className="overflow-hidden whitespace-nowrap opacity-0 label transition-all duration-200 text-zinc-300">
                  {it.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto w-16 sidebar-expandable transition-all duration-200 px-3 mb-6">
          <div className="text-xs opacity-0 label transition-opacity text-zinc-400">
            Made by Aureon
          </div>
        </div>
      </div>
    </aside>
  );
}
