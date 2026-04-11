"use client";

import React, { useState } from "react";
import MockPanel from "../../../components/collections/MockPanel";
import ProblemPanel from "../../../components/collections/ProblemPanel";

interface Props {
  params: { topic: string };
}

export default function TopicPage({ params }: Props) {
  // `params` may be a Promise in Next.js; unwrap with React.use()
  // React.use is the helper to synchronously unwrap route params when running as a client component
  // (keeps behavior compatible with Next.js async param handling)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolvedParams = (React as any).use ? (React as any).use(params) : params;
  const topic = resolvedParams.topic.replace(/-/g, " ");
  const [showMock, setShowMock] = useState(false);
  const [showProblem, setShowProblem] = useState(false);

  return (
    <div className="no-card-hover p-4 mt-4 min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-lg p-4 bg-transparent recommended-card min-h-80">
        <div className="h-full flex items-center justify-center text-white opacity-80">{/* Graph placeholder */}
          <svg className="w-full h-full" viewBox="0 0 600 300" preserveAspectRatio="none">
            <rect x="8" y="8" width="584" height="284" rx="8" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.06)" />
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#9CA3AF">Graph</text>
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-4 h-full">
        <button onClick={() => setShowMock(true)} className="w-full rounded-md bg-transparent recommended-card h-16 flex items-center justify-center">Mock Interview</button>
        <button className="w-full rounded-md bg-transparent recommended-card h-16 flex items-center justify-center">Modules</button>
        <div onClick={() => setShowProblem(true)} className="w-full rounded-md bg-transparent recommended-card flex-1 p-6 flex items-center justify-center cursor-pointer">
          <div className="text-center">
            <div className="font-medium">Problem Solving Skills</div>
            <div className="text-sm opacity-80 mt-2">38/48</div>
          </div>
        </div>
      </div>

      {showMock && <MockPanel topic={topic} onClose={() => setShowMock(false)} />}
      {showProblem && <ProblemPanel topic={topic} onClose={() => setShowProblem(false)} />}
    </div>
  );
}
