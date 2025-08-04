import { supabase } from "./supabase/client";
import { Setting } from "../types";

/**
 * Settings utility functions for managing application configuration
 */

export class SettingsManager {
  private static cache: Map<string, any> = new Map();
  private static cacheExpiry: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get a setting value by key
   */
  static async getSetting(key: string, defaultValue?: any): Promise<any> {
    try {
      // Check cache first
      if (this.isCacheValid() && this.cache.has(key)) {
        return this.cache.get(key);
      }

      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", key)
        .single();

      if (error) {
        console.warn(
          `Setting '${key}' not found, using default:`,
          defaultValue
        );
        return defaultValue;
      }

      let value = data.value;

      // Parse JSON strings
      if (
        typeof value === "string" &&
        (value.startsWith("{") ||
          value.startsWith("[") ||
          value.startsWith('"'))
      ) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }

      // Cache the value
      this.cache.set(key, value);
      this.updateCacheExpiry();

      return value;
    } catch (error) {
      console.error(`Error fetching setting '${key}':`, error);
      return defaultValue;
    }
  }

  /**
   * Get multiple settings by category
   */
  static async getSettingsByCategory(
    category: string
  ): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .eq("category", category);

      if (error) {
        throw error;
      }

      const settings: Record<string, any> = {};
      data?.forEach((setting: any) => {
        let value = setting.value;

        // Parse JSON strings
        if (
          typeof value === "string" &&
          (value.startsWith("{") ||
            value.startsWith("[") ||
            value.startsWith('"'))
        ) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }

        settings[setting.key] = value;
        this.cache.set(setting.key, value);
      });

      this.updateCacheExpiry();
      return settings;
    } catch (error) {
      console.error(
        `Error fetching settings for category '${category}':`,
        error
      );
      return {};
    }
  }

  /**
   * Get all public settings (for client-side use)
   */
  static async getPublicSettings(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .eq("is_public", true);

      if (error) {
        throw error;
      }

      const settings: Record<string, any> = {};
      data?.forEach((setting: any) => {
        let value = setting.value;

        // Parse JSON strings
        if (
          typeof value === "string" &&
          (value.startsWith("{") ||
            value.startsWith("[") ||
            value.startsWith('"'))
        ) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }

        settings[setting.key] = value;
        this.cache.set(setting.key, value);
      });

      this.updateCacheExpiry();
      return settings;
    } catch (error) {
      console.error("Error fetching public settings:", error);
      return {};
    }
  }

  /**
   * Update a setting value
   */
  static async updateSetting(
    key: string,
    value: any,
    category: string = "general"
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from("settings").upsert(
        {
          key,
          value: JSON.stringify(value),
          category,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "key",
        }
      );

      if (error) {
        throw error;
      }

      // Update cache
      this.cache.set(key, value);
      return true;
    } catch (error) {
      console.error(`Error updating setting '${key}':`, error);
      return false;
    }
  }

  /**
   * Clear the settings cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry = 0;
  }

  /**
   * Check if cache is still valid
   */
  private static isCacheValid(): boolean {
    return Date.now() < this.cacheExpiry;
  }

  /**
   * Update cache expiry time
   */
  private static updateCacheExpiry(): void {
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
  }
}

// Convenience functions
export const getSetting = SettingsManager.getSetting.bind(SettingsManager);
export const getSettingsByCategory =
  SettingsManager.getSettingsByCategory.bind(SettingsManager);
export const getPublicSettings =
  SettingsManager.getPublicSettings.bind(SettingsManager);
export const updateSetting =
  SettingsManager.updateSetting.bind(SettingsManager);
export const clearSettingsCache =
  SettingsManager.clearCache.bind(SettingsManager);
