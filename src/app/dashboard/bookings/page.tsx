/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { Booking } from "@/types";
import { BookingModal } from "@/components/modals/BookingModal";
import { StatusBadge } from "@/components/ui/StatusBadge";

// LoadingSpinner Component
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}
    />
  );
};

export default function UserBookings() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id, order_number, pickup_date, delivery_date, time_slot, address,
          special_instructions, total, payment_method, payment_status,
          booking_status, created_at,
          booking_items(id, name, quantity, price)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("UserBookings: Raw data from Supabase:", data);
      console.log("UserBookings: User ID being used:", user.id);
      console.log("UserBookings: Number of bookings found:", data?.length || 0);

      setBookings((data as any) || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings =
    filter === "all"
      ? bookings
      : bookings.filter((booking) => booking.booking_status === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <button
          onClick={() => setShowBookingModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Booking
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto">
        {[
          "all",
          "pending",
          "confirmed",
          "in_progress",
          "completed",
          "cancelled",
        ].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {booking.order_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <StatusBadge status={booking.booking_status} type="booking" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Pickup: {new Date(booking.pickup_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Delivery:{" "}
                  {new Date(booking.delivery_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{booking.address}</span>
            </div>

            {booking.booking_items && booking.booking_items.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                <div className="space-y-1">
                  {booking.booking_items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm text-gray-600"
                    >
                      <span>{item.name}</span>
                      <span>
                        {item.quantity} x KES {item.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total:</span> KES{" "}
                {booking.total.toLocaleString()}
              </div>
              <div className="flex space-x-2">
                <StatusBadge status={booking.payment_status} type="payment" />
              </div>
            </div>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {filter === "all"
                ? "No bookings found"
                : `No ${filter} bookings found`}
            </p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            fetchBookings(); // Refresh the bookings list
          }}
        />
      )}
    </div>
  );
}
