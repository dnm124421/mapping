"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Route, Sparkles, ArrowRight, Check } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { insertSampleData } from "@/lib/data/sample-seed";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Dhruv");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [preferredAi, setPreferredAi] = useState<"chatgpt" | "claude" | "gemini" | "other">("chatgpt");
  const [loadSample, setLoadSample] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Detect system timezone
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setTimezone(detected);
    } catch {}

    // Check auth user if Supabase is active
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUser(data.user);
          const metaName =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split("@")[0];
          if (metaName) setName(metaName);
        }
      });
    }
  }, []);

  const handleFinish = async () => {
    setLoading(true);

    if (isSupabaseConfigured() && user) {
      const supabase = createClient();
      try {
        // 1. Update Profile
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            display_name: name,
            timezone,
            preferred_ai: preferredAi,
            settings: {
              onboarded: true,
              sample_loaded: loadSample,
              tone: "hinglish",
              buffer_enabled: true,
              buffer_count: 3,
            },
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.warn("Profile update error:", profileError);
        }

        // 2. Load Sample Data if requested
        if (loadSample) {
          await insertSampleData(supabase, user.id);
        }

        toast.success("Welcome aboard! Let's get started.");
        router.refresh();
        router.push("/");
        return;
      } catch (err: any) {
        toast.error(err.message || "Could not complete setup. Redirecting...");
      } finally {
        setLoading(false);
      }
    }

    // Fallback for preview mode
    toast.success("Welcome aboard! Entering Dashboard...");
    router.refresh();
    router.push("/");
  };

  const handleSkip = async () => {
    if (isSupabaseConfigured() && user) {
      const supabase = createClient();
      await supabase.from("profiles").upsert({
        id: user.id,
        settings: { onboarded: true },
      });
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between p-4 sm:p-6 lg:p-12">
      <div className="flex items-center justify-between w-full max-w-xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <Route className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-ink">
            {APP_NAME}
          </span>
        </div>
        <button
          onClick={handleSkip}
          className="text-xs text-mute hover:text-ink transition-colors"
        >
          Skip for now
        </button>
      </div>

      <div className="w-full max-w-xl mx-auto my-8">
        <div className="rounded-lg bg-surface border border-line p-6 sm:p-8 shadow-card space-y-6">
          {/* Stepper Header */}
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <span className="text-xs font-semibold text-primary">Step {step} of 3</span>
              <h2 className="text-lg font-bold text-ink tracking-tight">
                {step === 1 && "What should we call you?"}
                {step === 2 && "Timezone & Preferred AI"}
                {step === 3 && "Start with sample data?"}
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    s === step ? "bg-primary" : s < step ? "bg-success" : "bg-line"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <p className="text-ink2">
                We'll personalize your daily study greeting and weekly milestones with this name.
              </p>
              <div>
                <label className="block text-ink font-medium mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-ink font-medium mb-1">Your Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (India Standard Time)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </select>
                <span className="text-[11px] text-mute mt-1 block">
                  All streak boundaries and daily targets are calculated accurately in your local timezone.
                </span>
              </div>

              <div>
                <label className="block text-ink font-medium mb-1">Preferred AI tool</label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(["chatgpt", "claude", "gemini"] as const).map((ai) => (
                    <button
                      key={ai}
                      type="button"
                      onClick={() => setPreferredAi(ai)}
                      className={`p-2.5 rounded-md border text-center font-medium capitalize transition-colors ${
                        preferredAi === ai
                          ? "border-primary bg-primary-tint/30 text-primary font-semibold"
                          : "border-line bg-bg text-ink"
                      }`}
                    >
                      {ai}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <p className="text-ink2">
                Would you like to start with preloaded sample data (DSA in C++ roadmap & 30-day sprint) so the app isn't empty?
              </p>
              <div className="space-y-2">
                <label
                  onClick={() => setLoadSample(true)}
                  className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    loadSample ? "border-primary bg-primary-tint/20" : "border-line bg-bg"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${loadSample ? "border-primary bg-primary text-white" : "border-mute"}`}>
                    {loadSample && <Check className="w-3 h-3" />}
                  </div>
                  <div>
                    <span className="font-semibold text-ink block">Load Sample Data (Recommended)</span>
                    <span className="text-mute text-[11px]">Explore with a real 4-stage DSA roadmap. Delete anytime in 1 click from Settings.</span>
                  </div>
                </label>

                <label
                  onClick={() => setLoadSample(false)}
                  className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    !loadSample ? "border-primary bg-primary-tint/20" : "border-line bg-bg"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${!loadSample ? "border-primary bg-primary text-white" : "border-mute"}`}>
                    {!loadSample && <Check className="w-3 h-3" />}
                  </div>
                  <div>
                    <span className="font-semibold text-ink block">Start completely empty</span>
                    <span className="text-mute text-[11px]">You will create your first roadmap from scratch using the AI wizard.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-line">
            {step > 1 ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep(step - 1)}
                className="px-3.5 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium transition-colors"
              >
                Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <span>{loading ? "Setting up..." : "Enter Dashboard"}</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-xl mx-auto text-center text-xs text-mute">
        <span>Roadmap Planner • Master any skill</span>
      </div>
    </div>
  );
}
