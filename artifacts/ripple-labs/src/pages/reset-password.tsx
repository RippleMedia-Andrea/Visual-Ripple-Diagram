import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { authClient } from "@/lib/auth-client";
import { PublicPageLayout } from "@/components/PublicPageLayout";

export default function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!token) {
      setError("This password reset link is missing or invalid.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    const result = await authClient.resetPassword({ newPassword: password, token });
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error.message || "This password reset link is no longer valid.");
      return;
    }
    setMessage("Your password has been updated. You can sign in on the website or the app.");
  }

  return (
    <PublicPageLayout eyebrow="Purpose Lab" title="Choose a new password">
      {message ? (
        <div className="rounded-2xl bg-white/60 border border-[#2F7F7B]/20 p-6">
          <p>{message}</p>
          <Link href="/sign-in" className="inline-block mt-5 rounded-full bg-[#0F2A36] text-[#F5F1E8] px-6 py-3 text-sm">Sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="max-w-md rounded-2xl bg-white/60 border border-[#2F7F7B]/20 p-6 md:p-8 space-y-5">
          <label className="block text-sm"><span className="block mb-2 font-medium">New password</span><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[#2F7F7B]/20 bg-[#F5F1E8]/70 px-4 py-3 outline-none focus:border-[#C8A96A]" /></label>
          <label className="block text-sm"><span className="block mb-2 font-medium">Confirm new password</span><input required minLength={8} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-xl border border-[#2F7F7B]/20 bg-[#F5F1E8]/70 px-4 py-3 outline-none focus:border-[#C8A96A]" /></label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-[#0F2A36] text-[#F5F1E8] py-3 text-sm font-medium disabled:opacity-50">{isSubmitting ? "Please wait…" : "Update password"}</button>
        </form>
      )}
    </PublicPageLayout>
  );
}