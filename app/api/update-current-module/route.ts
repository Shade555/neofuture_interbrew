import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Service role client for server-side operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const { userId, moduleName, modulePath } = await req.json();

    if (!userId || !moduleName || !modulePath) {
      return NextResponse.json(
        { error: "userId, moduleName, and modulePath are required" },
        { status: 400 }
      );
    }

    // Update current module in user_dashboard using service role
    const { data, error } = await supabaseAdmin
      .from("user_dashboard")
      .update({
        current_module_name: moduleName,
        current_module_path: modulePath,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating current module:", error);
      return NextResponse.json(
        { error: `Failed to update current module: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Current module updated",
      data,
    });
  } catch (error) {
    console.error("API error updating current module:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to update: ${errorMessage}` },
      { status: 500 }
    );
  }
}
