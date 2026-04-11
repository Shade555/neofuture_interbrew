import { createClient } from "@supabase/supabase-js";
import { Groq } from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Service role client for server-side operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const { userId, forceRefresh } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // Check if we have a recent cached report (less than 7 days old)
    // Skip cache check if forceRefresh is true
    if (!forceRefresh) {
      const { data: cachedReport } = await supabaseAdmin
        .from("user_ai_reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cachedReport) {
        const createdAt = new Date(cachedReport.created_at);
        const now = new Date();
        const daysOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

        if (daysOld < 7) {
          // Return cached report within 7 days
          return NextResponse.json({
            score: cachedReport.score,
            recommendation: cachedReport.recommendation,
            cached: true,
            daysOld: Math.round(daysOld),
          });
        }
      }
    }

    // Fetch collection modules completed
    const { count: collectionModulesCompleted } = await supabaseAdmin
      .from("user_collection_module_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("completed", true);

    // Fetch total collection modules
    const { count: totalCollectionModules } = await supabaseAdmin
      .from("collection_modules")
      .select("id", { count: "exact", head: true });

    // Fetch user's completed scenario modules
    let scenarioModulesCompleted = 0;
    let totalScenarioModules = 0;
    
    try {
      const { count: completed } = await supabaseAdmin
        .from("user_module_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("completed", true);
      scenarioModulesCompleted = completed || 0;
    } catch (err) {
      console.log("Note: user_module_progress table not available");
    }

    try {
      const { count: total } = await supabaseAdmin
        .from("modules")
        .select("id", { count: "exact", head: true });
      totalScenarioModules = total || 0;
    } catch (err) {
      console.log("Note: modules table not available");
    }

    // Fetch user interviews (challenges) - optional table
    let completedInterviews = 0;
    try {
      const { data: interviews } = await supabaseAdmin
        .from("user_interviews")
        .select("status")
        .eq("user_id", userId);

      completedInterviews = interviews?.filter(
        (iv) => iv.status === "completed"
      ).length || 0;
    } catch (err) {
      console.log("Note: user_interviews table not available, skipping challenges count");
    }

    // Fetch user's badged/XP for leaderboard context - optional table
    let userBadgesCount = 0;
    try {
      const { data: userBadges } = await supabaseAdmin
        .from("user_badges")
        .select("id")
        .eq("user_id", userId);

      userBadgesCount = userBadges?.length || 0;
    } catch (err) {
      console.log("Note: user_badges table not available, skipping badges count");
    }

    // Fetch user's position in leaderboard - optional table
    let userXP = 0;
    let leaderboardRank = "N/A";
    try {
      const { data: leaderboardData } = await supabaseAdmin
        .from("user_dashboard")
        .select("xp, leaderboard_rank")
        .eq("user_id", userId)
        .maybeSingle();

      if (leaderboardData) {
        userXP = leaderboardData.xp || 0;
        leaderboardRank = leaderboardData.leaderboard_rank || "N/A";
      }
    } catch (err) {
      console.log("Note: user_dashboard table not available, skipping leaderboard data");
    }

    // Create prompt for Groq
    const prompt = `You are an AI interview preparation coach. Based on the user's progress, provide an assessment of their interview readiness.

User Progress Summary:
- Collection Modules Completed: ${collectionModulesCompleted || 0} / ${totalCollectionModules || 0}
- Scenario Practice Modules Completed: ${scenarioModulesCompleted || 0} / ${totalScenarioModules || 0}
- Mock Interviews Completed: ${completedInterviews}
- Badges Earned: ${userBadgesCount}
- Total XP: ${userXP}
- Leaderboard Rank: ${leaderboardRank}

Based on this data, provide:
1. An interview readiness score (0-100) based on their progress across all areas
2. A brief, actionable recommendation (max 2 sentences) on what they should focus on next

Format your response as JSON with two fields:
{
  "score": <number 0-100>,
  "recommendation": "<text>"
}

Be encouraging but honest. Consider that:
- Collection modules are foundational knowledge
- Scenario practice shows real application skills
- Mock interviews measure confidence and communication
- Higher activity (XP) and rank show consistency`;

    const message = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.choices[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse Groq response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const score = Math.min(100, Math.max(0, parseInt(parsed.score)));
    const recommendation = parsed.recommendation;

    // Store the new report in database for 7-day cache
    try {
      const { data, error: insertError } = await supabaseAdmin.from("user_ai_reports").insert([
        {
          user_id: userId,
          score: score,
          recommendation: recommendation,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.error("Failed to insert AI report:", insertError);
      } else {
        console.log("AI report saved successfully:", data);
      }
    } catch (err) {
      console.error("Error saving AI report to database:", err);
    }

    return NextResponse.json({
      score,
      recommendation,
      cached: false,
    });
  } catch (error) {
    console.error("AI Report generation failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to generate report: ${errorMessage}` },
      { status: 500 }
    );
  }
}
