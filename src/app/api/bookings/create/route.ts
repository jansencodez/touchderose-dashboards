import { NextRequest, NextResponse } from "next/server";
import { initializePayment } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      pickup_date,
      delivery_date,
      time_slot,
      address,
      special_instructions,
      payment_method,
      items,
      user_email,
    } = body;

    // Validate required fields
    if (
      !user_id ||
      !pickup_date ||
      !delivery_date ||
      !address ||
      !items ||
      !user_email
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate total
    const total = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.price,
      0
    );

    // Generate reference for payment
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const reference = `PAY-${date}-${random}`;

    // Handle payment based on payment method
    if (payment_method === "card" || payment_method === "mobile-money") {
      try {
        // Prepare booking data to be stored in metadata
        const bookingData = {
          user_id,
          pickup_date,
          delivery_date,
          time_slot,
          address,
          special_instructions,
          payment_method,
          items,
          total,
        };

        // Set payment channels based on method
        const channels =
          payment_method === "mobile-money"
            ? ["mobile_money"]
            : ["card", "bank", "mobile_money"];

        // Initialize Paystack payment with booking data in metadata
        const paymentResponse = await initializePayment(
          total,
          user_email,
          reference,
          {
            user_id,
            reference,
          },
          bookingData, // Pass booking data to be stored in metadata
          channels // Pass payment channels
        );

        if (paymentResponse.status && paymentResponse.data?.authorization_url) {
          return NextResponse.json({
            success: true,
            payment: {
              authorization_url: paymentResponse.data.authorization_url,
              reference: paymentResponse.data.reference,
            },
            message: "Payment initialized successfully",
          });
        } else {
          throw new Error("Failed to initialize payment");
        }
      } catch (paymentError) {
        console.error("Payment initialization error:", paymentError);
        return NextResponse.json(
          { error: "Failed to initialize payment" },
          { status: 500 }
        );
      }
    } else {
      // For cash payments, create booking immediately
      // This would need to be implemented if you want to support offline payments
      return NextResponse.json({
        success: true,
        message: "Booking created successfully (cash payment)",
        note: "Cash payment bookings need separate implementation",
      });
    }
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
