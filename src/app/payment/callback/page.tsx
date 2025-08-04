"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function PaymentCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "pending"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        const reference = searchParams?.get("reference");
        const trxref = searchParams?.get("trxref");
        const status = searchParams?.get("status");

        if (!reference || !trxref) {
          setStatus("error");
          setMessage("Invalid payment reference");
          return;
        }

        // Check if payment was cancelled
        if (status === "cancelled") {
          setStatus("error");
          setMessage("Payment was cancelled");
          return;
        }

        // For successful payments, show success message
        // The webhook will handle the actual booking creation
        if (status === "success") {
          setStatus("success");
          setMessage(
            "Payment completed successfully! Your booking is being created..."
          );

          // Redirect to dashboard after 5 seconds
          setTimeout(() => {
            router.push("/dashboard");
          }, 5000);
          return;
        }

        // For pending payments, show pending message
        setStatus("pending");
        setMessage(
          "Payment is being processed. You will receive a confirmation shortly."
        );

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } catch (error) {
        console.error("Payment callback error:", error);
        setStatus("error");
        setMessage("An error occurred while processing your payment");
      }
    };

    handlePaymentCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Payment
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your payment...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </>
        )}

        {status === "pending" && (
          <>
            <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Pending
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              You can check your booking status in the dashboard.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
