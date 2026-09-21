import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { authClient } from "@/lib/auth-client";

export function ProtectedJourney({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isPending && !session) {
      navigate("/sign-in?returnTo=%2Fripple-journey", { replace: true });
    }
  }, [isPending, session, navigate]);

  if (isPending || !session) {
    return (
      <div className="min-h-screen bg-[#0F2A36] text-[#D7ECEB] flex items-center justify-center font-sans">
        Preparing your journey…
      </div>
    );
  }

  return children;
}