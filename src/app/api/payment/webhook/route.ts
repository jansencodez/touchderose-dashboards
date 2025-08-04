import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.event) {
      case "charge.success":
        await handleSuccessfulPayment(event.data);
        break;

      case "charge.failed":
        await handleFailedPayment(event.data);
        break;

      case "transfer.success":
        await handleTransferSuccess(event.data);
        break;

      case "transfer.failed":
        await handleTransferFailed(event.data);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(data: any) {
  try {
    const { reference, amount, metadata } = data;

    // Parse booking data from metadata
    let bookingData;
    try {
      bookingData = JSON.parse(metadata?.bookingData || "{}");
    } catch (error) {
      console.error("Error parsing booking data:", error);
      return;
    }

    // Generate order number
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const orderNumber = `ORD-${date}-${random}`;

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: metadata?.user_id,
        order_number: orderNumber,
        pickup_date: bookingData.pickup_date,
        delivery_date: bookingData.delivery_date,
        time_slot: bookingData.time_slot,
        address: bookingData.address,
        special_instructions: bookingData.special_instructions,
        total: amount, // Use the actual paid amount
        payment_method: bookingData.payment_method,
        payment_status: "completed",
        booking_status: "confirmed",
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      return;
    }

    // Create booking items
    if (bookingData.items && bookingData.items.length > 0) {
      const bookingItems = bookingData.items.map((item: any) => ({
        booking_id: booking.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("booking_items")
        .insert(bookingItems);

      if (itemsError) {
        console.error("Error creating booking items:", itemsError);
      }
    }

    // Create payment record
    const { error: paymentError } = await supabase.from("payments").insert({
      booking_id: booking.id,
      amount: amount,
      payment_method: bookingData.payment_method,
      payment_status: "completed",
      transaction_reference: reference,
      user_id: metadata?.user_id,
    });

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
    }

    console.log(
      `Payment and booking successful for reference: ${reference}, order: ${orderNumber}`
    );
  } catch (error) {
    console.error("Error handling successful payment:", error);
  }
}

async function handleFailedPayment(data: any) {
  try {
    const { reference, metadata } = data;

    console.log(`Payment failed for reference: ${reference}`);

    // You might want to send a notification to the user about the failed payment
    // or create a failed booking record for tracking purposes
  } catch (error) {
    console.error("Error handling failed payment:", error);
  }
}

async function handleTransferSuccess(data: any) {
  console.log("Transfer successful:", data);
  // Handle transfer success if needed
}

async function handleTransferFailed(data: any) {
  console.log("Transfer failed:", data);
  // Handle transfer failure if needed
}
