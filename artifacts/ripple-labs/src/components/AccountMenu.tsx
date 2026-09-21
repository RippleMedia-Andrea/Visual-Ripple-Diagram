import { useState } from "react";
import { useLocation } from "wouter";
import { authClient } from "@/lib/auth-client";

export function AccountMenu({ color }: { color: string }) {
  const { data: session } = authClient.useSession();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const firstName = session?.user.name?.split(/\s+/)[0] || "Account";

  async function signOut() {
    await authClient.signOut();
    navigate("/sign-in?returnTo=%2Fripple-journey", { replace: true });
  }

  async function handleDeleteClick() {
    setOpen(false);
    setShowDeleteDialog(true);
    setDeleteError("");
    setDeletePassword("");
  }

  async function confirmDelete() {
    if (!deletePassword) {
      setDeleteError("Please enter your password.");
      return;
    }

    setDeleting(true);
    setDeleteError("");

    const result = await authClient.deleteUser({ password: deletePassword });

    setDeleting(false);
    if (result.error) {
      setDeleteError(result.error.message || "We couldn't delete your account. Please check your password.");
      return;
    }
    setShowDeleteDialog(false);
    navigate("/", { replace: true });
  }

  return (
    <>
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
            <button onClick={signOut} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#D7ECEB] transition-colors">
              Sign Out
            </button>
            <button
              onClick={handleDeleteClick}
              className="w-full text-left px-3 py-2 text-xs rounded-lg text-red-700 hover:bg-red-50 transition-colors"
            >
              Delete My Account
            </button>
          </div>
        )}
      </div>

      {showDeleteDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteDialog(false)} />
          <form
            onSubmit={(e) => { e.preventDefault(); confirmDelete(); }}
            className="relative bg-[#F5F1E8] text-[#0F2A36] rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <h3 className="font-serif text-2xl mb-2">Delete Account</h3>
            <p className="font-sans text-sm opacity-80 mb-6">
              This will permanently delete your account and all journey data. This action cannot be undone. Please enter your password to confirm.
            </p>

            <div className="space-y-4 mb-6">
              <input
                type="password"
                placeholder="Your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full bg-white/50 border border-[#2F7F7B]/20 rounded-xl px-4 py-3 outline-none focus:border-[#C8A96A] font-sans text-sm"
                disabled={deleting}
              />
              {deleteError && (
                <p className="text-sm font-sans text-red-700 bg-red-50 p-3 rounded-xl border border-red-100">
                  {deleteError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-full text-sm font-sans font-medium border border-[#2F7F7B]/20 hover:bg-black/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleting || !deletePassword}
                className="flex-1 py-3 rounded-full text-sm font-sans font-medium bg-red-700 text-white hover:bg-red-800 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete Account"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
