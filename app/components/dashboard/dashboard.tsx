"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { supabase } from "../../../lib/supabaseClient";

function Calendar() {
  const today = new Date();
  const [current, setCurrent] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(
    null
  );
  const [anchorFixed, setAnchorFixed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const addFormRef = useRef<HTMLDivElement | null>(null);

  const [interviews, setInterviews] = useState<Array<any>>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [difficultyInput, setDifficultyInput] = useState("intermediate");
  const [roundInput, setRoundInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [showAddFormModal, setShowAddFormModal] = useState(false);
  const [monthInterviewsMap, setMonthInterviewsMap] = useState<
    Record<number, any[]>
  >({});

  useEffect(() => {
    function handlePointer(e: PointerEvent) {
      if (!containerRef.current) return;
      if (selected != null && anchor) {
        const target = e.target as Node;
        const inContainer = containerRef.current.contains(target);
        const inDropdown = dropdownRef.current?.contains(target);
        const inAddModal = addFormRef.current?.contains(target);
        if (!inContainer && !inDropdown && !inAddModal) {
          setSelected(null);
          setAnchor(null);
          setAnchorFixed(false);
        }
      }
    }
    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, [selected, anchor]);

  const month = current.getMonth();
  const year = current.getFullYear();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const total = 42;
  const cells = Array.from({ length: total }).map((_, i) => {
    const dayIndex = i - firstDay + 1;
    if (dayIndex <= 0) {
      const d = prevMonthDays + dayIndex;
      return { type: "prev", day: d };
    } else if (dayIndex > daysInMonth) {
      const d = dayIndex - daysInMonth;
      return { type: "next", day: d };
    } else {
      return { type: "current", day: dayIndex };
    }
  });

  function prevMonth() {
    setCurrent(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setCurrent(new Date(year, month + 1, 1));
  }

  function handleDateClick(
    e: React.MouseEvent<HTMLDivElement>,
    d: number,
    type: string
  ) {
    const el = e.currentTarget as HTMLDivElement;
    setShowAddFormModal(false);
    if (type !== "current") {
      if (type === "prev") {
        setCurrent(new Date(year, month - 1, 1));
      } else if (type === "next") {
        setCurrent(new Date(year, month + 1, 1));
      }
    }
    const rect = el.getBoundingClientRect();
    const left = rect.left;
    const top = rect.bottom;
    if (selected === d) {
      setSelected(null);
      setAnchor(null);
      setAnchorFixed(false);
    } else {
      setSelected(d);
      setAnchor({ left, top });
      setAnchorFixed(true);
    }
  }

  const fetchInterviewsForDay = useCallback(
    async (day: number) => {
      try {
        setLoadingInterviews(true);
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) return setInterviews([]);
        const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const { data, error } = await supabase
          .from("user_interviews")
          .select("*")
          .eq("user_id", userId)
          .eq("interview_date", iso)
          .order("created_at", { ascending: false });
        if (error) {
          console.error("Failed to load interviews", error);
          setInterviews([]);
          return;
        }
        setInterviews(data ?? []);
      } finally {
        setLoadingInterviews(false);
      }
    },
    [month, year]
  );

  const fetchInterviewsForMonth = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return setMonthInterviewsMap({});
      const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, "0")}`;
      const { data, error } = await supabase
        .from("user_interviews")
        .select("*")
        .eq("user_id", userId)
        .gte("interview_date", start)
        .lte("interview_date", end)
        .order("interview_date", { ascending: true });
      if (error) {
        console.error("Failed to load monthly interviews", error);
        setMonthInterviewsMap({});
        return;
      }
      const map: Record<number, any[]> = {};
      (data ?? []).forEach((iv: any) => {
        try {
          const day = new Date(iv.interview_date).getDate();
          map[day] = map[day] || [];
          map[day].push(iv);
        } catch (e) {
          // ignore
        }
      });
      setMonthInterviewsMap(map);
    } catch (e) {
      console.error(e);
      setMonthInterviewsMap({});
    }
  }, [month, year]);

  useEffect(() => {
    if (selected != null) {
      void fetchInterviewsForDay(selected);
    } else {
      setInterviews([]);
    }
  }, [selected, fetchInterviewsForDay]);

  useEffect(() => {
    void fetchInterviewsForMonth();
  }, [fetchInterviewsForMonth]);

  async function saveInterviewForDay(day: number) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      const userEmail = userData?.user?.email;
      if (!userId) throw new Error("Not signed in");
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const payload = {
        user_id: userId,
        interview_date: iso,
        subject: subjectInput,
        difficulty: difficultyInput,
        round: roundInput,
        notes: notesInput,
        user_email: userEmail,
      };
      const { data, error } = await supabase
        .from("user_interviews")
        .insert(payload)
        .select();
      if (error) {
        console.error("Failed to save interview", error);
        return false;
      }
      await fetchInterviewsForDay(day);
      await fetchInterviewsForMonth();
      setSubjectInput("");
      setDifficultyInput("medium");
      setRoundInput("technical");
      setNotesInput("");
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async function updateInterviewStatus(id: string | number, status: string) {
    try {
      const { data, error } = await supabase
        .from("user_interviews")
        .update({ status })
        .eq("id", id)
        .select();
      if (error) {
        console.error("Failed to update interview status", error);
        return false;
      }
      if (selected != null) await fetchInterviewsForDay(selected);
      await fetchInterviewsForMonth();
      return true;
    } catch (e) {
      console.error("updateInterviewStatus exception", e);
      return false;
    }
  }

  const monthLabel = current.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl border border-white/10 bg-[#111214] p-4 text-white"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            ◀
          </button>
          <div className="font-semibold text-zinc-100">{monthLabel}</div>
          <button
            onClick={nextMonth}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            ▶
          </button>
        </div>
        <div className="text-xs text-zinc-400">Pending</div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
          <div
            key={`${d}-${idx}`}
            className="text-center text-zinc-500 font-medium"
          >
            {d}
          </div>
        ))}

        {cells.map((cell, idx) => (
          <div key={idx} className="h-8 flex items-center justify-center">
            <div
              onClick={(e) => handleDateClick(e, cell.day, cell.type)}
              role="button"
              tabIndex={0}
              className={`relative w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                cell.type === "current"
                  ? selected === cell.day
                    ? "bg-emerald-500/30 border border-emerald-500/50 text-zinc-100"
                    : "text-zinc-300 hover:bg-white/10 border border-transparent"
                  : "text-zinc-600"
              }`}
            >
              <div>{cell.day}</div>
              {cell.type === "current" &&
                (() => {
                  const dayMap = monthInterviewsMap[cell.day] || [];
                  const hasScheduled = dayMap.length > 0;
                  const hasCompleted = dayMap.some(
                    (iv: any) => iv.status === "completed"
                  );
                  const hasMissed = dayMap.some(
                    (iv: any) => iv.status === "missed"
                  );
                  if (hasCompleted) {
                    return (
                      <div className="absolute -right-1 -top-1 bg-emerald-500 rounded-full w-3 h-3 flex items-center justify-center text-[8px] text-white">
                        ✓
                      </div>
                    );
                  }
                  if (hasMissed) {
                    return (
                      <div className="absolute -right-1 -top-1 bg-red-600 rounded-full w-3 h-3 flex items-center justify-center text-[8px] text-white">
                        ✕
                      </div>
                    );
                  }
                  if (hasScheduled) {
                    return (
                      <div className="absolute -right-0.5 -top-0.5 bg-emerald-400 rounded-full w-2 h-2" />
                    );
                  }
                  return null;
                })()}
            </div>
          </div>
        ))}
      </div>

      {selected &&
        anchor &&
        (() => {
          const dd = (
            <div
              ref={dropdownRef}
              className={`${anchorFixed ? "fixed" : "absolute"} z-50 w-72 sm:w-96 bg-black/80 border border-white/20 rounded-lg p-3 shadow-lg text-sm`}
            >
              <div className="text-xs text-zinc-400 mb-2">
                {selected} {current.toLocaleString(undefined, { month: "short" })}
              </div>

              <div className="mb-3">
                <div className="font-semibold text-zinc-100 mb-2">
                  Scheduled interviews
                </div>
                {loadingInterviews ? (
                  <div className="text-xs text-zinc-500">Loading…</div>
                ) : interviews.length ? (
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {interviews.map((iv: any) => (
                      <li
                        key={iv.id}
                        className="p-2 rounded bg-white/5 border border-white/10"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium text-zinc-100">
                              {iv.subject || "Untitled"}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {iv.round} · {iv.difficulty}
                            </div>
                            {iv.notes && (
                              <div className="mt-1 text-xs text-zinc-600">
                                {iv.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {iv.status === "completed" && (
                              <div className="text-xs text-emerald-400">
                                Completed
                              </div>
                            )}
                            {iv.status === "missed" && (
                              <div className="text-xs text-red-400">Missed</div>
                            )}
                            <div className="flex gap-1">
                              {iv.status !== "completed" && (
                                <button
                                  onClick={async () =>
                                    await updateInterviewStatus(
                                      iv.id,
                                      "completed"
                                    )
                                  }
                                  className="text-xs px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 transition-colors"
                                >
                                  Complete
                                </button>
                              )}
                              {iv.status !== "missed" && (
                                <button
                                  onClick={async () =>
                                    await updateInterviewStatus(iv.id, "missed")
                                  }
                                  className="text-xs px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 transition-colors"
                                >
                                  Missed
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-zinc-500">
                    No interviews scheduled
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setShowAddFormModal(true);
                  }}
                  className="px-2 py-1 rounded bg-emerald-600 text-xs hover:bg-emerald-700 transition-colors"
                >
                  + Add
                </button>
                <button
                  onClick={() => {
                    setSelected(null);
                    setAnchor(null);
                    setAnchorFixed(false);
                  }}
                  className="px-2 py-1 rounded bg-white/10 text-xs hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
              </div>

              {showAddFormModal &&
                selected &&
                (() => {
                  const modal = (
                    <div className="fixed inset-0 z-60 flex items-center justify-center">
                      <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setShowAddFormModal(false)}
                      />
                      <div
                        ref={addFormRef}
                        className="relative w-full max-w-md p-4 bg-black/80 border border-white/20 rounded-lg text-white"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => setShowAddFormModal(false)}
                            className="px-2 py-1 rounded bg-white/10 text-xs hover:bg-white/20"
                          >
                            Back
                          </button>
                          <div className="text-sm font-semibold">
                            Add interview
                          </div>
                          <div />
                        </div>
                        <div>
                          <input
                            value={subjectInput}
                            onChange={(e) => setSubjectInput(e.target.value)}
                            placeholder="Subject"
                            className="w-full mb-2 rounded px-2 py-1 bg-black/30 border border-white/10 text-sm text-white placeholder:text-zinc-600"
                          />
                          <div className="flex gap-2 mb-2">
                            <select
                              value={difficultyInput}
                              onChange={(e) =>
                                setDifficultyInput(e.target.value)
                              }
                              className="flex-1 rounded px-2 py-1 bg-black/30 border border-white/10 text-sm text-white"
                            >
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                            </select>
                            <input
                              value={roundInput}
                              onChange={(e) => setRoundInput(e.target.value)}
                              placeholder="Round"
                              className="flex-1 rounded px-2 py-1 bg-black/30 border border-white/10 text-sm text-white placeholder:text-zinc-600"
                            />
                          </div>
                          <textarea
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="Notes (optional)"
                            className="w-full mb-2 rounded px-2 py-1 bg-black/30 border border-white/10 text-sm text-white placeholder:text-zinc-600"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setShowAddFormModal(false)}
                              className="px-3 py-1 rounded bg-white/10 text-xs hover:bg-white/20 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                if (selected) {
                                  await saveInterviewForDay(selected);
                                  setShowAddFormModal(false);
                                }
                              }}
                              className="px-3 py-1 rounded bg-emerald-600 text-xs hover:bg-emerald-700 transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  try {
                    return createPortal(modal, document.body);
                  } catch (e) {
                    return modal;
                  }
                })()}
            </div>
          );

          if (anchorFixed && typeof window !== "undefined") {
            try {
              const ddW = 144;
              const leftRaw = anchor.left;
              const topRaw = anchor.top + 6;
              if (window.innerWidth < 640) {
                const top = Math.min(
                  Math.max(topRaw, 8),
                  Math.max(8, window.innerHeight - 120)
                );
                return createPortal(
                  React.cloneElement(dd, { style: { left: 8, right: 8, top } }),
                  document.body
                );
              }
              const maxLeft = Math.max(8, window.innerWidth - ddW - 8);
              const left = Math.min(Math.max(leftRaw, 8), maxLeft);
              const top = topRaw;
              return createPortal(
                React.cloneElement(dd, { style: { left, top } }),
                document.body
              );
            } catch (e) {
              return dd;
            }
          }

          return React.cloneElement(dd, {
            style: { left: anchor.left, top: anchor.top + 36 },
          });
        })()}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [aiScore, setAiScore] = useState(0);
  const [recommendation, setRecommendation] = useState("");
  const [loadingAiReport, setLoadingAiReport] = useState(true);
  const [regeneratingReport, setRegeneratingReport] = useState(false);
  const [showGridLines, setShowGridLines] = useState(true);
  const [yAxisMetric, setYAxisMetric] = useState<"improvement" | "accuracy" | "readiness">("improvement");
  const [badges, setBadges] = useState<Array<any>>([]);
  const [unlockedSections, setUnlockedSections] = useState<Record<string, boolean>>({});
  const [loadingBadges, setLoadingBadges] = useState(true);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [currentModule, setCurrentModule] = useState<{ name: string; path: string } | null>(null);
  const [loadingCurrentModule, setLoadingCurrentModule] = useState(true);

  // Sample data for the last 4 weeks
  const graphData = [55, 62, 48, 65, 58, 72, 60, 78, 65, 82, 75, 88, 80, 92, 85, 95];
  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
  
  const metricLabels = {
    improvement: "Improvement Score",
    accuracy: "Accuracy %",
    readiness: "Readiness Score"
  };

  // Fetch AI Report from Groq
  useEffect(() => {
    const fetchAiReport = async () => {
      try {
        setLoadingAiReport(true);
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const userId = user?.id;

        if (!userId) {
          setAiScore(0);
          setRecommendation("Please log in to see your personalized report.");
          setLoadingAiReport(false);
          return;
        }

        const response = await fetch("/api/ai-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("AI Report API error:", response.status, errorText);
          throw new Error(`Failed to fetch AI report: ${response.status}`);
        }

        const data = await response.json();
        setAiScore(data.score || 0);
        setRecommendation(data.recommendation || "Keep practicing to improve!");
      } catch (err) {
        console.error("Error fetching AI report:", err);
        setAiScore(65);
        setRecommendation("Keep practicing to improve your interview readiness.");
      } finally {
        setLoadingAiReport(false);
      }
    };

    fetchAiReport();
  }, []);

  // Regenerate AI Report
  const handleRegenerateReport = async () => {
    try {
      setRegeneratingReport(true);
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = user?.id;

      if (!userId) return;

      const response = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, forceRefresh: true }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Report regeneration error:", response.status, errorText);
        throw new Error(`Failed to regenerate report: ${response.status}`);
      }

      const data = await response.json();
      setAiScore(data.score || 0);
      setRecommendation(data.recommendation || "Keep practicing to improve!");
    } catch (err) {
      console.error("Error regenerating AI report:", err);
    } finally {
      setRegeneratingReport(false);
    }
  };

  // Fetch badges from collections
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoadingBadges(true);
        
        // Get current user
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const userId = user?.id;

        // Fetch all collection badges
        const { data: badgesData, error: badgesErr } = await supabase
          .from("collection_badges")
          .select("id, label, image_url, section_key")
          .order("order_number", { ascending: true });
        
        if (badgesErr) throw badgesErr;
        setBadges(badgesData ?? []);

        // Determine which batches are unlocked based on section completion
        if (userId) {
          const unlockedMap: Record<string, boolean> = {};
          let anyUnlocked = false;

          // For each badge, check if all modules in that section are completed
          for (const badge of (badgesData ?? [])) {
            // Count total modules in this section
            const { count: totalCount, error: totalErr } = await supabase
              .from("collection_modules")
              .select("id", { count: "exact", head: true })
              .eq("section_key", badge.section_key);
            if (totalErr) continue;

            // Count user's completed modules in this section
            const { count: completedCount, error: completedErr } = await supabase
              .from("user_collection_module_progress")
              .select("module_id, collection_modules!inner(section_key)", {
                count: "exact",
                head: true,
              })
              .eq("user_id", userId)
              .eq("completed", true)
              .eq("collection_modules.section_key", badge.section_key);
            if (completedErr) continue;

            // Unlock if all modules completed
            // Badge should only unlock if: there ARE modules AND all are completed
            const isUnlocked = (totalCount ?? 0) > 0 && (completedCount ?? 0) > 0 && completedCount === totalCount;
            if (isUnlocked) {
              unlockedMap[badge.section_key] = true;
              anyUnlocked = true;
            }
          }

          setUnlockedSections(unlockedMap);
          console.log("Unlocked sections:", unlockedMap, "Any unlocked:", anyUnlocked);
        }
      } catch (err: any) {
        console.error("Error fetching badges:", err?.message || err);
        // Use placeholder badges on error
        const placeholders = [
          { id: "1", label: "Foundation", image_url: "/images/Foundation.png", section_key: "foundation" },
          { id: "2", label: "Scheduling", image_url: "/images/Scheduling.png", section_key: "cpu-scheduling" },
          { id: "3", label: "Concurrency", image_url: "/images/Concurrency.png", section_key: "thread-management" },
        ];
        setBadges(placeholders);
      } finally {
        setLoadingBadges(false);
      }
    };

    fetchBadges();
  }, []);

  // Fetch current module from user_dashboard
  useEffect(() => {
    const fetchCurrentModule = async () => {
      try {
        setLoadingCurrentModule(true);
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const userId = user?.id;

        if (!userId) {
          setLoadingCurrentModule(false);
          return;
        }

        const { data: dashboardData } = await supabase
          .from("user_dashboard")
          .select("current_module_name, current_module_path")
          .eq("user_id", userId)
          .maybeSingle();

        if (dashboardData?.current_module_name && dashboardData?.current_module_path) {
          setCurrentModule({
            name: dashboardData.current_module_name,
            path: dashboardData.current_module_path,
          });
        }
      } catch (err) {
        console.error("Error fetching current module:", err);
      } finally {
        setLoadingCurrentModule(false);
      }
    };

    fetchCurrentModule();
  }, []);

  // Generate SVG path for the graph
  const generateGraphPath = () => {
    const padding = 50;
    const width = 380;
    const height = 120;
    const maxValue = 100;
    
    const xStep = width / (graphData.length - 1);
    const points = graphData.map((value, i) => {
      const x = padding + i * xStep;
      const y = 135 - (value / maxValue) * height;
      return `${x},${y}`;
    });
    
    return points.join(" ");
  };

  return (
    <section className="py-5">
      {/* Top Section: 2-Column Grid - AI Report (Left) and Badges/Certificates (Right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-4 auto-rows-max lg:auto-rows-fr">
        {/* Left Column - AI Report */}
        <div className="rounded-2xl border border-white/10 bg-[#111214] px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-base font-semibold text-zinc-100">
              AI Report
            </h2>
            {/* Regenerate Button */}
            <button
              onClick={handleRegenerateReport}
              disabled={regeneratingReport || loadingAiReport}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                regeneratingReport
                  ? "border-yellow-400/70 bg-yellow-400/15 text-yellow-300 animate-pulse"
                  : "border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
              aria-label="Regenerate AI report"
              title="Regenerate report"
            >
              ♻️
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-6">
            {loadingAiReport ? (
              <div className="flex flex-col items-center justify-center gap-4 h-48">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-sm text-zinc-400">Analyzing your progress...</p>
              </div>
            ) : (
              <>
                {/* Score Ring */}
                <div className="relative w-48 h-48">
                  <svg
                    width="200"
                    height="200"
                    viewBox="0 0 200 200"
                    className="drop-shadow-lg"
                  >
                    {/* Background Circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="14"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="url(#scoreGradient)"
                      strokeWidth="14"
                      strokeDasharray={`${(aiScore / 100) * 565.5} 565.5`}
                      strokeLinecap="round"
                      transform="rotate(-90 100 100)"
                      className="transition-all duration-500"
                    />
                    <defs>
                      <linearGradient
                        id="scoreGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-emerald-400">
                      {aiScore}
                    </span>
                    <span className="text-xs text-zinc-400 uppercase tracking-wide">
                      Ready
                    </span>
                  </div>
                </div>

                {/* Message */}
                <p className="text-center text-zinc-300 text-sm max-w-xs leading-relaxed">
                  {recommendation}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Badges & Certificates (Stacked) */}
        <div className="flex flex-col gap-4">
          {/* Badges Card */}
          <div className="flex-1 rounded-2xl border border-white/10 bg-[#111214] px-6 py-6 flex flex-col">
            <h2 className="text-base font-semibold text-zinc-100 mb-4">
              Badges
            </h2>
            <div className="flex gap-3 flex-wrap">
              {loadingBadges ? (
                <p className="text-zinc-400 text-sm">Loading badges...</p>
              ) : badges.filter(b => unlockedSections[b.section_key]).length > 0 ? (
                badges
                  .filter(b => unlockedSections[b.section_key])
                  .map((badge) => (
                    <div
                      key={badge.id}
                      className="group relative flex justify-center"
                    >
                      <img
                        src={badge.image_url || "/images/placeholder.png"}
                        alt={badge.label}
                        className="h-20 w-20 object-contain rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition-colors cursor-pointer"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/15 bg-[#0f1115]/95 px-2 py-1 text-[10px] text-zinc-100 opacity-0 shadow-lg shadow-black/40 transition-opacity duration-150 group-hover:opacity-100">
                        {badge.label}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="text-zinc-400 text-sm">No badges unlocked yet</p>
              )}
            </div>
          </div>

          {/* Certificates Card */}
          <div className="flex-1 rounded-2xl border border-white/10 bg-[#111214] px-6 py-6 flex flex-col">
            <h2 className="text-base font-semibold text-zinc-100 mb-4">
              Certificates
            </h2>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowCertificateModal(true)}
                className="group relative"
              >
                <img
                  src="/images/certificate.png"
                  alt="Certificate"
                  className="h-20 w-20 object-contain rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition-colors cursor-pointer"
                />
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/15 bg-[#0f1115]/95 px-2 py-1 text-[10px] text-zinc-100 opacity-0 shadow-lg shadow-black/40 transition-opacity duration-150 group-hover:opacity-100">
                  Certificate
                </span>
              </button>
            </div>
          </div>

          {/* Certificate Modal */}
          {showCertificateModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setShowCertificateModal(false)}
            >
              <div
                className="relative max-w-2xl max-h-[80vh] rounded-2xl border border-white/10 bg-[#111214] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="absolute top-4 right-4 z-10 h-8 w-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                  ✕
                </button>
                <img
                  src="/images/certificate.png"
                  alt="Certificate"
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Section - Full Width */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-[#111214] px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {loadingCurrentModule ? (
            <h3 className="text-lg font-semibold text-zinc-100 text-center sm:text-left">
              Loading...
            </h3>
          ) : currentModule ? (
            <>
              <h3 className="text-lg font-semibold text-zinc-100 text-center sm:text-left">
                {currentModule.name}
              </h3>
              <button
                onClick={() => router.push(currentModule.path)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 text-sm text-emerald-300 hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
              >
                Continue learning
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-zinc-400 text-center sm:text-left">
                No active module. Start learning!
              </h3>
              <button
                onClick={() => router.push("/collections")}
                className="inline-flex h-9 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 text-sm text-emerald-300 hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
              >
                Start learning
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress & Calendar Section */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Progress Graph */}
        <div className="rounded-2xl border border-white/10 bg-[#111214] px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-zinc-100">
              Progress graph
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={yAxisMetric}
                onChange={(e) => setYAxisMetric(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
              >
                <option value="improvement">Improvement</option>
                <option value="accuracy">Accuracy</option>
                <option value="readiness">Readiness</option>
              </select>
              <button
                onClick={() => setShowGridLines(!showGridLines)}
                className={`px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium ${
                  showGridLines
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                Grid
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg width="100%" height="220" viewBox="0 0 480 180" preserveAspectRatio="xMidYMid meet" style={{ minHeight: '220px' }}>
              <defs>
                <linearGradient
                  id="progressGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {showGridLines && (
                <>
                  {/* Horizontal grid lines */}
                  {[0, 25, 50, 75, 100].map((value) => (
                    <line
                      key={`h-grid-${value}`}
                      x1="50"
                      y1={135 - (value / 100) * 120}
                      x2="460"
                      y2={135 - (value / 100) * 120}
                      stroke="#10b981"
                      strokeWidth="0.5"
                      opacity="0.2"
                      strokeDasharray="2,2"
                    />
                  ))}
                  {/* Vertical grid lines */}
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
                    <line
                      key={`v-grid-${i}`}
                      x1={50 + (i * 410) / 15}
                      y1="15"
                      x2={50 + (i * 410) / 15}
                      y2="135"
                      stroke="#10b981"
                      strokeWidth="0.5"
                      opacity="0.2"
                      strokeDasharray="2,2"
                    />
                  ))}
                </>
              )}

              {/* Y-axis */}
              <line x1="50" y1="15" x2="50" y2="135" stroke="#10b981" strokeWidth="1.5" />
              {/* X-axis */}
              <line x1="50" y1="135" x2="460" y2="135" stroke="#10b981" strokeWidth="1.5" />

              {/* Y-axis labels */}
              {[0, 25, 50, 75, 100].map((value) => (
                <g key={`y-label-${value}`}>
                  <text
                    x="42"
                    y={135 - (value / 100) * 120 + 4}
                    textAnchor="end"
                    fontSize="9"
                    fill="#10b981"
                    opacity="0.8"
                  >
                    {value}
                  </text>
                </g>
              ))}

              {/* X-axis labels (Weeks) */}
              {[0, 1, 2, 3].map((weekIdx) => (
                <g key={`x-label-${weekIdx}`}>
                  <text
                    x={50 + weekIdx * 102.5 + 51.25}
                    y="152"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#10b981"
                    opacity="0.8"
                  >
                    W{weekIdx + 1}
                  </text>
                </g>
              ))}

              {/* Y-axis label */}
              <text
                x="20"
                y="75"
                textAnchor="middle"
                fontSize="10"
                fill="#10b981"
                opacity="0.7"
                transform="rotate(-90 20 75)"
              >
                {metricLabels[yAxisMetric]}
              </text>

              {/* X-axis label */}
              <text
                x="255"
                y="170"
                textAnchor="middle"
                fontSize="10"
                fill="#10b981"
                opacity="0.7"
              >
                Time (Weeks)
              </text>

              {/* Graph line */}
              <polyline
                points={generateGraphPath()}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Graph area */}
              <polygon
                points={`50,135 ${generateGraphPath().split(" ").slice(1).join(" ")} 460,135`}
                fill="url(#progressGradient)"
              />
            </svg>
          </div>
        </div>

        {/* Calendar */}
        <Calendar />
      </div>

      {/* Recommended Section */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">
          Recommended for you
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-2xl border border-white/10 bg-[#111214] px-6 py-8 flex flex-col justify-between min-h-48 hover:bg-white/5 transition-colors cursor-pointer">
            <h3 className="text-base font-semibold text-zinc-100 mb-6 leading-relaxed">
              45 must know interview questions
            </h3>
            <button className="inline-flex h-9 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 text-sm text-emerald-300 hover:bg-emerald-500/20 transition-colors">
              Learn
            </button>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-white/10 bg-[#111214] px-6 py-8 flex flex-col justify-between min-h-48 hover:bg-white/5 transition-colors cursor-pointer">
            <h3 className="text-base font-semibold text-zinc-100 mb-6 leading-relaxed">
              Operating System Essentials
            </h3>
            <button className="inline-flex h-9 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 text-sm text-emerald-300 hover:bg-emerald-500/20 transition-colors">
              Learn
            </button>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-white/10 bg-[#111214] px-6 py-8 flex flex-col justify-between min-h-48 hover:bg-white/5 transition-colors cursor-pointer">
            <h3 className="text-base font-semibold text-zinc-100 mb-6 leading-relaxed">
              Challenge your friends in an interview battle
            </h3>
            <button className="inline-flex h-9 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 text-sm text-emerald-300 hover:bg-emerald-500/20 transition-colors">
              view
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
