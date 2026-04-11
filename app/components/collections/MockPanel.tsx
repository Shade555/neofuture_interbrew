"use client";

import React, { useState } from "react";
// supabase not needed here; favourites handled in the interview panel

export default function MockPanel({ topic, onClose, onStart }: { topic: string; onClose: () => void; onStart?: (d: string) => void }) {
  const levels = ["Beginner", "Intermediate", "Advanced"];
  const rounds = ["Aptitude", "Verbal", "Technical"];
  const [completed, setCompleted] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    levels.forEach((l) => {
      init[l] = new Set();
    });
    return init;
  });

  function toggle(level: string, round: string) {
    setCompleted((prev) => {
      const copy: Record<string, Set<string>> = {};
      Object.keys(prev).forEach((k) => (copy[k] = new Set(prev[k])));
      if (copy[level].has(round)) copy[level].delete(round);
      else copy[level].add(round);
      return copy;
    });
  }

  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-4xl p-6 rounded-lg bg-transparent recommended-card">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold">{topic} — Mock Rounds</div>
            <div className="text-sm opacity-80">Practice rounds across levels</div>
          </div>
          <button onClick={onClose} className="px-3 py-1 rounded-md bg-white/10">Close</button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          {levels.map((lvl) => (
            <div key={lvl} className="rounded-md p-4 bg-black/40 border border-white/10">
              <div className="flex items-center justify-between">
                <div
                  className="font-medium cursor-pointer"
                  onClick={() => onStart?.(lvl)}
                >
                  {lvl}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStart?.(lvl);
                    }}
                    className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm mr-2"
                  >
                    Start
                  </button>
                  {lvl === 'Beginner' && <div className="text-sm opacity-80">Report</div>}
                </div>
              </div>
              <ul className="mt-3 space-y-2">
                {rounds.map((r) => (
                  <li key={r} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggle(lvl, r)} className="w-6 h-6 rounded-full border border-white/40 flex items-center justify-center">
                        {completed[lvl]?.has(r) ? <span className="text-green-400">✓</span> : <span className="opacity-50">○</span>}
                      </button>
                      <span className="text-sm">{r}</span>
                    </div>
                    <div className="text-sm opacity-70">...</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
