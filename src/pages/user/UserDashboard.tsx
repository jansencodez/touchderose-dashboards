"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Calendar,
  Package,
  Star,
  CreditCard,
  DivideIcon as LucideIcon,
  Clock,
  MapPin,
  Eye,
} from "lucide-react";
import { BookingModal } from "../../components/modals/BookingModal";
import { TestimonialModal } from "../../components/modals/TestimonialModal";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

// StatCard Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: typeof LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "orange" | "red" | "teal";
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    red: "bg-red-50 text-red-600 border-red-200",
    teal: "bg-teal-50 text-teal-600 border-teal-200",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// StatusBadge Component
interface StatusBadgeProps {
  status: string;
  type?: "booking" | "payment" | "feedback";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = "booking",
}) => {
  const getStatusColor = (status: string, type: string) => {
    const statusMap: Record<string, Record<string, string>> = {
      booking: {
        pending: "bg-yellow-100 text-yellow-800",
        confirmed: "bg-blue-100 text-blue-800",
        in_progress: "bg-orange-100 text-orange-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
      },
      payment: {
        pending: "bg-yellow-100 text-yellow-800",
        completed: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800",
        refunded: "bg-gray-100 text-gray-800",
      },
      feedback: {
        new: "bg-blue-100 text-blue-800",
        in_review: "bg-yellow-100 text-yellow-800",
        resolved: "bg-green-100 text-green-800",
        closed: "bg-gray-100 text-gray-800",
      },
    };

    return statusMap[type]?.[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
        status,
        type
      )}`}
    >
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
};

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

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedOrders: 0,
    totalSpent: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get the current session to pass the auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      const response = await fetch(`/api/dashboard/user?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();

      console.log("Dashboard data:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch dashboard data");
      }

      if (result.success) {
        console.log("Dashboard data:", result);
        console.log(
          "Recent bookings count:",
          result.recentBookings?.length || 0
        );
        setStats(result.stats);
        setRecentBookings(result.recentBookings || []);
      } else {
        throw new Error(result.error || "Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
      setStats({
        activeBookings: 0,
        completedOrders: 0,
        totalSpent: 0,
      });
      setRecentBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <Image
                src="/assets/icon.png"
                alt="Touch De Rose"
                width={32}
                height={32}
                className="object-cover rounded"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-blue-100 mt-2">
                Here&apos;s an overview of your laundry services
              </p>
            </div>
          </div>
          <div className="bg-blue-500 bg-opacity-30 px-4 py-2 rounded-lg">
            <span className="font-medium">
              {user?.points || 0} Reward Points
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Bookings"
          value={stats.activeBookings}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Completed Orders"
          value={stats.completedOrders}
          icon={Star}
          color="green"
        />
        <StatCard
          title="Total Spent"
          value={`KES ${stats.totalSpent.toLocaleString()}`}
          icon={CreditCard}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setShowBookingModal(true)}
          className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg flex items-center justify-center space-x-3 shadow-md hover:shadow-lg"
        >
          <Calendar className="w-6 h-6" />
          <span>New Booking</span>
        </button>

        <button
          onClick={() => setShowTestimonialModal(true)}
          className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg flex items-center justify-center space-x-3 shadow-md hover:shadow-lg"
        >
          <Star className="w-6 h-6" />
          <span>Leave Review</span>
        </button>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Recent Bookings</h2>
          <button
            onClick={() => (window.location.href = "/dashboard/bookings")}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
          >
            <span>View All</span>
            <Eye className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.order_number}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Created on{" "}
                            {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Pickup:{" "}
                            {new Date(booking.pickup_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Delivery:{" "}
                            {new Date(
                              booking.delivery_date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 truncate">
                            {booking.address}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-3">
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">
                          KES {booking.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <StatusBadge
                          status={booking.booking_status}
                          type="booking"
                        />
                        <StatusBadge
                          status={booking.payment_status}
                          type="payment"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No recent bookings
              </h3>
              <p className="text-gray-600 mb-6">
                {stats.activeBookings > 0 || stats.completedOrders > 0
                  ? "Your recent bookings will appear here. Check all bookings for more details."
                  : "Start your laundry journey with your first booking"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  New Booking
                </button>
                {(stats.activeBookings > 0 || stats.completedOrders > 0) && (
                  <button
                    onClick={() =>
                      (window.location.href = "/dashboard/bookings")
                    }
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    View All Bookings
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSuccess={() => {
          setShowBookingModal(false);
          fetchDashboardData(); // Refresh data
        }}
      />

      <TestimonialModal
        isOpen={showTestimonialModal}
        onClose={() => setShowTestimonialModal(false)}
      />
    </div>
  );
};
