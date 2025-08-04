import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Fetch all data in parallel with optimized queries
    const [statsResult, recentBookingsResult] = await Promise.all([
      // Get user stats with a single optimized query
      supabase
        .from("bookings")
        .select("booking_status, total")
        .eq("user_id", userId),

      // Get recent bookings with optimized query
      supabase
        .from("bookings")
        .select(
          "id, order_number, pickup_date, booking_status, total, created_at"
        )
        .eq("user_id", userId)
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
    const activeBookings = bookings.filter((b) =>
      ["pending", "confirmed", "in_progress"].includes(b.booking_status)
    ).length;

    const completedOrders = bookings.filter(
      (b) => b.booking_status === "completed"
    ).length;

    const totalSpent = bookings.reduce((sum, b) => sum + b.total, 0);

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
