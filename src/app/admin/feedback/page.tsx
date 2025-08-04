"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Search, Eye, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { Feedback } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setFeedbacks(data || []);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFeedbackStatus = async (
    feedbackId: string,
    newStatus: string
  ) => {
    toast.loading("Updating feedback status...", { id: "feedback-update" });
    try {
      const { error } = await supabase
        .from("feedbacks")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", feedbackId);

      if (error) {
        throw error;
      }

      toast.success("Feedback status updated successfully!", {
        id: "feedback-update",
      });
      // Refresh feedbacks list
      fetchFeedbacks();
      if (selectedFeedback && selectedFeedback.id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, status: newStatus as any });
      }
    } catch (error) {
      console.error("Error updating feedback status:", error);
      toast.error("Failed to update feedback status", {
        id: "feedback-update",
      });
    }
  };

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const matchesSearch =
      feedback.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || feedback.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Feedback
          </h1>
          <p className="text-gray-600">
            Manage customer inquiries and feedback
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Feedback
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {feedbacks.length}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New</p>
              <p className="text-2xl font-bold text-orange-600">
                {feedbacks.filter((f) => f.status === "new").length}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Review</p>
              <p className="text-2xl font-bold text-yellow-600">
                {feedbacks.filter((f) => f.status === "in_review").length}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {feedbacks.filter((f) => f.status === "resolved").length}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="in_review">In Review</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Feedback Messages
              </h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredFeedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedFeedback?.id === feedback.id
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : ""
                  }`}
                  onClick={() => setSelectedFeedback(feedback)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {feedback.name}
                      </h4>
                      <p className="text-sm text-gray-500">{feedback.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={feedback.status} type="feedback" />
                      <span className="text-xs text-gray-500">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {feedback.message}
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    Preferred contact: {feedback.preferred_contact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback Details */}
        <div className="lg:col-span-1">
          {selectedFeedback ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Feedback Details
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedFeedback.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedFeedback.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Contact
                  </label>
                  <p className="text-sm text-gray-900 capitalize">
                    {selectedFeedback.preferred_contact}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <StatusBadge
                    status={selectedFeedback.status}
                    type="feedback"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedFeedback.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedFeedback.message}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() =>
                      updateFeedbackStatus(selectedFeedback.id, "in_review")
                    }
                    className="flex-1 bg-yellow-600 text-white py-2 px-3 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                  >
                    Mark In Review
                  </button>
                  <button
                    onClick={() =>
                      updateFeedbackStatus(selectedFeedback.id, "resolved")
                    }
                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Resolve
                  </button>
                </div>

                <button
                  onClick={() =>
                    updateFeedbackStatus(selectedFeedback.id, "closed")
                  }
                  className="w-full bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center justify-center"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a feedback message to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredFeedbacks.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No feedback found
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? `No feedback matches "${searchTerm}"`
              : "No customer feedback has been received yet."}
          </p>
        </div>
      )}
    </div>
  );
}
