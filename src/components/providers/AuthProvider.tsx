"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  preferred_ai: string;
  settings: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, currentUser?: User | null) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile(data as UserProfile);
      } else {
        // If profile doesn't exist in Supabase yet, create it automatically
        const activeUser = currentUser || user;
        const displayName =
          activeUser?.user_metadata?.full_name ||
          activeUser?.user_metadata?.name ||
          activeUser?.email?.split("@")[0] ||
          "Learner";
        const avatarUrl =
          activeUser?.user_metadata?.avatar_url ||
          activeUser?.user_metadata?.picture ||
          null;

        const newProfile = {
          id: userId,
          display_name: displayName,
          avatar_url: avatarUrl,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
          preferred_ai: "chatgpt",
          settings: { onboarded: true },
          updated_at: new Date().toISOString(),
        };

        const { data: inserted } = await supabase
          .from("profiles")
          .upsert(newProfile, { onConflict: "id" })
          .select()
          .maybeSingle();

        if (inserted) {
          setProfile(inserted as UserProfile);
        } else {
          setProfile(newProfile as UserProfile);
        }
      }
    } catch (e) {
      console.warn("Could not fetch or create profile:", e);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Check active session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchProfile(data.user.id, data.user);
      }
      setLoading(false);
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    toast.success("Signed out successfully.");
    router.refresh();
    router.push("/login");
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
