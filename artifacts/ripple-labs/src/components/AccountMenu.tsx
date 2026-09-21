import { useState } from "react";
import { useLocation } from "wouter";
import { authClient } from "@/lib/auth-client";

export function AccountMenu({ color }: { color: string }) {
  const { data: session } = authClient.useSession();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const firstName = session?.user.name?.split(/\s+/)[0] || "Account";

  async function signOut() {
    await authClient.signOut();
    navigate("/sign-in?returnTo=%2Fripple-journey", { replace: true });
  }

  async function deleteAccount() {
    if (!window.confirm("Permanently delete your account and all journey data? This cannot be undone.")) {
      return;
    }
    setDeleting(true);
    const result = await authClient.deleteUser();
    setDeleting(false);
    if (result.error) {
      window.alert(result.error.message || "We couldn't delete your account.");
      return;
    }
    navigate("/", { replace: true });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="text-xs font-sans opacity-70 hover:opacity-100 transition-opacity"
        style={{ color }}
        aria-expanded={open}
      >
        {firstName} ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-3 w-52 rounded-xl bg-[#F5F1E8] text-[#0F2A36] border border-[#C8A96A]/30 shadow-xl p-2 z-50 font-sans">
          <p className="px-3 py-2 text-xs border-b border-[#0F2A36]/10 mb-1">
            Signed in as <strong>{firstName}</strong>
          </p>
          <button onClick={signOut} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#D7ECEB]">
            Sign Out
          </button>
          <button
            onClick={deleteAccount}
            disabled={deleting}
            className="w-full text-left px-3 py-2 text-xs rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete My Account"}
          </button>
        </div>
      )}
    </div>
  );
}