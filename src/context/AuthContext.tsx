/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { Profile } from "@/types";

interface AuthContextType {
  user: Profile | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    name: string,
    phone: string
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for user profiles to avoid repeated database calls
  const profileCache = new Map<string, Profile>();

  const fetchUserProfile = async (
    authUserId: string
  ): Promise<Profile | null> => {
    // Check cache first
    if (profileCache.has(authUserId)) {
      return profileCache.get(authUserId) || null;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", authUserId)
        .single();

      if (error || !data) {
        return null;
      }

      const profile = data as Profile;
      // Cache the profile
      profileCache.set(authUserId, profile);
      return profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const setAuthFromUser = async (authUser: SupabaseUser) => {
    if (!authUser) {
      setUser(null);
      setSupabaseUser(null);
      setIsAuthenticated(false);
      setError(null);
      return;
    }

    // Set supabase user immediately for faster response
    setSupabaseUser(authUser);
    setIsAuthenticated(true);

    // Fetch profile in background
    const profile = await fetchUserProfile(authUser.id);

    if (!profile) {
      // Don't sign out immediately, just set error
      setUser(null);
      setError("Profile not found. Please contact support.");
      return;
    }

    setUser(profile);
    setError(null);
  };

  const initializeAuth = async () => {
    try {
      // Get current user using Supabase SSR
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !authUser) {
        setUser(null);
        setSupabaseUser(null);
        setIsAuthenticated(false);
        setError(null);
        return;
      }

      // Set basic auth state immediately
      setSupabaseUser(authUser);
      setIsAuthenticated(true);

      // Fetch profile in background
      const profile = await fetchUserProfile(authUser.id);
      if (profile) {
        setUser(profile);
        setError(null);
      } else {
        setError("Profile not found. Please contact support.");
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      setError("Failed to initialize authentication");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        const errorMessage = error?.message || "Login failed";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = "An unexpected error occurred";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    phone: string
  ) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            phone: phone,
          },
        },
      });

      if (error || !data.user) {
        const errorMessage = error?.message || "Signup failed";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = "An unexpected error occurred during signup";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        const errorMessage = error.message || "Google sign-in failed";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = "An unexpected error occurred during Google sign-in";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
      setIsAuthenticated(false);
      setError(null);
      // Clear cache on logout
      profileCache.clear();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Error logging out");
    }
  };

  useEffect(() => {
    // Initialize auth immediately
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === "SIGNED_IN" && session?.user) {
        await setAuthFromUser(session.user);
        toast.success("Welcome back!");
        setIsLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSupabaseUser(null);
        setIsAuthenticated(false);
        setError(null);
        // Clear cache on sign out
        profileCache.clear();
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "staff";

  const value = {
    user,
    supabaseUser,
    isLoading,
    isAuthenticated,
    error,
    login,
    signup,
    signInWithGoogle,
    logout,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
