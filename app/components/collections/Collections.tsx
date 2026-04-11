"use client";

import React, { useEffect, useRef, useState } from "react";
import MockInterviewPanel from "../mock_int/mock_int.jsx";
import { supabase } from "../../../lib/supabaseClient";

type DropdownOption<T extends string> = {
  value: T;
  label: string;
};

type ModuleItem = {
  id: string;
  name: string;
  difficulty: "Easy" | "Medium" | "Difficult";
  sectionKey: string;
  sectionId?: string;
  completed?: boolean;
  content?: string | null;
};

type BadgeItem = {
  id?: string;
  label: string;
  src: string;
  sectionKey: string;
};

type CheatSheetItem = {
  id?: string;
  title: string;
  sectionKey: string;
  href: string;
};

type ModuleResources = {
  doc?: string;
  youtube?: string;
  docContent?: string | null;
  note?: string | null;
};

type SectionItem = {
  id: string;
  sectionKey: string;
  title: string;
  orderNumber: number;
};

function normalizeExternalUrl(rawUrl: string) {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`;
  if (/^[\w.-]+\.[a-z]{2,}([/?#].*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function parseYouTubeTimeToSeconds(raw?: string | null) {
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return Number(raw);

  const match = raw.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
  if (!match) return null;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

function toYouTubeEmbedUrl(rawUrl: string) {
  try {
    const normalized = normalizeExternalUrl(rawUrl);
    if (/^[a-zA-Z0-9_-]{11}$/.test(normalized)) {
      return `https://www.youtube.com/embed/${normalized}?autoplay=1&rel=0&modestbranding=1`;
    }

    const url = new URL(normalized);
    const host = url.hostname.toLowerCase();
    let videoId = "";
    const startTime =
      url.searchParams.get("t") || url.searchParams.get("start");

    if (host.includes("youtu.be")) {
      videoId = url.pathname.replace(/^\//, "").split("/")[0] || "";
    } else if (host.includes("youtube.com")) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") || "";
      } else if (url.pathname.startsWith("/shorts/")) {
        videoId = url.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      } else if (url.pathname.startsWith("/live/")) {
        videoId = url.pathname.split("/live/")[1]?.split("/")[0] || "";
      } else if (url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/embed/")[1]?.split("/")[0] || "";
      }
    }

    if (!videoId) return null;

    const params = new URLSearchParams({
      autoplay: "1",
      rel: "0",
      modestbranding: "1",
    });

    const startInSeconds = parseYouTubeTimeToSeconds(startTime);
    if (startInSeconds) params.set("start", String(startInSeconds));

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  } catch {
    return null;
  }
}

function normalizeSectionKey(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanizeSectionTitle(sectionKey?: string | null) {
  const key = normalizeSectionKey(sectionKey);
  if (!key) return "Untitled Section";
  return key
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSectionInterviewSummary(sectionTitle?: string | null) {
  const key = normalizeSectionKey(sectionTitle);

  const summaryMap: Record<string, string> = {
    foundation:
      "This interview checks OS basics like system calls, process lifecycle, and core architecture concepts.",
    "process-management":
      "This interview focuses on process states, context switching, process control blocks, and scheduling goals.",
    "process-synchronization-deadlocks":
      "This interview covers race conditions, critical sections, semaphores, mutexes, and deadlock handling.",
    "threads-cpu-management":
      "This interview evaluates threads, CPU scheduling strategies, and performance trade-offs in execution.",
    "memory-management-virtual-memory":
      "This interview targets memory allocation, paging, segmentation, virtual memory, and page replacement.",
    "file-systems":
      "This interview explores file organization, directories, inodes, permissions, and storage consistency.",
    "io-systems":
      "This interview covers device management, buffering, caching, interrupts, and I/O performance concepts.",
    "command-line":
      "This interview checks shell usage, process commands, file operations, and practical command-line problem solving.",
    "protection-security":
      "This interview focuses on protection models, authentication, authorization, access control, and system security basics.",
  };

  return (
    summaryMap[key] ||
    "This interview will evaluate your understanding of this section through concise conceptual and practical questions."
  );
}

function FilterDropdown<T extends string>({
  value,
  onChange,
  options,
  triggerLabel,
  widthClass,
}: {
  value: T;
  onChange: (v: T) => void;
  options: DropdownOption<T>[];
  triggerLabel?: string;
  widthClass: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = options.find((o) => o.value === value);
  const selectedLabel = selected?.label ?? triggerLabel ?? "Select";

  return (
    <div ref={wrapRef} className={`relative ${widthClass}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-11 w-full rounded-2xl border border-white/10 bg-[#121417] px-3 text-zinc-300 text-sm flex items-center justify-between hover:bg-white/10 transition-colors"
      >
        <span>{selectedLabel}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-white/10 bg-[#0f1115] p-2 shadow-xl shadow-black/50">
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full rounded-xl px-4 py-2.5 text-left text-base transition-colors ${
                  isSelected
                    ? "bg-white/10 text-zinc-100"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Collections({
  className = "",
}: {
  className?: string;
}) {
  const fallbackBadges: BadgeItem[] = [
    {
      label: "Foundation",
      src: "/images/Foundation.png",
      sectionKey: "foundation",
    },
    {
      label: "Scheduling",
      src: "/images/Scheduling.png",
      sectionKey: "cpu-scheduling",
    },
    {
      label: "Concurrency",
      src: "/images/Concurrency.png",
      sectionKey: "thread-management",
    },
    {
      label: "Memory",
      src: "/images/Memory.png",
      sectionKey: "memory-management-virtual-memory",
    },
    {
      label: "Command Line",
      src: "/images/Command%20Line.png",
      sectionKey: "command-line",
    },
    {
      label: "Interview - Ready",
      src: "/images/Interview%20-%20Ready.png",
      sectionKey: "protection-security",
    },
  ];

  const fallbackCheatSheets: CheatSheetItem[] = [
    {
      title: "Process Management",
      sectionKey: "process-management",
      href: "#",
    },
    {
      title: "Threads & CPU Management",
      sectionKey: "thread-management",
      href: "#",
    },
    {
      title: "Process Synchronization & Deadlocks",
      sectionKey: "process-synchronization-deadlocks",
      href: "#",
    },
    {
      title: "Memory Management",
      sectionKey: "memory-management-virtual-memory",
      href: "#",
    },
    {
      title: "File System and I/O Management",
      sectionKey: "file-systems",
      href: "#",
    },
    {
      title: "Intermediate OS",
      sectionKey: "protection-security",
      href: "#",
    },
    {
      title: "Command Line",
      sectionKey: "command-line",
      href: "#",
    },
  ];

  const [mockDifficulty, setMockDifficulty] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"interview" | "solve">(
    "interview",
  );
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"all" | "revision">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [solvedFilter, setSolvedFilter] = useState<
    "all" | "solved" | "unsolved"
  >("all");
  const [difficultyFilter, setDifficultyFilter] = useState<
    "all" | "Easy" | "Medium" | "Difficult"
  >("all");
  const [randomPicked, setRandomPicked] = useState<string | null>(null);
  const [randomOnlyModuleId, setRandomOnlyModuleId] = useState<string | null>(
    null,
  );
  const [revisionMap, setRevisionMap] = useState<Record<string, boolean>>({});
  const [resourcesMap, setResourcesMap] = useState<
    Record<string, ModuleResources>
  >({});
  const [courseBadges, setCourseBadges] = useState<BadgeItem[]>(fallbackBadges);
  const [cheatSheets, setCheatSheets] =
    useState<CheatSheetItem[]>(fallbackCheatSheets);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [items, setItems] = useState<ModuleItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [dataError, setDataError] = useState<string>("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [youtubePopup, setYoutubePopup] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [docPopup, setDocPopup] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [notePopup, setNotePopup] = useState<{
    moduleId: string;
    title: string;
    note: string;
  } | null>(null);
  const [interviewIntroPopup, setInterviewIntroPopup] = useState<{
    sectionTopic: string;
    summary: string;
  } | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSaveError, setNoteSaveError] = useState<string>("");
  const hasAnyPopupOpen =
    !!youtubePopup || !!docPopup || !!notePopup || !!interviewIntroPopup;

  useEffect(() => {
    if (!hasAnyPopupOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setYoutubePopup(null);
        setDocPopup(null);
        setNotePopup(null);
        setInterviewIntroPopup(null);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [hasAnyPopupOpen]);

  useEffect(() => {
    let active = true;

    async function fetchCollectionsData() {
      setDataError("");
      try {
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const currentUserId = user?.id ?? null;
        if (active) setUserId(currentUserId);
        
        // Extract username from email (part before @)
        if (user?.email && active) {
          const emailUsername = user.email.split("@")[0];
          setUsername(emailUsername);
        }

        const { data: sectionsData, error: sectionsErr } = await supabase
          .from("collection_sections")
          .select("id, section_key, title, order_number")
          .order("order_number", { ascending: true });
        if (sectionsErr) throw sectionsErr;

        const normalizedSections: SectionItem[] = (sectionsData ?? []).map(
          (s: {
            id: string;
            section_key: string;
            title: string;
            order_number: number;
          }) => ({
            id: s.id,
            sectionKey: s.section_key,
            title: s.title || humanizeSectionTitle(s.section_key),
            orderNumber: s.order_number ?? 0,
          }),
        );
        if (active) {
          setSections(normalizedSections);
          setOpenSections((prev) => {
            const next = { ...prev };
            normalizedSections.forEach((section, idx) => {
              if (typeof next[section.sectionKey] !== "boolean") {
                next[section.sectionKey] = idx === 0;
              }
            });
            return next;
          });
        }

        const sectionOrder = new Map<string, number>();
        (sectionsData ?? []).forEach(
          (s: { section_key: string; order_number: number }) => {
            sectionOrder.set(s.section_key, s.order_number ?? 0);
          },
        );

        let modulesData: any[] | null = null;
        let modulesErr: any = null;

        // Try fetching with content column
        ({ data: modulesData, error: modulesErr } = await supabase
          .from("collection_modules")
          .select(
            "id, title, difficulty, section_key, section_id, completed, content, order_number, collection_sections(section_key)",
          )
          .order("order_number", { ascending: true }));

        // If content column doesn't exist, retry without it
        if (modulesErr) {
          const retry = await supabase
            .from("collection_modules")
            .select(
              "id, title, difficulty, section_key, section_id, completed, order_number, collection_sections(section_key)",
            )
            .order("order_number", { ascending: true });
          modulesData = retry.data;
          modulesErr = retry.error;
        }

        if (modulesErr) throw modulesErr;

        const sortableModules = (modulesData ?? [])
          .map(
            (m: {
              id: string;
              title: string;
              difficulty: "Easy" | "Medium" | "Difficult";
              section_key: string;
              section_id: string | null;
              completed?: boolean | null;
              content?: string | null;
              order_number: number;
              collection_sections?: Array<{ section_key?: string }>;
            }) => {
              const relatedSectionKey = Array.isArray(m.collection_sections)
                ? m.collection_sections[0]?.section_key
                : undefined;
              return {
                id: m.id,
                name: m.title,
                difficulty: m.difficulty,
                sectionKey: m.section_key || relatedSectionKey || "unassigned",
                sectionId: m.section_id || undefined,
                completed: !!m.completed,
                content: m.content || null,
                orderNumber: m.order_number,
              };
            },
          )
          .sort((a, b) => {
            const secA =
              sectionOrder.get(a.sectionKey) ?? Number.MAX_SAFE_INTEGER;
            const secB =
              sectionOrder.get(b.sectionKey) ?? Number.MAX_SAFE_INTEGER;
            if (secA !== secB) return secA - secB;
            return a.orderNumber - b.orderNumber;
          });

        const normalizedModules: ModuleItem[] = sortableModules.map(
          ({ orderNumber, ...rest }) => rest as ModuleItem,
        );

        if (active) setItems(normalizedModules);

        const moduleIds = normalizedModules.map((m) => m.id);
        if (moduleIds.length > 0) {
          try {
            const { data: resourcesData, error: resourcesErr } = await supabase
              .from("collection_resources")
              .select("module_id, type, url, content, note")
              .in("module_id", moduleIds);
            if (resourcesErr) throw resourcesErr;

            const resourceLookup: Record<string, ModuleResources> = {};
            (resourcesData ?? []).forEach(
              (r: {
                module_id: string;
                type: string;
                url: string;
                content?: string | null;
                note?: string | null;
              }) => {
                if (!resourceLookup[r.module_id])
                  resourceLookup[r.module_id] = {};

                // Allow a single DB row to provide both resources:
                // - content => doc popup
                // - url => youtube popup
                if (typeof r.content === "string" && r.content.trim()) {
                  resourceLookup[r.module_id].docContent = r.content;
                }

                if (typeof r.url === "string" && r.url.trim()) {
                  resourceLookup[r.module_id].youtube = r.url;
                  resourceLookup[r.module_id].doc = r.url;
                }

                if (typeof r.note === "string") {
                  resourceLookup[r.module_id].note = r.note;
                }
              },
            );
            if (active) setResourcesMap(resourceLookup);
          } catch (err) {
            console.warn("Failed to load collection resources:", err);
          }
        }

        try {
          const { data: badgesData, error: badgesErr } = await supabase
            .from("collection_badges")
            .select("id, label, section_key, image_url")
            .order("order_number", { ascending: true });
          if (badgesErr) throw badgesErr;
          if (active && (badgesData ?? []).length > 0) {
            setCourseBadges(
              (badgesData ?? []).map(
                (b: {
                  id: string;
                  label: string;
                  section_key: string;
                  image_url: string;
                }) => ({
                  id: b.id,
                  label: b.label,
                  sectionKey: b.section_key,
                  src: b.image_url,
                }),
              ),
            );
          }
        } catch (err) {
          console.warn("Failed to load badges:", err);
        }

        try {
          const { data: cheatData, error: cheatErr } = await supabase
            .from("collection_cheatsheets")
            .select("id, title, section_key, resource_url")
            .order("order_number", { ascending: true });
          if (cheatErr) throw cheatErr;
          if (active && (cheatData ?? []).length > 0) {
            const mappedSheets = (cheatData ?? [])
              .map(
                (c: {
                  id: string;
                  title: string;
                  section_key: string;
                  resource_url: string;
                }) => {
                  const normalizedTitle = normalizeSectionKey(c.title);
                  const isIntermediateLinux =
                    normalizedTitle === "intermediate-linux";

                  return {
                    id: c.id,
                    title: isIntermediateLinux ? "Intermediate OS" : c.title,
                    sectionKey: isIntermediateLinux
                      ? "protection-security"
                      : c.section_key,
                    href: c.resource_url,
                  };
                },
              )
              .filter(
                (sheet) =>
                  normalizeSectionKey(sheet.title) !== "shell-scripting",
              );

            const commandLineSheets = mappedSheets.filter(
              (sheet) => normalizeSectionKey(sheet.title) === "command-line",
            );
            const nonCommandLineSheets = mappedSheets.filter(
              (sheet) => normalizeSectionKey(sheet.title) !== "command-line",
            );

            const finalSheets =
              commandLineSheets.length > 0
                ? [...nonCommandLineSheets, ...commandLineSheets]
                : [
                    ...nonCommandLineSheets,
                    {
                      title: "Command Line",
                      sectionKey: "command-line",
                      href: "#",
                    },
                  ];

            setCheatSheets(finalSheets);
          }
        } catch (err) {
          console.warn("Failed to load cheatsheets:", err);
        }

        if (currentUserId && moduleIds.length > 0) {
          try {
            const { data: progressData, error: progressErr } = await supabase
              .from("user_collection_module_progress")
              .select("module_id, completed")
              .eq("user_id", currentUserId)
              .in("module_id", moduleIds);
            if (progressErr) throw progressErr;

            const done: Record<string, boolean> = {};
            (progressData ?? []).forEach(
              (row: { module_id: string; completed: boolean }) => {
                if (row.completed) done[row.module_id] = true;
              },
            );
            if (active) setDoneMap(done);
          } catch (err) {
            console.warn("Failed to load progress data:", err);
          }

          try {
            const { data: metaData, error: metaErr } = await supabase
              .from("user_module_meta")
              .select("module_id, is_revision")
              .eq("user_id", currentUserId)
              .in("module_id", moduleIds);
            if (metaErr) throw metaErr;

            const revisions: Record<string, boolean> = {};
            (metaData ?? []).forEach(
              (row: { module_id: string; is_revision: boolean }) => {
                revisions[row.module_id] = !!row.is_revision;
              },
            );
            if (active) {
              setRevisionMap(revisions);
            }
          } catch (err) {
            console.warn("Failed to load revision data:", err);
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load collections";
        console.error("Collections DB fetch failed:", err);
        if (active) setDataError(message);
      }
    }

    fetchCollectionsData();

    return () => {
      active = false;
    };
  }, []);

  async function toggleDone(moduleId: string) {
    const next = !doneMap[moduleId];
    setDoneMap((prev) => ({ ...prev, [moduleId]: next }));

    if (!userId) return;

    try {
      const { error } = await supabase
        .from("user_collection_module_progress")
        .upsert(
          {
            user_id: userId,
            module_id: moduleId,
            completed: next,
            completed_at: next ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,module_id" },
        );
      if (error) throw error;

      const { error: moduleErr } = await supabase
        .from("collection_modules")
        .update({ completed: next })
        .eq("id", moduleId);
      if (moduleErr) throw moduleErr;

      if (next) {
        await unlockBadgeForCompletedSection(moduleId);
      }
    } catch (err) {
      console.error("Failed to save completion:", err);
    }
  }

  async function unlockBadgeForCompletedSection(moduleId: string) {
    if (!userId) return;

    try {
      const { data: moduleRow, error: moduleErr } = await supabase
        .from("collection_modules")
        .select("section_key, section_id")
        .eq("id", moduleId)
        .maybeSingle();
      if (moduleErr) {
        console.error("Step 1 - Get module section_key failed:", moduleErr?.message || moduleErr);
        throw moduleErr;
      }

      const sectionKey = moduleRow?.section_key;
      const sectionId = moduleRow?.section_id;
      if (!sectionKey && !sectionId) return;

      let modulesQuery = supabase.from("collection_modules").select("id");
      if (sectionId) modulesQuery = modulesQuery.eq("section_id", sectionId);
      else modulesQuery = modulesQuery.eq("section_key", sectionKey);
      if (!sectionKey) {
        console.log("Step 2 - No section_key found for module:", moduleId);
        return;
      }

      const { count: totalCount, error: totalErr } = await supabase
        .from("collection_modules")
        .select("id", { count: "exact", head: true })
        .eq("section_key", sectionKey);
      if (totalErr) {
        console.error("Step 3 - Count total modules failed:", totalErr?.message || totalErr);
        throw totalErr;
      }

      const { data: sectionModules, error: sectionModulesErr } =
        await modulesQuery;
      if (sectionModulesErr) throw sectionModulesErr;

      const sectionModuleIds = (sectionModules ?? []).map(
        (row: { id: string }) => row.id,
      );
      if (sectionModuleIds.length === 0) return;

      const { data: completedRows, error: completedErr } = await supabase
        .from("user_collection_module_progress")
        .select("module_id")
        .eq("user_id", userId)
        .eq("completed", true)
        .in("module_id", sectionModuleIds);
      if (completedErr) throw completedErr;

      const completedCount = (completedRows ?? []).length;
      if (completedCount !== sectionModuleIds.length) return;

      console.log(`Section: ${sectionKey}, Total: ${totalCount}, Completed: ${completedCount}`);
      if (!totalCount || completedCount !== totalCount) {
        console.log("Not all modules completed yet");
        return;
      }

      const { data: badgeRows, error: badgeLookupErr } = await supabase
        .from("collection_badges")
        .select("id")
        .eq("section_key", sectionKey)
        .limit(1);
      if (badgeLookupErr) {
        console.error("Step 5 - Lookup badge failed:", badgeLookupErr?.message || badgeLookupErr);
        throw badgeLookupErr;
      }

      const badgeId = badgeRows?.[0]?.id;
      if (!badgeId) {
        console.log("No badge found for section:", sectionKey);
        return;
      }

      console.log("Unlocking badge:", badgeId, "for section:", sectionKey);
      const { error: badgeErr } = await supabase.from("user_badges").upsert(
        {
          user_id: userId,
          badge_id: badgeId,
          unlocked_at: new Date().toISOString(),
        },
        { onConflict: "user_id,badge_id", ignoreDuplicates: true },
      );
      if (badgeErr) {
        console.error("Step 6 - Upsert user_badges failed:", badgeErr?.message || badgeErr);
        throw badgeErr;
      }
      
      console.log("Badge unlocked successfully!");
    } catch (err) {
      console.error("Failed to unlock section badge:", err instanceof Error ? err.message : String(err));
    }
  }

  async function persistMeta(moduleId: string, nextRevision: boolean) {
    if (!userId) return;
    try {
      const { error } = await supabase.from("user_module_meta").upsert(
        {
          user_id: userId,
          module_id: moduleId,
          is_revision: nextRevision,
        },
        { onConflict: "user_id,module_id" },
      );
      if (error) throw error;
    } catch (err) {
      console.error("Failed to save module meta:", err);
    }
  }

  async function toggleRevision(moduleId: string) {
    const nextRevision = !revisionMap[moduleId];
    setRevisionMap((prev) => ({ ...prev, [moduleId]: nextRevision }));
    await persistMeta(moduleId, nextRevision);
  }

  function startSolve(
    moduleId: string,
    problem: string,
    problemDifficulty?: string,
  ) {
    setPanelMode("solve");
    setActiveModuleId(moduleId);
    setTopic(problem);
    if (problemDifficulty === "Easy") setMockDifficulty("Beginner");
    else if (problemDifficulty === "Difficult") setMockDifficulty("Advanced");
    else setMockDifficulty("Intermediate");

    // Update current module in dashboard via API
    if (userId) {
      const updateCurrentModule = async () => {
        try {
          const response = await fetch("/api/update-current-module", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              moduleName: problem,
              modulePath: "/collections",
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
          }
        } catch (err) {
          // Error silently handled
        }
      };
      updateCurrentModule();
    }
  }

  function startSectionMockInterview(sectionTopic: string) {
    setInterviewIntroPopup({
      sectionTopic,
      summary: getSectionInterviewSummary(sectionTopic),
    });
  }

  function launchSectionMockInterview(sectionTopic: string) {
    setInterviewIntroPopup(null);
    setPanelMode("interview");
    setActiveModuleId(null);
    setTopic(sectionTopic);
    setMockDifficulty("Intermediate");
  }


  function pickRandomProblem() {
    if (items.length === 0) return;

    const modulesBySection = new Map<string, ModuleItem[]>();
    items.forEach((item) => {
      const key = normalizeSectionKey(item.sectionKey) || "unassigned";
      if (!modulesBySection.has(key)) modulesBySection.set(key, []);
      modulesBySection.get(key)?.push(item);
    });

    const sectionKeys = Array.from(modulesBySection.keys());
    if (sectionKeys.length === 0) return;

    const pickedSectionKey =
      sectionKeys[Math.floor(Math.random() * sectionKeys.length)];
    const sectionModules = modulesBySection.get(pickedSectionKey) || [];
    if (sectionModules.length === 0) return;

    const selected =
      sectionModules[Math.floor(Math.random() * sectionModules.length)];

    // Ensure random-picked module is visible regardless of current filters.
    setActiveTab("all");
    setSearchQuery("");
    setSolvedFilter("all");
    setDifficultyFilter("all");

    setRandomPicked(selected.name);
    setRandomOnlyModuleId(selected.id);
  }

  function showAllProblems() {
    setRandomOnlyModuleId(null);
    setRandomPicked(null);
  }

  function openResource(
    moduleId: string,
    type: "doc" | "youtube",
    moduleName?: string,
  ) {
    if (type === "doc") {
      const docContent = resourcesMap[moduleId]?.docContent?.trim();

      if (docContent) {
        setDocPopup({
          title: moduleName ? `${moduleName} - Content` : "Module Content",
          content: docContent,
        });
        return;
      }

      // Always show popup with fallback message instead of failing silently
      setDocPopup({
        title: moduleName ? `${moduleName} - Content` : "Module Content",
        content:
          "No content found for this module yet. Add text in collection_resources.content column to display it here.",
      });
      return;
    }

    const target = normalizeExternalUrl(resourcesMap[moduleId]?.[type] || "");
    if (!target || target === "#") {
      setDocPopup({
        title: moduleName ? `${moduleName} - Video` : "YouTube Video",
        content: "No YouTube link found for this module yet.",
      });
      return;
    }

    if (type === "youtube") {
      const embedUrl = toYouTubeEmbedUrl(target);
      if (embedUrl) {
        setYoutubePopup({
          url: embedUrl,
          title: moduleName ? `${moduleName} - Video` : "YouTube Video",
        });
        return;
      }
    }

    window.open(target, "_blank", "noopener,noreferrer");
  }

  function addNote(moduleId: string, moduleName: string) {
    setNoteSaveError("");
    setNotePopup({
      moduleId,
      title: `Notes - ${moduleName}`,
      note: resourcesMap[moduleId]?.note || "",
    });
  }

  async function saveNoteToResource() {
    if (!notePopup) return;
    const trimmedNote = notePopup.note.trim();
    setIsSavingNote(true);
    setNoteSaveError("");

    try {
      const { data: updatedRows, error: updateErr } = await supabase
        .from("collection_resources")
        .update({ note: trimmedNote })
        .eq("module_id", notePopup.moduleId)
        .select("id");
      if (updateErr) throw updateErr;

      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertErr } = await supabase
          .from("collection_resources")
          .insert({
            module_id: notePopup.moduleId,
            type: "doc",
            note: trimmedNote,
            url: "",
            content: null,
          });
        if (insertErr) throw insertErr;
      }

      setResourcesMap((prev) => ({
        ...prev,
        [notePopup.moduleId]: {
          ...(prev[notePopup.moduleId] || {}),
          note: trimmedNote,
        },
      }));

      setNotePopup(null);
    } catch (err) {
      console.error("Failed to save note in collection_resources:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Could not save note. Check table permissions/policies.";
      setNoteSaveError(message);
    } finally {
      setIsSavingNote(false);
    }
  }

  const filteredItems = items.filter((it) => {
    if (randomOnlyModuleId && it.id !== randomOnlyModuleId) return false;

    if (activeTab === "revision" && !revisionMap[it.id]) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (!it.name.toLowerCase().includes(q)) return false;
    }

    if (solvedFilter === "solved" && !doneMap[it.id]) return false;
    if (solvedFilter === "unsolved" && doneMap[it.id]) return false;

    if (difficultyFilter !== "all" && it.difficulty !== difficultyFilter)
      return false;
    return true;
  });

  const solvedCount = items.filter((it) => doneMap[it.id]).length;
  const solvedPct = items.length > 0 ? (solvedCount / items.length) * 100 : 0;

  const easyTotal = items.filter((it) => it.difficulty === "Easy").length;
  const medTotal = items.filter((it) => it.difficulty === "Medium").length;
  const hardTotal = items.filter((it) => it.difficulty === "Difficult").length;
  const easySolved = items.filter(
    (it) => it.difficulty === "Easy" && doneMap[it.id],
  ).length;
  const medSolved = items.filter(
    (it) => it.difficulty === "Medium" && doneMap[it.id],
  ).length;
  const hardSolved = items.filter(
    (it) => it.difficulty === "Difficult" && doneMap[it.id],
  ).length;
  const allSolved = easySolved + medSolved + hardSolved;
  const allTotal = easyTotal + medTotal + hardTotal;
  const attempting = Math.max(allTotal - allSolved, 0);
  const overallPct =
    allTotal > 0 ? Math.round((allSolved / allTotal) * 100) : 0;

  const sectionList: SectionItem[] = (() => {
    const map = new Map<string, SectionItem>();

    sections.forEach((section) => {
      map.set(normalizeSectionKey(section.sectionKey), section);
    });

    items.forEach((item, idx) => {
      const key = normalizeSectionKey(item.sectionKey);
      if (!key || map.has(key)) return;
      map.set(key, {
        id: `module-${key}`,
        sectionKey: item.sectionKey,
        title: humanizeSectionTitle(item.sectionKey),
        orderNumber: 10000 + idx,
      });
    });

    return Array.from(map.values()).sort(
      (a, b) => a.orderNumber - b.orderNumber,
    );
  })();

  const visibleSectionList = sectionList.filter((section) =>
    filteredItems.some(
      (it) =>
        (section.id && it.sectionId && it.sectionId === section.id) ||
        normalizeSectionKey(it.sectionKey) ===
          normalizeSectionKey(section.sectionKey),
    ),
  );

  const normalizedSectionCompletion: Record<string, boolean> = {};
  sectionList.forEach((section) => {
    const sectionItems = items.filter(
      (it) =>
        (section.id && it.sectionId && it.sectionId === section.id) ||
        normalizeSectionKey(it.sectionKey) ===
          normalizeSectionKey(section.sectionKey),
    );

    const solvedCount = sectionItems.filter((it) => doneMap[it.id]).length;
    normalizedSectionCompletion[normalizeSectionKey(section.sectionKey)] =
      sectionItems.length > 0 && solvedCount === sectionItems.length;
  });

  function resolveUnlockSectionKey(sectionKey?: string, labelOrTitle?: string) {
    const normalizedFromSource = normalizeSectionKey(sectionKey);
    const normalizedLabel = normalizeSectionKey(labelOrTitle);

    if (normalizedLabel === "command-line") {
      // Prefer explicit command-line section completion if present.
      if (normalizedSectionCompletion["command-line"] !== undefined) {
        return "command-line";
      }

      // Fallback to a section whose title resolves to command-line.
      const matchedSection = sectionList.find(
        (section) => normalizeSectionKey(section.title) === "command-line",
      );
      if (matchedSection) {
        return normalizeSectionKey(matchedSection.sectionKey);
      }

      return "command-line";
    }

    return normalizedFromSource;
  }

  function resolveUnlockSectionKeys(
    sectionKey?: string,
    labelOrTitle?: string,
  ) {
    const normalizedLabel = normalizeSectionKey(labelOrTitle);

    if (normalizedLabel === "threads-and-cpu-management") {
      return [
        "threads-and-cpu-scheduling",
        "thread-management",
        "cpu-scheduling",
      ];
    }

    return [resolveUnlockSectionKey(sectionKey, labelOrTitle)].filter(Boolean);
  }

  function isSectionUnlocked(sectionKey?: string, labelOrTitle?: string) {
    const normalizedLabel = normalizeSectionKey(labelOrTitle);
    if (normalizedLabel === "interview-ready") {
      const completionValues = Object.values(normalizedSectionCompletion);
      return completionValues.length > 0 && completionValues.every(Boolean);
    }

    const normalizedKeys = resolveUnlockSectionKeys(sectionKey, labelOrTitle);
    if (normalizedKeys.length === 0) return false;
    return normalizedKeys.some((key) => !!normalizedSectionCompletion[key]);
  }

  function isCheatSheetUnlocked(sheet: CheatSheetItem) {
    const titleKey = normalizeSectionKey(sheet.title);

    if (titleKey === "memory-management") {
      const combined =
        normalizedSectionCompletion["memory-management-virtual-memory"];
      if (combined !== undefined) return !!combined;

      const hasMemoryKey =
        normalizedSectionCompletion["memory-management"] !== undefined;
      const hasVirtualKey =
        normalizedSectionCompletion["virtual-memory"] !== undefined;
      if (hasMemoryKey || hasVirtualKey) {
        return (
          !!normalizedSectionCompletion["memory-management"] &&
          !!normalizedSectionCompletion["virtual-memory"]
        );
      }
    }

    if (titleKey === "file-system-and-i-o-management") {
      const combined =
        normalizedSectionCompletion["file-system-and-i-o-management"];
      if (combined !== undefined) return !!combined;

      const hasFileSystems =
        normalizedSectionCompletion["file-systems"] !== undefined;
      const hasIoSystems =
        normalizedSectionCompletion["io-systems"] !== undefined;
      if (hasFileSystems || hasIoSystems) {
        return (
          !!normalizedSectionCompletion["file-systems"] &&
          !!normalizedSectionCompletion["io-systems"]
        );
      }
    }

    return isSectionUnlocked(sheet.sectionKey, sheet.title);
  }

  const unlockedCheatSheets = cheatSheets.filter((sheet) =>
    isCheatSheetUnlocked(sheet),
  ).length;

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const easyRatio = clamp01(easySolved / easyTotal);
  const medRatio = clamp01(medSolved / medTotal);
  const hardRatio = clamp01(hardSolved / hardTotal);

  // Ring sizing based on r=96 -> circumference ~603
  // Use sequential spans with small fixed gaps to avoid overlap.
  const ringCirc = 603;
  const segGap = 16;
  const easySpan = 189;
  const medSpan = 183;
  const hardSpan = 183;
  const easyStart = 0;
  const medStart = -(easySpan + segGap);
  const hardStart = -(easySpan + segGap + medSpan + segGap);

  return (
    <section className={`${className} py-5`}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-10">
        <div className="lg:col-span-7">
          <div className="mb-5 mt-2 space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
                <div className="inline-flex w-fit rounded-xl border border-white/10 bg-[#1a1c1f] p-0.5 shadow-lg shadow-black/30 md:col-span-3">
                  <button
                    onClick={() => {
                      setActiveTab("all");
                      showAllProblems();
                    }}
                    className={`h-10 rounded-lg px-4 text-xs transition-colors ${
                      activeTab === "all"
                        ? "bg-white/10 text-zinc-100"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    All Problems
                  </button>
                  <button
                    onClick={() => setActiveTab("revision")}
                    className={`h-10 rounded-lg px-4 text-xs transition-colors ${
                      activeTab === "revision"
                        ? "bg-white/10 text-zinc-100"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Revision
                  </button>
                </div>

                <div className="flex h-11 w-full items-center gap-2 rounded-2xl border border-white/10 bg-[#121417] px-3 md:col-span-5">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(
                        "collection-search",
                      ) as HTMLInputElement | null;
                      el?.focus();
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 transition-colors"
                    aria-label="Search"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="7"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M20 20l-3.5-3.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <input
                    id="collection-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search problem"
                    className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                  />
                </div>

                <FilterDropdown
                  value={solvedFilter}
                  onChange={setSolvedFilter}
                  widthClass="w-full md:col-span-4"
                  options={[
                    { value: "all", label: "All problems" },
                    { value: "solved", label: "Solved" },
                    { value: "unsolved", label: "Unsolved" },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
                <FilterDropdown
                  value={difficultyFilter}
                  onChange={setDifficultyFilter}
                  widthClass="w-full md:col-span-4"
                  triggerLabel="Difficulty"
                  options={[
                    { value: "all", label: "Difficulty" },
                    { value: "Easy", label: "Easy" },
                    { value: "Medium", label: "Medium" },
                    { value: "Difficult", label: "Hard" },
                  ]}
                />

                <button
                  onClick={pickRandomProblem}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-[#121417] px-4 text-sm text-zinc-200 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 whitespace-nowrap md:col-span-4"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M16 4h4v4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 18l6-6m0 0 3-3a3 3 0 0 1 4.2 0L20 12"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 6l4 4m0 0 2 2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Random Problem
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-[#2a1b14] px-5 py-4">
              {dataError && (
                <p className="mb-3 text-xs text-rose-300">
                  Could not load some collection data: {dataError}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-5">
                <div className="h-16 w-16 rounded-full border-4 border-black/40 bg-[#151619] flex items-center justify-center text-xl font-semibold">
                  {overallPct}%
                </div>

                <div>
                  <div className="text-base text-zinc-100">
                    Overall Progress
                  </div>
                  <div className="text-lg text-zinc-200">
                    {allSolved} / {allTotal}
                  </div>
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-6 text-sm text-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-emerald-400" />
                    <span>
                      Easy&nbsp;&nbsp;{easySolved}/{easyTotal}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-amber-400" />
                    <span>
                      Medium&nbsp;&nbsp;{medSolved}/{medTotal}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-rose-500" />
                    <span>
                      Hard&nbsp;&nbsp;{hardSolved}/{hardTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {visibleSectionList.map((section) => {
              const sectionItems = filteredItems.filter(
                (it) =>
                  (section.id && it.sectionId && it.sectionId === section.id) ||
                  normalizeSectionKey(it.sectionKey) ===
                    normalizeSectionKey(section.sectionKey),
              );
              const sectionSolved = sectionItems.filter(
                (it) => doneMap[it.id],
              ).length;
              const sectionPct =
                sectionItems.length > 0
                  ? (sectionSolved / sectionItems.length) * 100
                  : 0;
              const isOpen = openSections[section.sectionKey] ?? false;

              return (
                <div
                  key={section.id}
                  className="rounded-2xl border border-white/10 bg-[#111214] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSections((prev) => ({
                        ...prev,
                        [section.sectionKey]: !isOpen,
                      }))
                    }
                    className="w-full border-b border-white/10 px-6 py-5"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        viewBox="0 0 24 24"
                        className={`h-5 w-5 text-zinc-100 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M6 9l6 6 6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-base font-semibold text-zinc-100">
                        {section.title ||
                          humanizeSectionTitle(section.sectionKey)}
                      </span>

                      <div className="ml-auto flex items-center gap-4">
                        <div className="h-2 w-44 rounded-full bg-white/15 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-white/40"
                            style={{ width: `${sectionPct}%` }}
                          />
                        </div>
                        <span className="text-zinc-400 text-base">
                          {sectionSolved} / {sectionItems.length}
                        </span>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 py-5">
                      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0f1012]">
                        <table className="w-full min-w-215 text-left">
                          <thead>
                            <tr className="border-b border-white/10 text-zinc-300">
                              <th className="px-5 py-3 text-sm font-semibold">
                                Status
                              </th>
                              <th className="px-5 py-3 text-sm font-semibold">
                                Problem
                              </th>
                              <th className="px-5 py-3 text-sm font-semibold text-center">
                                Solve
                              </th>
                              <th className="px-5 py-3 text-sm font-semibold">
                                Resource
                              </th>
                              <th className="px-5 py-3 text-sm font-semibold text-center">
                                Note
                              </th>
                              <th className="px-5 py-3 text-sm font-semibold text-center">
                                Revision
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {sectionItems.map((it) => (
                              <tr
                                key={it.id}
                                className="border-b border-white/5 last:border-0"
                              >
                                <td className="px-5 py-3">
                                  {(() => {
                                    const isCompleted =
                                      doneMap[it.id] || !!it.completed;
                                    return (
                                      <button
                                        onClick={() => toggleDone(it.id)}
                                        className="h-7 w-7 rounded-md border border-white/20 bg-black/20 flex items-center justify-center"
                                        aria-label={`Toggle status for ${it.name}`}
                                      >
                                        {isCompleted ? (
                                          <span className="text-emerald-400">
                                            ✓
                                          </span>
                                        ) : (
                                          <span className="text-zinc-500">
                                            ○
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })()}
                                </td>

                                <td className="px-5 py-3 text-zinc-100 text-sm">
                                  {it.name}
                                </td>

                                <td className="px-5 py-3 text-center align-middle">
                                  <button
                                    onClick={() =>
                                      startSolve(it.id, it.name, it.difficulty)
                                    }
                                    className="inline-flex h-9 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 text-sm text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                                  >
                                    Solve
                                  </button>
                                </td>

                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openResource(it.id, "doc")}
                                      className="h-8 w-8 rounded-md border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center"
                                      aria-label={`Open document resource for ${it.name}`}
                                      title="Doc"
                                    >
                                      <svg
                                        viewBox="0 0 24 24"
                                        className="h-4 w-4 text-zinc-200"
                                        fill="none"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M7 3.5h7l4 4V20.5H7z"
                                          stroke="currentColor"
                                          strokeWidth="1.6"
                                          strokeLinejoin="round"
                                        />
                                        <path
                                          d="M14 3.5v4h4"
                                          stroke="currentColor"
                                          strokeWidth="1.6"
                                          strokeLinejoin="round"
                                        />
                                        <path
                                          d="M9.5 12.5h6.5M9.5 15.5h6.5"
                                          stroke="currentColor"
                                          strokeWidth="1.6"
                                          strokeLinecap="round"
                                        />
                                      </svg>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openResource(it.id, "youtube", it.name)
                                      }
                                      className="h-8 w-8 rounded-md border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center"
                                      aria-label={`Open YouTube resource for ${it.name}`}
                                      title="YouTube"
                                    >
                                      <svg
                                        viewBox="0 0 24 24"
                                        className="h-4 w-4 text-red-400"
                                        fill="currentColor"
                                        aria-hidden="true"
                                      >
                                        <path d="M20.2 7.2a2.7 2.7 0 0 0-1.9-1.9C16.6 4.8 12 4.8 12 4.8s-4.6 0-6.3.5a2.7 2.7 0 0 0-1.9 1.9 28.7 28.7 0 0 0 0 9.6 2.7 2.7 0 0 0 1.9 1.9c1.7.5 6.3.5 6.3.5s4.6 0 6.3-.5a2.7 2.7 0 0 0 1.9-1.9 28.7 28.7 0 0 0 0-9.6z" />
                                        <path
                                          d="M10 15.2V8.8l5.2 3.2z"
                                          fill="#0f1012"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </td>

                                <td className="px-5 py-3 text-center align-middle">
                                  <button
                                    type="button"
                                    onClick={() => addNote(it.id, it.name)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/5 text-xl leading-none text-zinc-300 hover:bg-white/10 transition-colors"
                                    aria-label={`Add note for ${it.name}`}
                                    title="Add note"
                                  >
                                    +
                                  </button>
                                </td>
                                <td className="px-5 py-3 text-center align-middle">
                                  <button
                                    type="button"
                                    onClick={() => toggleRevision(it.id)}
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-xl leading-none transition-colors ${
                                      revisionMap[it.id]
                                        ? "border-yellow-400/70 bg-yellow-400/15 text-yellow-300"
                                        : "border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10"
                                    }`}
                                    aria-label={`Toggle revision for ${it.name}`}
                                    title="Revision"
                                  >
                                    ★
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {sectionItems.length === 0 && (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="px-5 py-8 text-center text-sm text-zinc-500"
                                >
                                  No modules found in this section for the
                                  selected filters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            startSectionMockInterview(
                              section.title ||
                                humanizeSectionTitle(section.sectionKey),
                            );
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-md border border-blue-500/40 bg-blue-500/10 px-4 text-sm text-blue-300 hover:bg-blue-500/20 transition-colors"
                        >
                          Mock Interview
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {visibleSectionList.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#111214] px-6 py-8 text-center text-sm text-zinc-500">
                No sections found in collection_sections.
              </div>
            )}
          </div>

          {randomPicked && (
            <div className="mt-3 flex items-center gap-3 text-sm text-zinc-400">
              <span>Random picked: {randomPicked}</span>
              <button
                type="button"
                onClick={showAllProblems}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-1 text-zinc-200 hover:bg-white/10 transition-colors"
              >
                All problems
              </button>
            </div>
          )}
        </div>

        <aside className="lg:col-span-3 rounded-2xl border border-white/10 bg-[#111214] p-4 min-h-95">
          <div className="mb-4 rounded-xl border border-white/10 bg-[#1a1c1f] p-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/TopPanel/profile.png"
                alt="profile avatar"
                className="h-12 w-12 rounded-md object-cover"
              />
              <div>
                <div className="text-xl font-semibold text-zinc-100">
                  {username || "User"}
                </div>
                <div className="text-sm text-zinc-300">Level 5</div>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-md border border-white/15 bg-white/5 py-2 text-sm text-zinc-100 hover:bg-white/10 transition-colors"
            >
              View Profile
            </button>
          </div>

          <div className="rounded-xl border border-white/8 bg-zinc-800/35 p-2.5">
            <div className="grid grid-cols-5 gap-1.5 items-stretch">
              <div className="col-span-3 relative h-40 w-full">
                <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90">
                  {/* Faint full tracks */}
                  <circle
                    cx="120"
                    cy="120"
                    r="96"
                    stroke="rgba(34,197,94,0.24)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${easySpan} ${ringCirc}`}
                    strokeDashoffset={easyStart}
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r="96"
                    stroke="rgba(193,132,47,0.28)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${medSpan} ${ringCirc}`}
                    strokeDashoffset={medStart}
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r="96"
                    stroke="rgba(255,69,69,0.26)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${hardSpan} ${ringCirc}`}
                    strokeDashoffset={hardStart}
                  />

                  {/* Bright completed portions */}
                  <circle
                    cx="120"
                    cy="120"
                    r="96"
                    stroke="#22c55e"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${easySpan * easyRatio} ${ringCirc}`}
                    strokeDashoffset={easyStart}
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r="96"
                    stroke="#c1842f"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${medSpan * medRatio} ${ringCirc}`}
                    strokeDashoffset={medStart}
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r="96"
                    stroke="#ff4545"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${hardSpan * hardRatio} ${ringCirc}`}
                    strokeDashoffset={hardStart}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-xl font-bold leading-none text-zinc-100">
                    {allSolved}
                    <span className="text-xs font-medium text-zinc-200">
                      /{allTotal}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-100">
                    <span className="text-emerald-400">✓</span> Solved
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-400">
                    {attempting} Attempting
                  </div>
                </div>
              </div>

              <div className="col-span-2 space-y-1.5">
                <div className="rounded-lg bg-zinc-700/35 p-1.5 text-center">
                  <div className="text-green-400 text-xs font-semibold">
                    Easy
                  </div>
                  <div className="mt-0.5 text-zinc-100 text-base font-semibold">
                    {easySolved}/{easyTotal}
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-700/35 p-1.5 text-center">
                  <div className="text-[#c1842f] text-xs font-semibold">
                    Med.
                  </div>
                  <div className="mt-0.5 text-zinc-100 text-base font-semibold">
                    {medSolved}/{medTotal}
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-700/35 p-1.5 text-center">
                  <div className="text-[#ff4545] text-xs font-semibold">
                    Hard
                  </div>
                  <div className="mt-0.5 text-zinc-100 text-base font-semibold">
                    {hardSolved}/{hardTotal}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              {courseBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="group relative flex justify-center py-1"
                >
                  <img
                    src={badge.src}
                    alt={badge.label}
                    className={`h-11 w-11 object-contain ${
                      isSectionUnlocked(badge.sectionKey, badge.label)
                        ? "opacity-100"
                        : "opacity-35 grayscale"
                    }`}
                  />
                  <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/15 bg-[#0f1115]/95 px-2 py-1 text-[10px] text-zinc-100 opacity-0 shadow-lg shadow-black/40 transition-opacity duration-150 group-hover:opacity-100">
                    {isSectionUnlocked(badge.sectionKey, badge.label)
                      ? badge.label
                      : `${badge.label} (Locked)`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-[#1a1c1f] p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-zinc-100">
                Cheat Sheets
              </h4>
              <span className="text-sm text-zinc-300">
                {unlockedCheatSheets} / {cheatSheets.length}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Unlock printables
            </p>

            <div className="mt-4 space-y-3">
              {cheatSheets.map((sheet) => {
                const unlocked = isCheatSheetUnlocked(sheet);

                if (!unlocked) {
                  return (
                    <div
                      key={sheet.title}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-zinc-500"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xl">🔒</span>
                        <span className="text-base">{sheet.title}</span>
                      </span>
                      <span className="text-xs">Locked</span>
                    </div>
                  );
                }

                return (
                  <a
                    key={sheet.title}
                    href={sheet.href || "#"}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-zinc-100 hover:bg-white/10 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-xl">📄</span>
                      <span className="text-base">{sheet.title}</span>
                    </span>
                    <span className="text-sm">↗</span>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-[#1a1c1f] p-4">
            <h4 className="text-xl font-semibold text-zinc-100">Need Help?</h4>
            <p className="mt-2 text-sm text-zinc-300">
              Need assistance? Reach out anytime.
            </p>

            <a
              href="/help"
              className="mt-4 flex w-full items-center justify-center rounded-md border border-white/20 bg-black/20 px-4 py-2 text-base text-zinc-100 hover:bg-white/10 transition-colors"
            >
              Reach Us Out!
            </a>
          </div>
        </aside>
      </div>

      {mockDifficulty && (
        <MockInterviewPanel
          difficulty={mockDifficulty}
          topic={topic || undefined}
          mode={panelMode}
          moduleId={activeModuleId || undefined}
          onClose={() => {
            setMockDifficulty(null);
            setTopic(null);
            setPanelMode("interview");
            setActiveModuleId(null);
          }}
        />
      )}

      {interviewIntroPopup && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setInterviewIntroPopup(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-[#0f1115] p-6 shadow-2xl shadow-black/70"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-zinc-100">
              Mock Interview Preview
            </h3>
            <p className="mt-3 text-sm text-zinc-300">
              This interview is for {interviewIntroPopup.sectionTopic}.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {interviewIntroPopup.summary}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  launchSectionMockInterview(interviewIntroPopup.sectionTopic)
                }
                className="inline-flex h-10 items-center justify-center rounded-md border border-blue-500/40 bg-blue-500/10 px-4 text-sm text-blue-300 hover:bg-blue-500/20 transition-colors"
              >
                Take an interview
              </button>
              <button
                type="button"
                onClick={() => {
                  setInterviewIntroPopup(null);
                  window.open("/help", "_blank", "noopener,noreferrer");
                }}
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/15 bg-white/5 px-4 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
              >
                Schedule an interview
              </button>
            </div>
          </div>
        </div>
      )}

      {youtubePopup && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setYoutubePopup(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-[#0f1115] shadow-2xl shadow-black/70"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="truncate pr-3 text-sm font-semibold text-zinc-100">
                {youtubePopup.title}
              </h3>
              <button
                type="button"
                onClick={() => setYoutubePopup(null)}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
              >
                Close
              </button>
            </div>

            <div className="aspect-video w-full bg-black">
              <iframe
                src={youtubePopup.url}
                title={youtubePopup.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {docPopup && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setDocPopup(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-[#0f1115] shadow-2xl shadow-black/70 max-h-96 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="truncate pr-3 text-sm font-semibold text-zinc-100">
                {docPopup.title}
              </h3>
              <button
                type="button"
                onClick={() => setDocPopup(null)}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-4">
              <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {docPopup.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {notePopup && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => {
            setNotePopup(null);
            setNoteSaveError("");
          }}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-[#0f1115] shadow-2xl shadow-black/70 max-h-96 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="truncate pr-3 text-sm font-semibold text-zinc-100">
                {notePopup.title}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setNotePopup(null);
                  setNoteSaveError("");
                }}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
              >
                Close
              </button>
            </div>

            <div className="flex-1 px-4 py-4">
              <textarea
                value={notePopup.note}
                onChange={(e) =>
                  setNotePopup((prev) =>
                    prev ? { ...prev, note: e.target.value } : prev,
                  )
                }
                placeholder="Write your notes here..."
                className="h-44 w-full resize-none rounded-xl border border-white/15 bg-[#111214] px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              />
              {noteSaveError && (
                <p className="mt-2 text-xs text-rose-300">{noteSaveError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setNotePopup(null);
                  setNoteSaveError("");
                }}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveNoteToResource}
                disabled={isSavingNote}
                className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
              >
                {isSavingNote ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
