"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import tryIncrementStreak from "../../../lib/streak";
import Scenarios from "../../components/scenario/scenarios";
import Content from "../../components/scenario/content";
import Modules from "../../components/scenario/modules";
import LessonView from "../../components/scenario/lesson";

export default function ScenarioPracticePage() {
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [activeModule, setActiveModule] = useState<any>(null);

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-[#0c0c0c] p-5">
      {practiceMode ? (
        <div className="bg-[#141414] border border-white/8 rounded-2xl p-8 h-full overflow-hidden flex flex-col">
          {activeModule ? (
            <LessonView
              module={activeModule}
              onBack={() => setActiveModule(null)}
              onComplete={async () => {
                // Mark module as completed in DB only if logged in
                if (supabase) {
                  try {
                    const {
                      data: { user },
                    } = await supabase.auth.getUser();
                    if (user) {
                      await supabase.from("user_module_progress").upsert(
                        {
                          user_id: user.id,
                          module_id: activeModule.id,
                          completed: true,
                          completed_at: new Date().toISOString(),
                        },
                        { onConflict: "user_id,module_id" },
                      );
                      // increment daily streak once per day when a module is completed
                      try { await tryIncrementStreak(); } catch (e) { /* ignore */ }
                    }
                  } catch (err) {
                    console.warn(
                      "Could not save progress (not logged in):",
                      err,
                    );
                  }
                }
                setActiveModule(null);
              }}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Practice: {selectedScenario?.title || "Modules"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedScenario?.description ||
                      "Select a module to begin practice"}
                  </p>
                </div>
                <button
                  className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/15 transition mr-4"
                  onClick={() => setPracticeMode(false)}
                >
                  Back to Overview
                </button>
              </div>
              <PracticeModules
                selectedScenario={selectedScenario}
                onLearn={(mod) => setActiveModule(mod)}
              />
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_420px] gap-4 h-full">
          {/* Center — Content */}
          <div className="bg-[#141414] border border-white/8 rounded-2xl p-5 overflow-hidden flex flex-col">
            <Content
              selectedScenario={selectedScenario}
              onStartPractice={() => setPracticeMode(true)}
            />
          </div>

          {/* Right — Scenarios */}
          <div className="bg-[#141414] border border-white/8 rounded-2xl p-5 overflow-hidden flex flex-col">
            <Scenarios
              onSelect={setSelectedScenario}
              selected={selectedScenario}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Practice Modules Component
function PracticeModules({
  selectedScenario,
  onLearn,
}: {
  selectedScenario: any;
  onLearn: (mod: any) => void;
}) {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  // Get current user — always resolve even if not logged in
  useEffect(() => {
    async function getUser() {
      if (!supabase) {
        setAuthResolved(true);
        return;
      }
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
      } catch {
        // Not logged in — that's fine
      } finally {
        setAuthResolved(true);
      }
    }
    getUser();
  }, []);

  // Fetch modules — runs once auth is resolved (logged in or not)
  useEffect(() => {
    if (!authResolved) return;

    async function fetchModules() {
      if (!supabase) {
        console.warn("Supabase client not configured");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        let query = supabase
          .from("modules")
          .select("*")
          .order("order_number", { ascending: true });

        if (selectedScenario?.id) {
          query = query.eq("scenario_id", selectedScenario.id);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching modules:", error);
        } else if (data) {
          setModules(data);

          // Fetch completion status only if logged in
          if (userId) {
            const moduleIds = data.map((m: any) => m.id);
            if (moduleIds.length > 0) {
              const { data: progressData, error: progressError } =
                await supabase
                  .from("user_module_progress")
                  .select("module_id")
                  .eq("user_id", userId)
                  .eq("completed", true)
                  .in("module_id", moduleIds);

              if (progressError) {
                console.error("Error fetching progress:", progressError);
              } else if (progressData) {
                setCompletedIds(
                  new Set(progressData.map((p: any) => p.module_id)),
                );
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to connect to Supabase:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchModules();
  }, [selectedScenario, authResolved, userId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading practice modules...</p>
      </div>
    );
  }

  return (
    <div
      className="space-y-4 max-h-[60vh] overflow-y-auto pr-2"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(52,211,153,0.25) transparent",
      }}
    >
      {modules.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No modules available.</p>
      ) : (
        modules.map((module) => {
          const isComplete = completedIds.has(module.id);
          return (
            <div
              key={module.id}
              className="bg-white/3 border border-white/8 rounded-xl p-4 hover:border-emerald-500/30 transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      isComplete
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                        : "bg-white/5 border-white/10 text-gray-400"
                    }`}
                  >
                    {isComplete ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      module.order_number
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{module.title}</h3>
                    {module.description && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {module.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onLearn?.(module)}
                  className={`px-7 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200 shrink-0 mr-3 ${
                    isComplete
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25"
                      : "bg-white/8 border-white/15 text-white hover:bg-white/12 hover:border-emerald-500/40"
                  }`}
                >
                  {isComplete ? "Reattempt" : "Learn"}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
