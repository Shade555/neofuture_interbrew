"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const CATEGORIES = [
  { id: "XP", label: "XP", icon: "⭐", color: "#22c55e" },
  { id: "Streaks", label: "Streaks", icon: "🔥", color: "#f97316" },
  { id: "Badges", label: "Badges", icon: "🎖️", color: "#3b82f6" },
  { id: "Certificates", label: "Certificates", icon: "🏅", color: "#ec4899" },
];

// Fallback mock data when Supabase is not connected
const MOCK_LEADERBOARD = [
  {
    id: "1",
    rank: 1,
    user_name: "alex.chen@example.com",
    company: "Tech Corp",
    category: "XP",
    xp: 2450,
    streaks: 45,
    badges: 12,
    certificates: 3,
    challenges: 48,
    accuracy: 92,
    month: 4,
    year: 2026,
  },
  {
    id: "2",
    rank: 2,
    user_name: "sarah.kim@example.com",
    company: "InnovateLabs",
    category: "XP",
    xp: 2380,
    streaks: 42,
    badges: 11,
    certificates: 3,
    challenges: 45,
    accuracy: 89,
    month: 4,
    year: 2026,
  },
  {
    id: "3",
    rank: 3,
    user_name: "james.liu@example.com",
    company: "DataSys",
    category: "XP",
    xp: 2250,
    streaks: 38,
    badges: 10,
    certificates: 2,
    challenges: 42,
    accuracy: 87,
    month: 4,
    year: 2026,
  },
  {
    id: "4",
    rank: 4,
    user_name: "priya.sharma@example.com",
    company: "Tech Corp",
    category: "XP",
    xp: 2180,
    streaks: 35,
    badges: 9,
    certificates: 2,
    challenges: 40,
    accuracy: 85,
    month: 4,
    year: 2026,
  },
  {
    id: "5",
    rank: 5,
    user_name: "mike.johnson@example.com",
    company: "CloudWave",
    category: "XP",
    xp: 2100,
    streaks: 32,
    badges: 8,
    certificates: 2,
    challenges: 38,
    accuracy: 84,
    month: 4,
    year: 2026,
  },
  {
    id: "6",
    rank: 6,
    user_name: "emma.wilson@example.com",
    company: "InnovateLabs",
    category: "XP",
    xp: 2050,
    streaks: 30,
    badges: 7,
    certificates: 1,
    challenges: 36,
    accuracy: 82,
    month: 4,
    year: 2026,
  },
  {
    id: "7",
    rank: 7,
    user_name: "david.lee@example.com",
    company: "DataSys",
    category: "XP",
    xp: 1980,
    streaks: 28,
    badges: 6,
    certificates: 1,
    challenges: 34,
    accuracy: 81,
    month: 4,
    year: 2026,
  },
  {
    id: "8",
    rank: 8,
    user_name: "lisa.brown@example.com",
    company: "CloudWave",
    category: "XP",
    xp: 1920,
    streaks: 26,
    badges: 5,
    certificates: 1,
    challenges: 32,
    accuracy: 80,
    month: 4,
    year: 2026,
  },
  {
    id: "9",
    rank: 9,
    user_name: "tom.harris@example.com",
    company: "Tech Corp",
    category: "XP",
    xp: 1850,
    streaks: 24,
    badges: 4,
    certificates: 1,
    challenges: 30,
    accuracy: 78,
    month: 4,
    year: 2026,
  },
  {
    id: "10",
    rank: 10,
    user_name: "amy.zhang@example.com",
    company: "InnovateLabs",
    category: "XP",
    xp: 1800,
    streaks: 22,
    badges: 3,
    certificates: 1,
    challenges: 28,
    accuracy: 77,
    month: 4,
    year: 2026,
  },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function Leaderboard() {
  const [selectedCategory, setSelectedCategory] = useState("XP");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR.toString());
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);

  // Get the metric value for a category
  const getDynamicMetric = (entry) => {
    switch (selectedCategory) {
      case "Streaks":
        return entry.streaks || 0;
      case "Badges":
        return entry.badges || 0;
      case "Certificates":
        return entry.certificates || 0;
      case "XP":
      default:
        return entry.xp || 0;
    }
  };

  // Get category color
  const getCategoryColor = () => {
    const category = CATEGORIES.find((c) => c.id === selectedCategory);
    return category?.color || "#22c55e";
  };
  // Fetch leaderboard data from Supabase
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);

        // Check if Supabase is available
        if (!supabase) {
          console.log("Supabase not configured, using mock leaderboard data");
          setUseMockData(true);
          setLeaderboard(MOCK_LEADERBOARD);
          setLoading(false);
          return;
        }

        // Query the leaderboard_view which includes rank calculation and category data
        let query = supabase
          .from("leaderboard_view")
          .select("*")
          .eq("category", selectedCategory)
          .order("rank", { ascending: true });

        // Filter by month if selected
        if (selectedMonth !== "All") {
          query = query.eq("month", parseInt(selectedMonth));
        }

        // Filter by year if selected
        if (selectedYear) {
          query = query.eq("year", parseInt(selectedYear));
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching leaderboard:", error.message);
          // Fallback to mock data on error
          console.log("Using mock leaderboard data as fallback");
          setUseMockData(true);
          setLeaderboard(MOCK_LEADERBOARD);
        } else if (data && data.length > 0) {
          setLeaderboard(data);
          setUseMockData(false);
        } else {
          // No data in Supabase, use mock data
          console.log("No leaderboard data in Supabase, using mock data");
          setUseMockData(true);
          setLeaderboard(MOCK_LEADERBOARD);
        }
      } catch (err) {
        console.error("Exception fetching leaderboard:", err.message);
        setUseMockData(true);
        setLeaderboard(MOCK_LEADERBOARD);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to avoid race conditions
    const timer = setTimeout(() => {
      fetchLeaderboard();
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedCategory, selectedMonth, selectedYear]);

  // Leaderboard data is pre-filtered by SQL query
  const filteredLeaderboard = leaderboard;

  return (
    <div className="relative min-h-screen bg-black/30 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Leaderboard
          </h1>
          <p className="text-gray-400 text-sm">
            Top performers across all teams
          </p>
          {useMockData && (
            <p className="text-yellow-500 text-xs mt-2">
              📊 Showing demo data - Connect Supabase for live data
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/10 shadow-xl mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm font-medium">
                Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm font-medium">
                Month:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              >
                <option value="All">All Time</option>
                {MONTHS.map((month, idx) => (
                  <option key={month} value={idx + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm font-medium">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-gray-500 text-sm">Showing</span>
              <span className="text-emerald-400 font-bold">
                {filteredLeaderboard.length}
              </span>
              <span className="text-gray-500 text-sm">users</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="text-emerald-400 text-lg">
              Loading leaderboard...
            </div>
          </div>
        )}

        {/* Leaderboard Content */}
        {!loading && (
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Top 3 Podium */}
            {filteredLeaderboard.length >= 3 && (
              <div className="flex justify-center items-end gap-4 p-8 bg-linear-to-b from-emerald-500/5 to-transparent">
                {/* 2nd Place */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full border-4 border-gray-400/30 bg-black/40 flex items-center justify-center text-3xl font-black text-gray-400">
                    2
                  </div>
                  <p className="text-white font-semibold mb-1">
                    {filteredLeaderboard[1]?.user_name || "N/A"}
                  </p>
                  <p className="text-sm mb-1 text-gray-400">
                    {filteredLeaderboard[1]?.company || "N/A"}
                  </p>
                  <p className="text-emerald-400 font-bold">
                    {getDynamicMetric(filteredLeaderboard[1]) || 0}
                  </p>
                </div>
                {/* 1st Place */}
                <div className="text-center -mt-4">
                  <div className="w-24 h-24 mx-auto mb-3 rounded-full border-4 border-yellow-400 bg-black/40 flex items-center justify-center text-4xl font-black text-yellow-400">
                    1
                  </div>
                  <p className="text-white font-bold text-lg mb-1">
                    {filteredLeaderboard[0]?.user_name || "N/A"}
                  </p>
                  <p className="text-sm mb-1 text-gray-400">
                    {filteredLeaderboard[0]?.company || "N/A"}
                  </p>
                  <p className="text-emerald-400 font-bold text-xl">
                    {getDynamicMetric(filteredLeaderboard[0]) || 0}
                  </p>
                </div>
                {/* 3rd Place */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full border-4 border-orange-600/30 bg-black/40 flex items-center justify-center text-3xl font-black text-orange-600/50">
                    3
                  </div>
                  <p className="text-white font-semibold mb-1">
                    {filteredLeaderboard[2]?.user_name || "N/A"}
                  </p>
                  <p className="text-sm mb-1 text-gray-400">
                    {filteredLeaderboard[2]?.company || "N/A"}
                  </p>
                  <p className="text-emerald-400 font-bold">
                    {getDynamicMetric(filteredLeaderboard[2]) || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 border-t border-white/10">
              <span className="col-span-2 text-gray-500 text-xs font-semibold">
                RANK
              </span>
              <span className="col-span-4 text-gray-500 text-xs font-semibold">
                USER
              </span>
              <span className="col-span-3 text-gray-500 text-xs font-semibold text-right">
                {selectedCategory.toUpperCase()}
              </span>
              <span className="col-span-3 text-gray-500 text-xs font-semibold text-right">
                ACCURACY
              </span>
            </div>

            {/* Table Body */}
            <div>
              {filteredLeaderboard.map((entry, idx) => (
                <div
                  key={entry.id || entry.rank || idx}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 transition-colors ${
                    entry.rank <= 3
                      ? "bg-emerald-500/5"
                      : "hover:bg-white/5"
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-2 flex items-center">
                    {entry.rank === 1 ? (
                      <span className="text-2xl">🏆</span>
                    ) : entry.rank === 2 ? (
                      <span className="text-gray-400 font-black text-lg">
                        2
                      </span>
                    ) : entry.rank === 3 ? (
                      <span className="text-orange-600/60 font-black text-lg">
                        3
                      </span>
                    ) : (
                      <span className="text-gray-500 font-semibold">
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">
                      {(entry.user_name || "U").charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {entry.user_name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {entry.company || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Category Metric */}
                  <div className="col-span-3 flex items-center justify-end">
                    <span
                      className="font-bold"
                      style={{ color: getCategoryColor() }}
                    >
                      {getDynamicMetric(entry) || 0}
                    </span>
                  </div>

                  {/* Accuracy */}
                  <div className="col-span-3 flex items-center justify-end">
                    <span
                      className={`font-semibold ${
                        (entry.accuracy || 0) >= 90
                          ? "text-emerald-400"
                          : (entry.accuracy || 0) >= 80
                            ? "text-yellow-400"
                            : "text-orange-400"
                      }`}
                    >
                      {entry.accuracy || 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredLeaderboard.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-2">No results found</p>
                <p className="text-gray-500 text-sm">
                  Try adjusting your filters
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}