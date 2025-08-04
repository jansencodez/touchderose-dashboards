"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Bell, Shield, Palette, Globe } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { Setting } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AdminSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [settings, setSettings] = useState({
    // General Settings
    siteName: "Touch De Rose",
    siteDescription: "Premium laundry service with a personal touch",
    contactEmail: "support@touchderose.com",
    contactPhone: "+1 (555) 123-4567",

    // Business Settings
    businessHours: {
      monday: { open: "08:00", close: "20:00", closed: false },
      tuesday: { open: "08:00", close: "20:00", closed: false },
      wednesday: { open: "08:00", close: "20:00", closed: false },
      thursday: { open: "08:00", close: "20:00", closed: false },
      friday: { open: "08:00", close: "20:00", closed: false },
      saturday: { open: "09:00", close: "18:00", closed: false },
      sunday: { open: "09:00", close: "18:00", closed: true },
    },

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,

    // Payment Settings
    acceptCash: true,
    acceptCard: true,
    acceptMobileMoney: true,

    // Service Settings
    minimumOrderAmount: 1000, // in cents
    deliveryFee: 500, // in cents
    freeDeliveryThreshold: 5000, // in cents
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("app_settings").select("*");

      if (error) {
        throw error;
      }

      // Convert settings array to object
      const settingsObj =
        data?.reduce((acc: any, setting: Setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {}) || {};

      // Map database settings to component state
      setSettings({
        siteName: settingsObj.site_name || settings.siteName,
        siteDescription:
          settingsObj.site_description || settings.siteDescription,
        contactEmail: settingsObj.contact_email || settings.contactEmail,
        contactPhone: settingsObj.contact_phone || settings.contactPhone,
        businessHours: settingsObj.business_hours || settings.businessHours,
        emailNotifications:
          settingsObj.email_notifications ?? settings.emailNotifications,
        smsNotifications:
          settingsObj.sms_notifications ?? settings.smsNotifications,
        pushNotifications:
          settingsObj.push_notifications ?? settings.pushNotifications,
        acceptCash: settingsObj.accept_cash ?? settings.acceptCash,
        acceptCard: settingsObj.accept_card ?? settings.acceptCard,
        acceptMobileMoney:
          settingsObj.accept_mobile_money ?? settings.acceptMobileMoney,
        minimumOrderAmount:
          typeof settingsObj.minimum_order_amount === "number"
            ? settingsObj.minimum_order_amount
            : settings.minimumOrderAmount,
        deliveryFee:
          typeof settingsObj.delivery_fee === "number"
            ? settingsObj.delivery_fee
            : settings.deliveryFee,
        freeDeliveryThreshold:
          typeof settingsObj.free_delivery_threshold === "number"
            ? settingsObj.free_delivery_threshold
            : settings.freeDeliveryThreshold,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    toast.loading("Saving settings...", { id: "settings" });

    try {
      // Prepare settings for database
      const settingsToUpdate = [
        { key: "site_name", value: settings.siteName },
        { key: "site_description", value: settings.siteDescription },
        { key: "contact_email", value: settings.contactEmail },
        { key: "contact_phone", value: settings.contactPhone },
        { key: "business_hours", value: settings.businessHours },
        { key: "email_notifications", value: settings.emailNotifications },
        { key: "sms_notifications", value: settings.smsNotifications },
        { key: "push_notifications", value: settings.pushNotifications },
        { key: "accept_cash", value: settings.acceptCash },
        { key: "accept_card", value: settings.acceptCard },
        { key: "accept_mobile_money", value: settings.acceptMobileMoney },
        { key: "minimum_order_amount", value: settings.minimumOrderAmount },
        { key: "delivery_fee", value: settings.deliveryFee },
        {
          key: "free_delivery_threshold",
          value: settings.freeDeliveryThreshold,
        },
      ];

      // Update each setting
      for (const setting of settingsToUpdate) {
        const { error } = await supabase.from("app_settings").upsert(
          {
            key: setting.key,
            value: setting.value,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "key",
          }
        );

        if (error) {
          throw error;
        }
      }

      toast.success("Settings saved successfully!", { id: "settings" });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings", { id: "settings" });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBusinessHours = (
    day: string,
    field: string,
    value: string | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day as keyof typeof prev.businessHours],
          [field]: value,
        },
      },
    }));
  };

  if (isFetching) {
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
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">
            Manage your application settings and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Globe className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              General Settings
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Description
              </label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) =>
                  setSettings({ ...settings, siteDescription: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) =>
                  setSettings({ ...settings, contactEmail: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={settings.contactPhone}
                onChange={(e) =>
                  setSettings({ ...settings, contactPhone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Bell className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email Notifications
                </label>
                <p className="text-xs text-gray-500">
                  Receive notifications via email
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emailNotifications: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  SMS Notifications
                </label>
                <p className="text-xs text-gray-500">
                  Receive notifications via SMS
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    smsNotifications: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Push Notifications
                </label>
                <p className="text-xs text-gray-500">
                  Receive browser push notifications
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pushNotifications: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Payment Methods
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Accept Cash
                </label>
                <p className="text-xs text-gray-500">Allow cash payments</p>
              </div>
              <input
                type="checkbox"
                checked={settings.acceptCash}
                onChange={(e) =>
                  setSettings({ ...settings, acceptCash: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Accept Cards
                </label>
                <p className="text-xs text-gray-500">
                  Allow credit/debit card payments
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.acceptCard}
                onChange={(e) =>
                  setSettings({ ...settings, acceptCard: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Accept Mobile Money
                </label>
                <p className="text-xs text-gray-500">
                  Allow mobile money payments
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.acceptMobileMoney}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    acceptMobileMoney: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Service Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Palette className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Service Settings
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Order Amount ($)
              </label>
              <input
                type="number"
                value={settings.minimumOrderAmount / 100}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minimumOrderAmount: parseInt(e.target.value) * 100,
                  })
                }
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Fee ($)
              </label>
              <input
                type="number"
                value={settings.deliveryFee / 100}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deliveryFee: parseInt(e.target.value) * 100,
                  })
                }
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Free Delivery Threshold ($)
              </label>
              <input
                type="number"
                value={settings.freeDeliveryThreshold / 100}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    freeDeliveryThreshold: parseInt(e.target.value) * 100,
                  })
                }
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Business Hours
        </h3>

        <div className="space-y-4">
          {Object.entries(settings.businessHours).map(([day, hours]) => (
            <div key={day} className="flex items-center space-x-4">
              <div className="w-24">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {day}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!hours.closed}
                  onChange={(e) =>
                    updateBusinessHours(day, "closed", !e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">Open</span>
              </div>

              {!hours.closed && (
                <>
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) =>
                      updateBusinessHours(day, "open", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) =>
                      updateBusinessHours(day, "close", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </>
              )}

              {hours.closed && (
                <span className="text-sm text-gray-500 italic">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
