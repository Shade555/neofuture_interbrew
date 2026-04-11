"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ProblemPanel({ topic, onClose }: { topic: string; onClose: () => void }) {
  const items = [
    "Problem Solving Skills #1",
    "Problem Solving Skills #2",
    "Problem Solving Skills #3",
  ];

  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    items.forEach((it) => (init[it] = false));
    return init;
  });

  function toggle(it: string) {
    setCompleted((p) => ({ ...p, [it]: !p[it] }));
  }

  const topicSlug = topic.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl p-6 rounded-lg bg-transparent recommended-card">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold">{topic} — Problem Solving</div>
            <div className="text-sm opacity-80">Practice problems and progress</div>
          </div>
          <button onClick={onClose} className="px-3 py-1 rounded-md bg-white/10">Close</button>
        </div>

        <div className="mt-4 space-y-3">
          {items.map((it) => {
            const slug = it.toLowerCase().replace(/\s+/g, "-");
            return (
              <div key={it} className="flex items-center gap-4">
                <button onClick={() => toggle(it)} className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center">
                  {completed[it] ? <span className="text-green-400">✓</span> : <span className="opacity-50">○</span>}
                </button>
                <Link href={`/collections/${topicSlug}/problems/${slug}`} className="flex-1 rounded-md p-3 bg-black/40 border border-white/10 hover:bg-black/50">
                  {it}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
