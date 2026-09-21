import { useState, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { authClient } from "@/lib/auth-client";
import { getGetAccountQueryKey, useGetAccount, useRecordAiConsent, useRecordWelcomeSeen } from "@workspace/api-client-react";

export function ProtectedJourney({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const { data: account, isLoading: isAccountLoading } = useGetAccount({
    query: { enabled: Boolean(session), queryKey: getGetAccountQueryKey() },
  });
  const recordConsent = useRecordAiConsent();
  const recordWelcome = useRecordWelcomeSeen();
  const [consentChecked, setConsentChecked] = useState(false);
  const [welcomeStarted, setWelcomeStarted] = useState(false);
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isPending && !session) {
      navigate("/sign-in?returnTo=%2Fripple-journey", { replace: true });
    }
  }, [isPending, session, navigate]);

  if (isPending || !session || isAccountLoading || !account) {
    return (
      <div className="min-h-screen bg-[#0F2A36] text-[#D7ECEB] flex items-center justify-center font-sans">
        Preparing your journey…
      </div>
    );
  }

  if (!account.aiConsentAt) {
    return (
      <main className="min-h-screen bg-[#F5F1E8] text-[#0F2A36] flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-lg rounded-2xl bg-white/65 border border-[#2F7F7B]/15 shadow-sm p-7 md:p-10">
          <p className="text-[#2F7F7B] text-xs uppercase tracking-[0.24em] font-sans mb-3">Before you begin</p>
          <h1 className="font-serif text-3xl mb-4">A note about your journey</h1>
          <label className="mb-4 flex items-start gap-3 font-sans text-sm leading-relaxed">
            <input type="checkbox" checked={consentChecked} onChange={(event) => setConsentChecked(event.target.checked)} className="mt-1 h-4 w-4 accent-[#2F7F7B]" />
            <span>I understand my answers are processed by a third-party AI service (Anthropic&apos;s Claude) to guide my Purpose Lab journey, as described in the <a href="/privacy" className="text-[#2F7F7B] underline">Privacy Policy</a>.</span>
          </label>
          <p className="mb-6 font-sans text-sm">By continuing you agree to the <a href="/terms" className="text-[#2F7F7B] underline">Terms of Use</a>.</p>
          <button
            type="button"
            disabled={!consentChecked || recordConsent.isPending}
            onClick={() => recordConsent.mutateAsync().then((result) => {
              queryClient.setQueryData(getGetAccountQueryKey(), { ...account, aiConsentAt: result.aiConsentAt });
            })}
            className="w-full rounded-full bg-[#0F2A36] text-[#F5F1E8] py-3 font-sans text-sm font-medium disabled:opacity-50"
          >
            {recordConsent.isPending ? "Please wait…" : "I understand — continue"}
          </button>
        </div>
      </main>
    );
  }

  if (!account.welcomeSeenAt && !welcomeStarted) {
    return (
      <main className="min-h-screen bg-[#F5F1E8] text-[#0F2A36] flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-lg rounded-2xl bg-white/65 border border-[#2F7F7B]/15 shadow-sm p-7 md:p-10">
          <p className="text-[#2F7F7B] text-xs uppercase tracking-[0.24em] font-sans mb-3">Purpose Lab</p>
          <h1 className="font-serif text-3xl mb-5">Welcome to the Purpose Lab</h1>
          <div className="space-y-4 font-sans text-sm leading-relaxed text-[#0F2A36]/75">
            <p>Over six short stages, you&apos;ll share a few stories from your life, notice the patterns in them, and put words to your purpose.</p>
            <p>Go at your own pace. Your progress saves automatically, so you can pause anytime and pick up on any device.</p>
            <p>Your journey is private to you. Take what you discover into prayer and share it with people you trust.</p>
          </div>
          <p className="mt-6 text-xs text-[#0F2A36]/55">Most people finish in 45 to 90 minutes, across one or more sittings.</p>
          <button type="button" disabled={recordWelcome.isPending} onClick={() => recordWelcome.mutateAsync().then(() => setWelcomeStarted(true))} className="mt-7 w-full rounded-full bg-[#0F2A36] text-[#F5F1E8] py-3 font-sans text-sm font-medium disabled:opacity-50">{recordWelcome.isPending ? "Please wait…" : "Begin"}</button>
        </div>
      </main>
    );
  }

  return children;
}