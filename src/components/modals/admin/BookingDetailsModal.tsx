"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  MapPin,
  Package,
  CreditCard,
  Clock,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../../../lib/supabase";
import { Booking, BookingStatus, PaymentStatus } from "../../../types";
import { StatusBadge } from "../../ui/StatusBadge";
import { LoadingSpinner } from "../../ui/LoadingSpinner";

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onUpdate?: () => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  isOpen,
  onClose,
  booking,
  onUpdate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(
    booking?.booking_status || "pending"
  );
  const [paymentStatus, setPaymentStatus] = useState(
    booking?.payment_status || "pending"
  );

  const handleStatusUpdate = async () => {
    if (!booking) return;

    setIsLoading(true);
    toast.loading("Updating booking...", { id: "booking-update" });

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          booking_status: bookingStatus,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (error) throw error;

      toast.success("Booking updated successfully!", { id: "booking-update" });
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking", { id: "booking-update" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Booking Details - {booking.order_number}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">
                  {booking.profile?.name || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">
                  {booking.profile?.email || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Info */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm font-medium">Pickup</div>
                  <div className="text-sm text-gray-600">
                    {new Date(booking.pickup_date).toLocaleDateString()} at{" "}
                    {new Date(booking.pickup_date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm font-medium">Delivery</div>
                  <div className="text-sm text-gray-600">
                    {new Date(booking.delivery_date).toLocaleDateString()} at{" "}
                    {new Date(booking.delivery_date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Address
            </h3>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
              {booking.address}
            </p>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Items
            </h3>
            <div className="space-y-2">
              {booking.booking_items?.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="text-sm font-medium">
                    ${(item.price / 100).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border-t border-blue-200">
                <span className="font-medium">Total</span>
                <span className="font-bold text-blue-600">
                  ${(booking.total / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Method:</span>
                <span className="ml-2 font-medium capitalize">
                  {booking.payment_method.replace("-", " ")}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium">
                  ${(booking.total / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {booking.special_instructions && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Special Instructions
              </h3>
              <p className="text-sm text-gray-700 bg-yellow-50 rounded-lg p-3">
                {booking.special_instructions}
              </p>
            </div>
          )}

          {/* Status Updates */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 mb-4">Update Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Status
                </label>
                <select
                  value={bookingStatus}
                  onChange={(e) =>
                    setBookingStatus(e.target.value as BookingStatus)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) =>
                    setPaymentStatus(e.target.value as PaymentStatus)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
            <div className="flex space-x-4">
              <StatusBadge status={booking.booking_status} type="booking" />
              <StatusBadge status={booking.payment_status} type="payment" />
            </div>
          </div>
        </div>

        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleStatusUpdate}
            disabled={
              isLoading ||
              (bookingStatus === booking.booking_status &&
                paymentStatus === booking.payment_status)
            }
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
};
