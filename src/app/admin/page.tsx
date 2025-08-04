"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Calendar,
  Users,
  CreditCard,
  MessageSquare,
  TrendingUp,
  Package,
  DivideIcon as LucideIcon,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";

// StatCard Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: typeof LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "orange" | "red" | "teal" | "purple";
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
  subtitle,
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    red: "bg-red-50 text-red-600 border-red-200",
    teal: "bg-teal-50 text-teal-600 border-teal-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
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

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeUsers: 0,
    revenue: 0,
    pendingOrders: 0,
    feedback: 0,
    growthRate: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/admin");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch dashboard data");
      }

      if (result.success) {
        setStats(result.stats);
        setRecentBookings(result.recentBookings || []);
        setRecentPayments(result.recentPayments || []);
      } else {
        throw new Error(result.error || "Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
      setStats({
        totalBookings: 0,
        activeUsers: 0,
        revenue: 0,
        pendingOrders: 0,
        feedback: 0,
        growthRate: 0,
      });
      setRecentBookings([]);
      setRecentPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-sm text-gray-600">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 mb-3 text-sm">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Image
                src="/assets/icon.png"
                alt="Touch De Rose"
                width={32}
                height={32}
                className="object-cover rounded"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-blue-100 mt-1 text-sm">
                Overview of your laundry business
              </p>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold text-sm">
                {stats.growthRate}% Growth
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={Calendar}
          color="blue"
          subtitle="All time bookings"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={Users}
          color="green"
          subtitle="Registered customers"
        />
        <StatCard
          title="Revenue"
          value={`KES ${stats.revenue.toLocaleString()}`}
          icon={CreditCard}
          color="purple"
          subtitle="Total earnings"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={Package}
          color="orange"
          subtitle="Awaiting processing"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button
            onClick={() => (window.location.href = "/admin/bookings")}
            className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-700 text-sm">
              Manage Bookings
            </span>
          </button>
          <button
            onClick={() => (window.location.href = "/admin/payments")}
            className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors"
          >
            <CreditCard className="w-4 h-4 text-green-600" />
            <span className="font-medium text-gray-700 text-sm">
              View Payments
            </span>
          </button>
          <button
            onClick={() => (window.location.href = "/admin/users")}
            className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors"
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-gray-700 text-sm">
              Manage Users
            </span>
          </button>
          <button
            onClick={() => (window.location.href = "/admin/feedback")}
            className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-orange-600" />
            <span className="font-medium text-gray-700 text-sm">
              View Feedback
            </span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Recent Bookings
                </h2>
                <p className="text-xs text-gray-600">
                  {recentBookings.length} recent orders
                </p>
              </div>
            </div>
            <button
              onClick={() => (window.location.href = "/admin/bookings")}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            >
              View All
            </button>
          </div>

          <div className="p-4">
            {recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">
                            {booking.order_number || "Unknown"}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {booking.profiles?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(booking.pickup_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-gray-900">
                        KES {(booking.total || 0).toLocaleString()}
                      </span>
                      <StatusBadge
                        status={booking.booking_status}
                        type="booking"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium text-sm">
                  No recent bookings
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  New bookings will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <CreditCard className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Recent Payments
                </h2>
                <p className="text-xs text-gray-600">
                  {recentPayments.length} recent payments
                </p>
              </div>
            </div>
            <button
              onClick={() => (window.location.href = "/admin/payments")}
              className="text-green-600 hover:text-green-700 text-xs font-medium hover:bg-green-50 px-2 py-1 rounded transition-colors"
            >
              View All
            </button>
          </div>

          <div className="p-4">
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">
                            {payment.bookings?.order_number || "Unknown"}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {payment.profiles?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-gray-900">
                        KES {(payment.amount || 0).toLocaleString()}
                      </span>
                      <StatusBadge
                        status={payment.payment_status}
                        type="payment"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium text-sm">
                  No recent payments
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Payment records will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Feedback</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.feedback}
              </p>
              <p className="text-xs text-gray-500 mt-1">Customer reviews</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">
                Growth Rate
              </p>
              <p className="text-xl font-bold text-green-600">
                {stats.growthRate}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Monthly growth</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">
                Avg. Order Value
              </p>
              <p className="text-xl font-bold text-gray-900">
                KES{" "}
                {stats.totalBookings > 0
                  ? Math.round(
                      stats.revenue / stats.totalBookings
                    ).toLocaleString()
                  : "0"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per booking</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
