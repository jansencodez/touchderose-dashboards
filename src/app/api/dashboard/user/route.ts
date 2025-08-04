import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a service role client for user operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authUserId = searchParams.get("userId");

    if (!authUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // First, get the profile ID from auth_user_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profileId = profile.id;

    // Fetch all data in parallel with optimized queries
    const [statsResult, recentBookingsResult] = await Promise.all([
      // Get user stats with a single optimized query
      supabaseAdmin
        .from("bookings")
        .select("booking_status, total")
        .eq("user_id", profileId),

      // Get recent bookings with optimized query
      supabaseAdmin
        .from("bookings")
        .select(
          "id, order_number, pickup_date, delivery_date, booking_status, payment_status, total, created_at, address"
        )
        .eq("user_id", profileId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (statsResult.error) {
      console.error("Error fetching user stats:", statsResult.error);
      return NextResponse.json(
        { error: "Failed to fetch user stats" },
        { status: 500 }
      );
    }

    if (recentBookingsResult.error) {
      console.error(
        "Error fetching recent bookings:",
        recentBookingsResult.error
      );
      return NextResponse.json(
        { error: "Failed to fetch recent bookings" },
        { status: 500 }
      );
    }

    // Calculate stats from the data
    const bookings = statsResult.data || [];
    const activeBookings = bookings.filter((b: any) =>
      ["pending", "confirmed", "in_progress"].includes(b.booking_status)
    ).length;

    const completedOrders = bookings.filter(
      (b: any) => b.booking_status === "completed"
    ).length;

    const totalSpent = bookings.reduce(
      (sum: number, b: any) => sum + b.total,
      0
    );

    const stats = {
      activeBookings,
      completedOrders,
      totalSpent,
    };

    return NextResponse.json({
      success: true,
      stats,
      recentBookings: recentBookingsResult.data || [],
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
