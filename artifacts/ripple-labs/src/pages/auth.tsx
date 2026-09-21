import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import rippleLabsLogo from "@assets/2876A1D3-1596-40F7-9384-F5AAA5F311E8_1777042604510.png";
import { authClient } from "@/lib/auth-client";
import { getGetPasswordResetAvailabilityQueryKey, useGetPasswordResetAvailability, useRecordAiConsent } from "@workspace/api-client-react";

function safeReturnTo() {
  const value = new URLSearchParams(window.location.search).get("returnTo");
  return value?.startsWith("/") ? value : "/ripple-journey";
}

export default function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [, navigate] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const isSignUp = mode === "sign-up";
  const { data: resetAvailability } = useGetPasswordResetAvailability({
    query: { enabled: !isSignUp, queryKey: getGetPasswordResetAvailabilityQueryKey() },
  });
  const recordConsent = useRecordAiConsent();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResetMessage("");
    if (isSignUp && !aiConsent) {
      setError("Please confirm your AI processing consent to continue.");
      return;
    }
    setIsSubmitting(true);

    const result = isSignUp
      ? await authClient.signUp.email({
          name: firstName.trim(),
          email: email.trim(),
          password,
        })
      : await authClient.signIn.email({
          email: email.trim(),
          password,
        });

    setIsSubmitting(false);
    if (result.error) {
      setError(result.error.message || "We couldn't complete that request.");
      return;
    }
    if (isSignUp) {
      await recordConsent.mutateAsync();
    }
    navigate(safeReturnTo(), { replace: true });
  }

  async function requestReset() {
    setError("");
    setResetMessage("");
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setIsSubmitting(true);
    await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: new URL("reset-password", `${window.location.origin}${import.meta.env.BASE_URL}`).toString(),
    }).catch(() => undefined);
    setIsSubmitting(false);
    setResetMessage("If an account exists for that email, you'll receive a password reset link shortly.");
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] text-[#0F2A36] flex flex-col">
      <nav className="px-6 md:px-10 py-5">
        <Link href="/">
          <img src={rippleLabsLogo} alt="Ripple Labs" className="h-9 w-auto rounded-md" />
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <p className="text-[#2F7F7B] text-xs uppercase tracking-[0.24em] font-sans mb-3">
              Purpose Lab
            </p>
            <h1 className="font-serif text-4xl mb-3">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="font-sans text-sm text-[#0F2A36]/65">
              {isSignUp
                ? "Save your reflections and return to your journey anytime."
                : "Sign in to continue your Purpose Lab journey."}
            </p>
          </div>

          <form
            onSubmit={submit}
            className="rounded-2xl bg-white/55 border border-[#2F7F7B]/15 shadow-sm p-6 md:p-8 space-y-5"
          >
            {isSignUp && (
              <label className="block font-sans text-sm">
                <span className="block mb-2 font-medium">First name</span>
                <input
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="w-full rounded-xl border border-[#2F7F7B]/20 bg-[#F5F1E8]/70 px-4 py-3 outline-none focus:border-[#C8A96A]"
                />
              </label>
            )}
            <label className="block font-sans text-sm">
              <span className="block mb-2 font-medium">Email</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[#2F7F7B]/20 bg-[#F5F1E8]/70 px-4 py-3 outline-none focus:border-[#C8A96A]"
              />
            </label>
            <label className="block font-sans text-sm">
              <span className="block mb-2 font-medium">Password</span>
              <input
                required
                minLength={8}
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[#2F7F7B]/20 bg-[#F5F1E8]/70 px-4 py-3 outline-none focus:border-[#C8A96A]"
              />
            </label>
            {isSignUp && (
              <div className="space-y-3 text-sm leading-relaxed">
                <label className="flex items-start gap-3">
                  <input type="checkbox" required checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[#2F7F7B]" />
                  <span>I understand my answers are processed by a third-party AI service (Anthropic's Claude) to guide my Purpose Lab journey, as described in the <Link href="/privacy" className="text-[#2F7F7B] underline">Privacy Policy</Link>.</span>
                </label>
                <p>By creating an account you agree to the <Link href="/terms" className="text-[#2F7F7B] underline">Terms of Use</Link>.</p>
              </div>
            )}
            {!isSignUp && resetAvailability?.available && (
              <button type="button" onClick={requestReset} className="text-left text-sm text-[#2F7F7B] underline underline-offset-4">
                Forgot password?
              </button>
            )}
            {resetMessage && <p role="status" className="font-sans text-sm text-[#2F7F7B]">{resetMessage}</p>}
            {error && (
              <p role="alert" className="font-sans text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#0F2A36] text-[#F5F1E8] py-3 font-sans text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting
                ? "Please wait…"
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-6 font-sans text-sm text-[#0F2A36]/65">
            {isSignUp ? "Already have an account?" : "New to Ripple Labs?"}{" "}
            <Link
              href={`${isSignUp ? "/sign-in" : "/create-account"}?returnTo=${encodeURIComponent(safeReturnTo())}`}
              className="text-[#2F7F7B] font-medium underline underline-offset-4"
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}