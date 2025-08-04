import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a service role client for admin operations
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

export async function GET() {
  try {
    console.log("Admin Dashboard API: Starting data fetch...");

    // Fetch all data in parallel with optimized queries
    const [bookingsResult, profilesResult, paymentsResult, feedbackResult] =
      await Promise.all([
        // Get bookings with optimized query
        supabaseAdmin
          .from("bookings")
          .select("id, booking_status, total, created_at")
          .order("created_at", { ascending: false })
          .limit(1000),

        // Get profiles with optimized query
        supabaseAdmin
          .from("profiles")
          .select("id, role, created_at")
          .order("created_at", { ascending: false })
          .limit(1000),

        // Get payments with optimized query
        supabaseAdmin
          .from("payments")
          .select("id, amount, payment_status, created_at")
          .order("created_at", { ascending: false })
          .limit(1000),

        // Get feedback with optimized query
        supabaseAdmin
          .from("feedbacks")
          .select("id, status, created_at")
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);

    console.log("Admin Dashboard API: Raw query results:", {
      bookings: {
        data: bookingsResult.data?.length || 0,
        error: bookingsResult.error,
      },
      profiles: {
        data: profilesResult.data?.length || 0,
        error: profilesResult.error,
      },
      payments: {
        data: paymentsResult.data?.length || 0,
        error: paymentsResult.error,
      },
      feedbacks: {
        data: feedbackResult.data?.length || 0,
        error: feedbackResult.error,
      },
    });

    // Handle errors for each query
    if (bookingsResult.error) {
      console.error("Error fetching bookings:", bookingsResult.error);
    }
    if (profilesResult.error) {
      console.error("Error fetching profiles:", profilesResult.error);
    }
    if (paymentsResult.error) {
      console.error("Error fetching payments:", paymentsResult.error);
    }
    if (feedbackResult.error) {
      console.error("Error fetching feedback:", feedbackResult.error);
    }

    const bookings = bookingsResult.data || [];
    const profiles = profilesResult.data || [];
    const payments = paymentsResult.data || [];
    const feedbacks = feedbackResult.data || [];

    console.log("Admin Dashboard API: Basic data fetched:", {
      bookings: bookings.length,
      profiles: profiles.length,
      payments: payments.length,
      feedbacks: feedbacks.length,
    });

    // Calculate stats
    const revenue = payments
      .filter((p) => p.payment_status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingOrders = bookings.filter((b) =>
      ["pending", "confirmed"].includes(b.booking_status)
    ).length;

    const stats = {
      totalBookings: bookings.length,
      activeUsers: profiles.filter((u) => u.role === "customer").length,
      revenue,
      pendingOrders,
      feedback: feedbacks.length,
      growthRate: 23, // Mock growth rate
    };

    console.log("Admin Dashboard API: Stats calculated:", stats);

    // Fetch recent data with simpler queries first
    const [recentBookingsResult, recentPaymentsResult] = await Promise.all([
      // Get recent bookings without joins first
      supabaseAdmin
        .from("bookings")
        .select(
          "id, order_number, pickup_date, total, booking_status, created_at, user_id"
        )
        .order("created_at", { ascending: false })
        .limit(5),

      // Get recent payments without joins first
      supabaseAdmin
        .from("payments")
        .select(
          "id, amount, payment_method, payment_status, created_at, user_id, booking_id"
        )
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    let recentBookings = recentBookingsResult.data || [];
    let recentPayments = recentPaymentsResult.data || [];

    if (recentBookingsResult.error) {
      console.error(
        "Error fetching recent bookings:",
        recentBookingsResult.error
      );
      recentBookings = [];
    }
    if (recentPaymentsResult.error) {
      console.error(
        "Error fetching recent payments:",
        recentPaymentsResult.error
      );
      recentPayments = [];
    }

    // Try to get user names for recent bookings
    if (recentBookings.length > 0) {
      try {
        const userIds = Array.from(
          new Set(recentBookings.map((b) => b.user_id))
        );
        const { data: userProfiles, error: userError } = await supabaseAdmin
          .from("profiles")
          .select("id, name, email")
          .in("id", userIds);

        if (!userError && userProfiles) {
          const userMap = new Map(userProfiles.map((u: any) => [u.id, u]));
          recentBookings = recentBookings.map((booking: any) => ({
            ...booking,
            profiles: userMap.get(booking.user_id) || { name: "Unknown" },
          }));
        }
      } catch (error) {
        console.error("Error fetching user profiles for bookings:", error);
        recentBookings = recentBookings.map((booking) => ({
          ...booking,
          profiles: { name: "Unknown" },
        }));
      }
    }

    // Try to get user names and booking info for recent payments
    if (recentPayments.length > 0) {
      try {
        const userIds = Array.from(
          new Set(recentPayments.map((p) => p.user_id))
        );
        const bookingIds = Array.from(
          new Set(recentPayments.map((p) => p.booking_id).filter(Boolean))
        );

        const [userProfilesResult, bookingInfoResult] = await Promise.all([
          supabaseAdmin
            .from("profiles")
            .select("id, name, email")
            .in("id", userIds),
          bookingIds.length > 0
            ? supabaseAdmin
                .from("bookings")
                .select("id, order_number")
                .in("id", bookingIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        const userMap = new Map(
          (userProfilesResult.data || []).map((u: any) => [u.id, u])
        );
        const bookingMap = new Map(
          (bookingInfoResult.data || []).map((b: any) => [b.id, b])
        );

        recentPayments = recentPayments.map((payment) => ({
          ...payment,
          profiles: userMap.get(payment.user_id) || { name: "Unknown" },
          bookings: bookingMap.get(payment.booking_id) || {
            order_number: "Unknown",
          },
        }));
      } catch (error) {
        console.error(
          "Error fetching user profiles and booking info for payments:",
          error
        );
        recentPayments = recentPayments.map((payment) => ({
          ...payment,
          profiles: { name: "Unknown" },
          bookings: { order_number: "Unknown" },
        }));
      }
    }

    console.log("Admin Dashboard API: Recent data processed:", {
      recentBookings: recentBookings.length,
      recentPayments: recentPayments.length,
    });

    return NextResponse.json({
      success: true,
      stats,
      recentBookings,
      recentPayments,
    });
  } catch (error) {
    console.error("Admin dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin dashboard data" },
      { status: 500 }
    );
  }
}
