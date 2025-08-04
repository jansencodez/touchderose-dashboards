import { NextRequest, NextResponse } from "next/server";
import { initializePayment } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      email,
      reference,
      metadata,
      bookingData, // This will be stored temporarily
    } = body;

    if (!amount || !email || !reference || !metadata || !bookingData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Store booking data temporarily (could use Redis or database)
    // For now, we'll pass it through metadata
    const enhancedMetadata = {
      ...metadata,
      bookingData: JSON.stringify(bookingData), // Store booking data in metadata
    };

    const response = await initializePayment(
      amount,
      email,
      reference,
      enhancedMetadata
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Payment initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
