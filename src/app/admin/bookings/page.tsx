"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Package,
  Eye,
  Edit,
  List,
  Table,
  Kanban,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { BookingDetailsModal } from "../../../components/modals/admin/BookingDetailsModal";
import { EditBookingModal } from "../../../components/modals/admin/EditBookingModal";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { supabase } from "../../../lib/supabase";
import { Booking } from "../../../types";

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

// Booking Line Component
interface BookingLineProps {
  booking: Booking;
  onStatusUpdate: (bookingId: string, newStatus: string) => void;
  onViewDetails: (booking: Booking) => void;
}

const BookingLine: React.FC<BookingLineProps> = ({
  booking,
  onStatusUpdate,
  onViewDetails,
}) => {
  const statuses = ["pending", "confirmed", "in_progress", "completed"];
  const currentIndex = statuses.indexOf(booking.booking_status);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (
    status: string,
    isActive: boolean,
    isCompleted: boolean
  ) => {
    if (isCompleted) return "bg-green-500 text-white";
    if (isActive) return "bg-blue-500 text-white";
    return "bg-gray-300 text-gray-500";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-100 p-1.5 rounded-lg">
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {booking.order_number}
            </h3>
            <p className="text-xs text-gray-600">
              {booking.profile?.name} ({booking.profile?.email})
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <StatusBadge status={booking.booking_status} type="booking" />
          <StatusBadge status={booking.payment_status} type="payment" />
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          {statuses.map((status, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;
            const isNext = index === currentIndex + 1;

            return (
              <div key={status} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${getStatusColor(
                      status,
                      isActive,
                      isCompleted
                    )}`}
                  >
                    {getStatusIcon(status)}
                  </div>
                  <span className="text-xs text-gray-600 mt-1 capitalize">
                    {status.replace("_", " ")}
                  </span>
                </div>
                {index < statuses.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      isCompleted ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3 text-gray-500" />
          <span className="text-xs text-gray-600">
            Pickup: {new Date(booking.pickup_date).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-gray-500" />
          <span className="text-xs text-gray-600">
            Delivery: {new Date(booking.delivery_date).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <span className="font-medium">Total:</span> KES{" "}
          {booking.total.toLocaleString()}
        </div>
        <div className="flex items-center space-x-2">
          {/* Status Update Buttons */}
          {currentIndex < statuses.length - 1 && (
            <button
              onClick={() =>
                onStatusUpdate(booking.id, statuses[currentIndex + 1])
              }
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs font-medium bg-blue-50 px-2 py-1 rounded"
            >
              <ArrowRight className="w-3 h-3" />
              <span>Next</span>
            </button>
          )}
          <button
            onClick={() => onViewDetails(booking)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
          >
            <Eye className="w-3 h-3" />
            <span>View</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminBookings() {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "table" | "line">("line");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id, order_number, pickup_date, delivery_date, time_slot, address, 
          special_instructions, total, payment_method, payment_status, 
          booking_status, created_at, updated_at, user_id,
          profile:profiles!inner(name, email),
          booking_items!inner(id, name, quantity, price)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      } else {
        setBookings((data as any) || []);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesFilter = filter === "all" || booking.booking_status === filter;
    const matchesSearch =
      booking.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.profile?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.profile?.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          booking_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (error) throw error;

      fetchBookings();
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Failed to update booking status");
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowEditModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-sm text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Booking Management</h1>
        <div className="flex items-center space-x-2">
          <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            Export Data
          </button>
        </div>
      </div>

      {/* Filters, Search, and View Toggle */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex space-x-1 overflow-x-auto">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() +
                status.slice(1).replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by order number, customer name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("line")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "line"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Timeline View"
          >
            <Kanban className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "list"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "table"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Table View"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bookings Display */}
      {viewMode === "line" ? (
        /* Timeline View */
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <BookingLine
              key={booking.id}
              booking={booking}
              onStatusUpdate={updateBookingStatus}
              onViewDetails={handleViewDetails}
            />
          ))}

          {filteredBookings.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">
                {searchTerm
                  ? "No bookings found matching your search"
                  : filter === "all"
                  ? "No bookings found"
                  : `No ${filter} bookings found`}
              </p>
            </div>
          )}
        </div>
      ) : viewMode === "list" ? (
        /* List View */
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {booking.order_number}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {booking.profile?.name} ({booking.profile?.email})
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <StatusBadge status={booking.booking_status} type="booking" />
                  <StatusBadge status={booking.payment_status} type="payment" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600">
                    Pickup: {new Date(booking.pickup_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600">
                    Delivery:{" "}
                    {new Date(booking.delivery_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 truncate">
                    {booking.address}
                  </span>
                </div>
              </div>

              {booking.booking_items && booking.booking_items.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-medium text-gray-900 text-xs mb-1">
                    Items:
                  </h4>
                  <div className="space-y-0.5">
                    {booking.booking_items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between text-xs text-gray-600"
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

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Total:</span> KES{" "}
                  {booking.total.toLocaleString()}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewDetails(booking)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => handleEditBooking(booking)}
                    className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-xs font-medium"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredBookings.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">
                {searchTerm
                  ? "No bookings found matching your search"
                  : filter === "all"
                  ? "No bookings found"
                  : `No ${filter} bookings found`}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pickup
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      {booking.order_number}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                      <div>
                        <div className="font-medium">
                          {booking.profile?.name}
                        </div>
                        <div className="text-gray-500">
                          {booking.profile?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                      {new Date(booking.pickup_date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                      {new Date(booking.delivery_date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      KES {booking.total.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex space-x-1">
                        <StatusBadge
                          status={booking.booking_status}
                          type="booking"
                        />
                        <StatusBadge
                          status={booking.payment_status}
                          type="payment"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(booking)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleEditBooking(booking)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">
                {searchTerm
                  ? "No bookings found matching your search"
                  : filter === "all"
                  ? "No bookings found"
                  : `No ${filter} bookings found`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        booking={selectedBooking}
        onUpdate={fetchBookings}
      />

      {/* Edit Booking Modal */}
      <EditBookingModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        booking={selectedBooking}
        onUpdate={fetchBookings}
      />
    </div>
  );
}
