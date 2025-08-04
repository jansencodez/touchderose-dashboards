"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  MapPin,
  Package,
  Clock,
  User,
  Plus,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../../../lib/supabase";
import { Booking } from "../../../types";
import { LoadingSpinner } from "../../ui/LoadingSpinner";

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onUpdate?: () => void;
}

interface BookingItem {
  name: string;
  quantity: number;
  price: number;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  onUpdate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    pickup_date: "",
    delivery_date: "",
    time_slot: "",
    address: "",
    special_instructions: "",
    items: [] as BookingItem[],
  });

  useEffect(() => {
    if (booking) {
      setFormData({
        pickup_date: new Date(booking.pickup_date).toISOString().slice(0, 16),
        delivery_date: new Date(booking.delivery_date)
          .toISOString()
          .slice(0, 16),
        time_slot: booking.time_slot || "",
        address: booking.address || "",
        special_instructions: booking.special_instructions || "",
        items:
          booking.booking_items?.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })) || [],
      });
    }
  }, [booking]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", quantity: 1, price: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce(
      (total, item) => total + item.quantity * item.price,
      0
    );
  };

  const handleSubmit = async () => {
    if (!booking) return;

    setIsLoading(true);
    toast.loading("Updating booking...", { id: "booking-edit" });

    try {
      // Update booking details
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          pickup_date: new Date(formData.pickup_date).toISOString(),
          delivery_date: new Date(formData.delivery_date).toISOString(),
          time_slot: formData.time_slot,
          address: formData.address,
          special_instructions: formData.special_instructions,
          total: calculateTotal(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (bookingError) throw bookingError;

      // Delete existing booking items
      const { error: deleteError } = await supabase
        .from("booking_items")
        .delete()
        .eq("booking_id", booking.id);

      if (deleteError) throw deleteError;

      // Insert new booking items
      if (formData.items.length > 0) {
        const itemsToInsert = formData.items.map((item) => ({
          booking_id: booking.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        }));

        const { error: itemsError } = await supabase
          .from("booking_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast.success("Booking updated successfully!", { id: "booking-edit" });
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking", { id: "booking-edit" });
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
            Edit Booking - {booking.order_number}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info (Read-only) */}
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

          {/* Schedule */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.pickup_date}
                  onChange={(e) =>
                    handleInputChange("pickup_date", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.delivery_date}
                  onChange={(e) =>
                    handleInputChange("delivery_date", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Slot
              </label>
              <input
                type="text"
                value={formData.time_slot}
                onChange={(e) => handleInputChange("time_slot", e.target.value)}
                placeholder="e.g., Morning, Afternoon, Evening"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Address
            </h3>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter pickup/delivery address"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Items
              </h3>
              <button
                onClick={addItem}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleItemChange(index, "name", e.target.value)
                      }
                      placeholder="Item name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "price",
                          parseInt(e.target.value) || 0
                        )
                      }
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.items.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No items added. Click &quot;Add Item&quot; to add laundry
                  items.
                </p>
              )}
              {formData.items.length > 0 && (
                <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border-t border-blue-200">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-blue-600">
                    KES {calculateTotal().toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">
              Special Instructions
            </h3>
            <textarea
              value={formData.special_instructions}
              onChange={(e) =>
                handleInputChange("special_instructions", e.target.value)
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any special instructions for this booking..."
            />
          </div>
        </div>

        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Update Booking
          </button>
        </div>
      </div>
    </div>
  );
};
