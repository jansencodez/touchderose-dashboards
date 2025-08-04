import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const searchTerm = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build optimized query with joins
    let query = supabase
      .from("bookings")
      .select(
        `
        id, order_number, pickup_date, delivery_date, time_slot, 
        address, special_instructions, total, payment_method, 
        payment_status, booking_status, created_at,
        profiles!inner(name, email, phone),
        booking_items(id, name, quantity, price)
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filter !== "all") {
      query = query.eq("booking_status", filter);
    }

    // Apply search
    if (searchTerm) {
      query = query.or(
        `order_number.ilike.%${searchTerm}%,profiles.name.ilike.%${searchTerm}%`
      );
    }

    const { data: bookings, error, count } = await query;

    if (error) {
      console.error("Error fetching admin bookings:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Admin bookings API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
