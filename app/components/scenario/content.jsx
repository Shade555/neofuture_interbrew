"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import "./content.css";

const badgeColors = {
  Outstanding: "text-sky-300 bg-sky-400/10 border-sky-500/20",
  Excellent: "text-violet-300 bg-violet-400/10 border-violet-500/20",
  Good: "text-amber-300 bg-amber-400/10 border-amber-500/20",
  Average: "text-gray-400 bg-gray-400/10 border-gray-600/20",
};

const ScoreBar = ({ score }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-1.5 rounded-full bg-white/30 transition-all duration-500"
        style={{ width: `${score}%` }}
      />
    </div>
    <span className="text-xs text-gray-400 w-7 text-right">{score}</span>
  </div>
);

export default function Content({ selectedScenario, onStartPractice }) {
  const [tab, setTab] = useState("overview");
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgRef = useRef(null);

  const [overviewStats, setOverviewStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [insights, setInsights] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContentData() {
      if (!supabase) {
        console.warn("Supabase client not configured");
        setLoading(false);
        return;
      }

      try {
        // These tables don't exist yet — skip fetching to avoid 404s
        // Uncomment and create the tables when ready:
        // overview_stats, practice_history, ai_insights, performance_chart
        setOverviewStats([]);
        setRecentActivity([]);
        setInsights([]);
        setChartData([]);
      } catch (err) {
        console.error("Failed to fetch content data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchContentData();
  }, []);

  return (
    <div className="h-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-white">
              {selectedScenario ? selectedScenario.title : "Overall"}
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {selectedScenario
              ? selectedScenario.description
              : "Track and improve your interview skills"}
          </p>
        </div>
        {selectedScenario && (
          <button
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 hover:border-emerald-500/40 text-white text-sm font-medium transition-colors duration-200"
            onClick={onStartPractice}
          >
            Start Practice
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/4 rounded-xl p-1 w-fit border border-white/8">
        {["overview", "history", "insights"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
              tab === t
                ? "text-white border border-emerald-500/50"
                : "text-gray-500 hover:border hover:border-emerald-500/30"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Modules Done",
                value:
                  overviewStats.find((s) =>
                    s.label?.toLowerCase().includes("module"),
                  )?.value ?? "—",
                sub:
                  overviewStats.find((s) =>
                    s.label?.toLowerCase().includes("module"),
                  )?.sub ?? null,
                color: "text-white",
              },
              {
                label: "Avg Score",
                value:
                  overviewStats.find(
                    (s) =>
                      s.label?.toLowerCase().includes("avg") ||
                      s.label?.toLowerCase().includes("score"),
                  )?.value ??
                  (chartData.length >= 2
                    ? (
                        chartData.reduce((a, b) => a + b, 0) / chartData.length
                      ).toFixed(1)
                    : "—"),
                sub:
                  overviewStats.find(
                    (s) =>
                      s.label?.toLowerCase().includes("avg") ||
                      s.label?.toLowerCase().includes("score"),
                  )?.sub ?? null,
                color: "text-white",
              },
              {
                label: "Hours Spent",
                value:
                  overviewStats.find((s) =>
                    s.label?.toLowerCase().includes("hour"),
                  )?.value ?? "—",
                sub:
                  overviewStats.find((s) =>
                    s.label?.toLowerCase().includes("hour"),
                  )?.sub ?? null,
                color: "text-white",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/3 border border-white/8 rounded-xl p-3 hover:border-emerald-500/30 transition-colors duration-200"
              >
                <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
                <p className={`text-xl font-semibold ${stat.color}`}>
                  {stat.value}
                </p>
                {stat.sub && (
                  <p className="text-xs text-gray-500">↑ {stat.sub}</p>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-white">
                  Performance Chart
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Score trend in last · 14 days
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-0 relative">
              {(() => {
                const data =
                  chartData.length >= 2
                    ? chartData
                    : [
                        55, 62, 48, 65, 58, 72, 60, 78, 55, 70, 80, 65, 74, 58,
                        82, 68, 76, 60, 88, 72, 65, 78, 55, 70, 75, 82, 68, 91,
                        78, 72, 60, 68, 58, 72, 65, 80, 70, 76, 62, 74, 68, 58,
                        72, 65, 70,
                      ];
                const w = 500,
                  h = 100;
                const min = Math.min(...data) - 5;
                const max = Math.max(...data) + 5;
                const xStep = w / (data.length - 1);
                const yScale = (v) =>
                  h - 10 - ((v - min) / (max - min)) * (h - 20);
                const xs = data.map((_, i) => i * xStep);
                const ys = data.map((v) => yScale(v));

                let linePath = `M ${xs[0]},${ys[0]}`;
                for (let i = 1; i < data.length; i++) {
                  const cpx1 = xs[i - 1] + xStep / 3;
                  const cpx2 = xs[i] - xStep / 3;
                  linePath += ` C ${cpx1},${ys[i - 1]} ${cpx2},${ys[i]} ${xs[i]},${ys[i]}`;
                }
                const areaPath = `${linePath} L ${xs[data.length - 1]},${h} L ${xs[0]},${h} Z`;

                // percentage positions for HTML overlay (immune to SVG distortion)
                const hxPct =
                  hoverIdx !== null ? (xs[hoverIdx] / w) * 100 : null;
                const hyPct =
                  hoverIdx !== null ? (ys[hoverIdx] / h) * 100 : null;
                const hScore = hoverIdx !== null ? data[hoverIdx] : null;

                // peak position (always visible)
                const peakIdx = data.indexOf(Math.max(...data));
                const peakXPct = (xs[peakIdx] / w) * 100;
                const peakYPct = (ys[peakIdx] / h) * 100;

                return (
                  <>
                    <svg
                      ref={svgRef}
                      viewBox={`0 0 ${w} ${h}`}
                      className="w-full h-full cursor-crosshair"
                      preserveAspectRatio="none"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const xRatio = (e.clientX - rect.left) / rect.width;
                        const idx = Math.round(xRatio * (data.length - 1));
                        setHoverIdx(
                          Math.max(0, Math.min(data.length - 1, idx)),
                        );
                      }}
                      onMouseLeave={() => setHoverIdx(null)}
                    >
                      <defs>
                        <linearGradient
                          id="areaGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#10b981"
                            stopOpacity="0.15"
                          />
                          <stop
                            offset="100%"
                            stopColor="#10b981"
                            stopOpacity="0"
                          />
                        </linearGradient>
                        <filter
                          id="glow"
                          x="-20%"
                          y="-20%"
                          width="140%"
                          height="140%"
                        >
                          <feGaussianBlur stdDeviation="1.5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      <path d={areaPath} fill="url(#areaGrad)" />
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>

                    {/* HTML tooltip — not affected by SVG distortion */}
                    {hoverIdx !== null && (
                      <div
                        className="pointer-events-none absolute"
                        style={{
                          left: `clamp(36px, ${hxPct}%, calc(100% - 36px))`,
                          top: `clamp(28px, ${hyPct}%, calc(100% - 8px))`,
                          transform: "translate(-50%, -130%)",
                        }}
                      >
                        <div className="px-2.5 py-1 rounded-lg bg-white/8 border border-white/12 backdrop-blur-sm">
                          <span className="text-xs text-white/80 font-medium whitespace-nowrap">
                            Score: {hScore}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Persistent peak card */}
                    <div
                      className="pointer-events-none absolute"
                      style={{
                        left: `clamp(36px, ${peakXPct}%, calc(100% - 36px))`,
                        top: `clamp(28px, ${peakYPct}%, calc(100% - 8px))`,
                        transform: "translate(-50%, -130%)",
                      }}
                    >
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 backdrop-blur-sm">
                        <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">
                          Score: {Math.max(...data)}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">Scenario List</h3>
          </div>
          <div className="content-scroll flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
            {loading ? (
              <p className="text-xs text-gray-500 text-center mt-4">
                Loading history...
              </p>
            ) : recentActivity.length === 0 ? (
              <p className="text-xs text-gray-500 text-center mt-4">
                No practice history yet.
              </p>
            ) : (
              recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/3 border border-white/8 hover:border-emerald-500/30 transition-colors duration-150"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {item.scenario}
                    </p>
                    <p className="text-xs text-gray-600">{item.date}</p>
                  </div>
                  <div className="w-36">
                    <ScoreBar score={item.score} />
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeColors[item.badge]}`}
                  >
                    {item.badge}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Insights */}
      {tab === "insights" && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex-1 min-h-0 flex flex-col">
          <h3 className="text-sm font-medium text-white mb-3">AI Insights</h3>
          <div className="content-scroll flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
            {loading ? (
              <p className="text-xs text-gray-500 text-center mt-4">
                Loading insights...
              </p>
            ) : insights.length === 0 ? (
              <p className="text-xs text-gray-500 text-center mt-4">
                No insights available yet.
              </p>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.title}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/8 hover:border-emerald-500/30 transition-colors duration-150"
                >
                  {insight.icon && (
                    <div className="text-2xl">{insight.icon}</div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 font-medium">
                      {insight.title}
                    </p>
                    <p className="text-sm text-white font-medium mt-0.5">
                      {insight.value}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {insight.note}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
