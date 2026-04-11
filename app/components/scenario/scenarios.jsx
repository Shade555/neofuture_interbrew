"use client";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import "./scenarios.css";

const difficultyColors = {
  Easy: "text-sky-400 bg-sky-400/15 border-sky-500/40",
  Medium: "text-amber-400 bg-amber-400/15 border-amber-500/40",
  Hard: "text-rose-400 bg-rose-400/15 border-rose-500/40",
};

const filterColors = {
  Easy: "text-sky-400 border-sky-500/30 bg-sky-400/10",
  Medium: "text-amber-400 border-amber-500/30 bg-amber-400/10",
  Hard: "text-rose-400 border-rose-500/30 bg-rose-400/10",
};

const filterInactiveColors = {
  Easy: "text-sky-400/60 border-sky-500/15 hover:text-sky-400 hover:border-sky-500/30",
  Medium:
    "text-amber-400/60 border-amber-500/15 hover:text-amber-400 hover:border-amber-500/30",
  Hard: "text-rose-400/60 border-rose-500/15 hover:text-rose-400 hover:border-rose-500/30",
};

export default function Scenarios({ onSelect, selected }) {
  const [diffFilter, setDiffFilter] = useState(null);
  const [completedOnly, setCompletedOnly] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Get current user
  useEffect(() => {
    async function getUser() {
      if (!supabase) {
        setUserId("__none__");
        return;
      }
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserId(user ? user.id : "__none__");
      } catch {
        setUserId("__none__");
      }
    }
    getUser();
  }, []);

  // Fetch scenarios + compute completion % from user_module_progress
  useEffect(() => {
    if (!userId) return;

    async function fetchScenarios() {
      if (!supabase) {
        console.warn("Supabase client not configured");
        setLoading(false);
        return;
      }

      try {
        // Fetch scenarios
        const { data: scenarioData, error: scenarioError } = await supabase
          .from("scenarios")
          .select("*")
          .order("id", { ascending: true });

        if (scenarioError) {
          console.error("Error fetching scenarios:", scenarioError);
          setLoading(false);
          return;
        }

        if (!scenarioData || scenarioData.length === 0) {
          setScenarios([]);
          setLoading(false);
          return;
        }

        // Fetch all modules to know total per scenario
        const { data: modulesData } = await supabase
          .from("modules")
          .select("id, scenario_id");

        // Fetch user's completed modules (only if logged in)
        let completedModuleIds = new Set();
        if (userId !== "__none__") {
          const { data: progressData } = await supabase
            .from("user_module_progress")
            .select("module_id")
            .eq("user_id", userId)
            .eq("completed", true);

          completedModuleIds = new Set(
            (progressData || []).map((p) => p.module_id),
          );
        }

        // Compute progress per scenario
        const scenariosWithProgress = scenarioData.map((scenario) => {
          const scenarioModules = (modulesData || []).filter(
            (m) => m.scenario_id === scenario.id,
          );
          const totalModules = scenarioModules.length;
          const completedModules = scenarioModules.filter((m) =>
            completedModuleIds.has(m.id),
          ).length;
          const progress =
            totalModules > 0
              ? Math.round((completedModules / totalModules) * 100)
              : 0;
          return { ...scenario, progress };
        });

        setScenarios(scenariosWithProgress);
      } catch (err) {
        console.error("Failed to connect to Supabase:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchScenarios();
  }, [userId]);

  const ordered = useMemo(() => {
    const inProgress = scenarios
      .filter((s) => s.progress > 0 && s.progress < 100)
      .sort((a, b) => b.progress - a.progress);
    const completed = scenarios.filter((s) => s.progress === 100);
    const notStarted = scenarios.filter((s) => s.progress === 0);
    return [...inProgress, ...notStarted, ...completed];
  }, [scenarios]);

  const [shuffled, setShuffled] = useState(ordered);

  useEffect(() => {
    const inProgress = scenarios
      .filter((s) => s.progress > 0 && s.progress < 100)
      .sort((a, b) => b.progress - a.progress);
    const completed = scenarios.filter((s) => s.progress === 100);
    const notStarted = [...scenarios.filter((s) => s.progress === 0)].sort(
      () => Math.random() - 0.5,
    );
    setShuffled([...inProgress, ...notStarted, ...completed]);
  }, [scenarios]);
  const visible = shuffled
    .filter(
      (s) =>
        !diffFilter || s.difficulty?.toLowerCase() === diffFilter.toLowerCase(),
    )
    .filter((s) => !completedOnly || s.progress === 100);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-white">Scenarios</h2>
        <div className="flex items-center gap-1">
          {["Easy", "Medium", "Hard"].map((d) => (
            <button
              key={d}
              onClick={() => setDiffFilter(diffFilter === d ? null : d)}
              className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all duration-200 ${
                diffFilter === d ? filterColors[d] : filterInactiveColors[d]
              }`}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => setCompletedOnly(!completedOnly)}
            className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all duration-200 ${
              completedOnly
                ? "text-emerald-400 border-emerald-500/30 bg-emerald-400/10"
                : "text-emerald-400/60 border-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="scenarios-scroll flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
        {loading ? (
          <p className="text-xs text-gray-500 text-center mt-4">
            Loading scenarios...
          </p>
        ) : visible.length === 0 ? (
          <p className="text-xs text-gray-500 text-center mt-4">
            No scenarios found.
          </p>
        ) : (
          visible.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => onSelect?.(scenario)}
              onDoubleClick={() =>
                selected?.id === scenario.id && onSelect?.(null)
              }
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
                selected?.id === scenario.id
                  ? "bg-white/8 border-white/20"
                  : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-emerald-500/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-medium text-white truncate flex-1">
                  {scenario.title}
                </p>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${difficultyColors[scenario.difficulty?.charAt(0).toUpperCase() + scenario.difficulty?.slice(1).toLowerCase()] ?? "text-gray-400 bg-white/5 border-white/10"}`}
                >
                  {scenario.difficulty?.charAt(0).toUpperCase() +
                    scenario.difficulty?.slice(1).toLowerCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate mb-2">
                {scenario.description}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/5 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-1 rounded-full transition-all duration-500 ${scenario.progress === 100 ? "bg-emerald-500" : "bg-white/30"}`}
                    style={{ width: `${scenario.progress}%` }}
                  />
                </div>
                <span
                  className={`text-[11px] shrink-0 ${scenario.progress === 100 ? "text-emerald-400" : "text-gray-500"}`}
                >
                  {scenario.progress === 100
                    ? "Complete"
                    : `${scenario.progress}% completed`}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
