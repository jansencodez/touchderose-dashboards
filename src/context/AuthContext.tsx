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

  const fetchUserProfile = async (
    authUserId: string
  ): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", authUserId)
        .single();

      if (error || !data) return null;
      return data as Profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    phone: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      console.log("AuthContext: Getting current user...");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log(
        "AuthContext: getUser result:",
        user ? "User found" : "No user"
      );

      if (user) {
        console.log("AuthContext: Setting supabase user:", user.id);
        setSupabaseUser(user);
        console.log("AuthContext: Fetching profile for user:", user.id);
        const profile = await fetchUserProfile(user.id);
        console.log(
          "AuthContext: Profile result:",
          profile ? "Profile found" : "No profile"
        );
        setUser(profile);
      } else {
        console.log("AuthContext: No user found, setting null states");
      }

      console.log("AuthContext: Setting loading to false");
      setIsLoading(false);
    };

    getUser();
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "staff";

  const value = {
    user,
    supabaseUser,
    isLoading,
    isAuthenticated: !!supabaseUser,
    error: null,
    login,
    signup,
    signInWithGoogle,
    logout,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
