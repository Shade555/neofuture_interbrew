"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TopNav() {
  const [streak, setStreak] = useState(10);

  useEffect(() => {
    let mounted = true;
    async function loadStreak() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) return;
        const { data, error } = await supabase
          .from("user_dashboards")
          .select("streak")
          .eq("user_id", userId)
          .single();
        if (error) {
          console.debug("TopNav: failed to load streak", error);
          return;
        }
        if (!mounted) return;
        setStreak(data?.streak ?? 0);
      } catch (e) {
        console.error("TopNav error loading streak", e);
      }
    }
    loadStreak();
    function onStreakUpdated(e) {
      try {
        const s = e?.detail?.streak;
        if (typeof s === "number") setStreak(s);
      } catch (e) {}
    }
    window.addEventListener("streak:updated", onStreakUpdated);
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between px-6 bg-zinc-950/95 border-b border-white/10">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-2xl font-semibold nav-accent">
          InterBrew
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-transparent mr-6 hover:bg-white/10 transition-colors">
              <img
                src="/TopPanel/fire.png"
                alt="activity"
                className="w-7 h-7 object-contain nav-icon-tint"
              />
              <div className="text-base font-medium">{streak}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Your current streak</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/about">
              <button className="p-2 rounded hover:bg-white/10 transition-colors">
                <img
                  src="/TopPanel/about.png"
                  alt="about"
                  className="w-7 h-7 object-contain nav-icon-tint"
                />
              </button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>About</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/help">
              <button className="p-2 rounded hover:bg-white/10 transition-colors">
                <img
                  src="/TopPanel/help.png"
                  alt="help"
                  className="w-7 h-7 object-contain nav-icon-tint"
                />
              </button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Help</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/feedback">
              <button className="p-2 rounded hover:bg-white/10 transition-colors">
                <img
                  src="/TopPanel/feedback.png"
                  alt="messages"
                  className="w-7 h-7 object-contain nav-icon-tint"
                />
              </button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Feedback</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/profile">
              <button className="p-2 rounded hover:bg-white/10 transition-colors">
                <img
                  src="/TopPanel/profile.png"
                  alt="profile"
                  className="w-7 h-7 object-contain rounded-full nav-icon-tint"
                />
              </button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Profile</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
