import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { authClient } from "@/lib/auth-client";
import {
  getGetCourseAccessQueryKey,
  getListCourseBuyersQueryKey,
  useCreateCourseWebhookToken,
  useGetCourseAccess,
  useGrantCourseAccess,
  useListCourseBuyers,
  useUpdateCourseWebhook,
} from "@workspace/api-client-react";

const card = "rounded-2xl bg-white/60 border border-[#2F7F7B]/15 shadow-sm p-6 md:p-8";
const label = "text-[#2F7F7B] text-[11px] uppercase tracking-[0.22em] font-sans mb-2";
const input = "w-full bg-white/70 border border-[#2F7F7B]/20 rounded-xl px-4 py-3 outline-none focus:border-[#C8A96A] font-sans text-sm";
const btn = "rounded-full bg-[#0F2A36] text-[#F5F1E8] px-6 py-3 font-sans text-sm font-medium disabled:opacity-50 hover:bg-[#2F7F7B] transition-colors";

function fmt(d: string) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleString();
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-[#F5F1E8] text-[#0F2A36] px-5 py-10 md:py-16">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="font-sans text-xs text-[#2F7F7B] hover:underline" data-testid="link-home">Back to Ripple Labs</Link>
        {children}
      </div>
    </main>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <div className={`${card} mt-10 max-w-lg`}>
        <h1 className="font-serif text-3xl mb-3">{title}</h1>
        <p className="font-sans text-sm text-[#0F2A36]/75">{body}</p>
      </div>
    </Shell>
  );
}

function errStatus(e: unknown): number | undefined {
  const s = (e as { status?: number; response?: { status?: number } } | null);
  return s?.status ?? s?.response?.status;
}

function errMsg(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

export default function CourseBuyersPage() {
  const { data: session, isPending } = authClient.useSession();
  const [, navigate] = useLocation();
  const access = useGetCourseAccess({ query: { enabled: Boolean(session), queryKey: [...getGetCourseAccessQueryKey(), session?.user.id] } });

  useEffect(() => {
    if (!isPending && !session) navigate("/sign-in?returnTo=%2Fadmin%2Fcourse-buyers", { replace: true });
  }, [isPending, session, navigate]);

  if (isPending || !session || access.isLoading) {
    return (
      <Shell>
        <div className="mt-10 space-y-4 animate-pulse">
          <div className="h-10 w-72 rounded-xl bg-[#D7ECEB]" />
          <div className="h-40 rounded-2xl bg-[#D7ECEB]/70" />
          <div className="h-56 rounded-2xl bg-[#D7ECEB]/50" />
        </div>
      </Shell>
    );
  }
  if (access.isError) {
    return <Notice title="We couldn't check your access" body="Something went wrong on our side. Please refresh and try again." />;
  }
  if (!access.data?.isOwner) {
    return <Notice title="This page is for the owner" body="You don't have permission to view course buyers. If you think that's a mistake, reach out through the support page." />;
  }
  return <OwnerDashboard />;
}

function OwnerDashboard() {
  const qc = useQueryClient();
  const list = useListCourseBuyers({ query: { enabled: true, queryKey: getListCourseBuyersQueryKey() } });
  const grant = useGrantCourseAccess();
  const update = useUpdateCourseWebhook();
  const createToken = useCreateCourseWebhookToken();

  const [email, setEmail] = useState("");
  const [grantMsg, setGrantMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [courseId, setCourseId] = useState("");
  const [planId, setPlanId] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [configMsg, setConfigMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [secretUrl, setSecretUrl] = useState<string | null>(null);
  const [tokenErr, setTokenErr] = useState("");
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhook = list.data?.webhook;
  useEffect(() => {
    if (webhook && !initialized) {
      setCourseId(webhook.courseId ?? "");
      setPlanId(webhook.offerPricePlanId ?? "");
      setInitialized(true);
    }
  }, [webhook, initialized]);

  const refresh = () => qc.invalidateQueries({ queryKey: getListCourseBuyersQueryKey() });

  async function onGrant(e: FormEvent) {
    e.preventDefault();
    setGrantMsg(null);
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setGrantMsg({ ok: false, text: "That email doesn't look quite right." });
      return;
    }
    try {
      await grant.mutateAsync({ data: { email: value } });
      setEmail("");
      setGrantMsg({ ok: true, text: `Access granted to ${value}.` });
      await Promise.all([refresh(), qc.invalidateQueries({ queryKey: getGetCourseAccessQueryKey() })]);
    } catch (err) {
      setGrantMsg({ ok: false, text: errMsg(err, "We couldn't grant access. Please try again.") });
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setConfigMsg(null);
    const c = courseId.trim();
    const p = planId.trim();
    if ((c && !/^\d+$/.test(c)) || (p && !/^\d+$/.test(p))) {
      setConfigMsg({ ok: false, text: "IDs should be numbers only. Leave a field blank if you don't have it yet." });
      return;
    }
    try {
      await update.mutateAsync({ data: { courseId: c, offerPricePlanId: p } });
      setConfigMsg({ ok: true, text: "Settings saved." });
      await refresh();
    } catch (err) {
      setConfigMsg({ ok: false, text: errMsg(err, "We couldn't save those settings.") });
    }
  }

  async function generate() {
    setTokenErr("");
    setConfirmRotate(false);
    setCopied(false);
    try {
      const res = await createToken.mutateAsync();
      setSecretUrl(res.url);
      await refresh();
    } catch (err) {
      setTokenErr(errMsg(err, "We couldn't create the webhook URL."));
    }
  }

  async function copy() {
    if (!secretUrl) return;
    try {
      await navigator.clipboard.writeText(secretUrl);
      setCopied(true);
    } catch {
      setTokenErr("Copy didn't work. Please select the URL and copy it by hand.");
    }
  }

  if (list.isLoading) {
    return (
      <Shell>
        <div className="mt-10 space-y-4 animate-pulse">
          <div className="h-10 w-72 rounded-xl bg-[#D7ECEB]" />
          <div className="h-48 rounded-2xl bg-[#D7ECEB]/70" />
        </div>
      </Shell>
    );
  }
  if (list.isError || !list.data) {
    const forbidden = errStatus(list.error) === 403;
    return (
      <Shell>
        <div className={`${card} mt-10 max-w-lg`}>
          <h1 className="font-serif text-3xl mb-3">{forbidden ? "This page is for the owner" : "We couldn't load course buyers"}</h1>
          <p className="font-sans text-sm text-[#0F2A36]/75 mb-5">{forbidden ? "Your account doesn't have permission to see this." : "Something went wrong while loading. Give it another try."}</p>
          {!forbidden && <button className={btn} onClick={() => list.refetch()} data-testid="button-retry">Try again</button>}
        </div>
      </Shell>
    );
  }

  const { buyers, events } = list.data;
  const configured = list.data.webhook.configured;
  const hasSettings = Boolean(courseId.trim() || planId.trim()) && Boolean(webhook?.courseId || webhook?.offerPricePlanId);

  return (
    <Shell>
      <header className="mt-8 mb-10">
        <p className={label}>Owner tools</p>
        <h1 className="font-serif text-4xl md:text-5xl">Course buyers</h1>
        <div className="gold-divider w-40 mt-5" />
      </header>

      <div className="space-y-8">
        <section className={card}>
          <p className={label}>Give someone access</p>
          <h2 className="font-serif text-2xl mb-4">Grant access by email</h2>
          <form onSubmit={onGrant} className="flex flex-col sm:flex-row gap-3">
            <input type="email" className={input} placeholder="friend@example.com" value={email} maxLength={254} onChange={(e) => setEmail(e.target.value)} disabled={grant.isPending} data-testid="input-grant-email" />
            <button type="submit" className={btn} disabled={grant.isPending || !email.trim()} data-testid="button-grant">{grant.isPending ? "Granting…" : "Grant access"}</button>
          </form>
          {grantMsg && <p className={`mt-3 font-sans text-sm ${grantMsg.ok ? "text-[#2F7F7B]" : "text-red-700"}`} data-testid="status-grant">{grantMsg.text}</p>}
        </section>

        <section className={card}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className={label}>Systeme.io</p>
              <h2 className="font-serif text-2xl">Sales webhook</h2>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-sans ${configured ? "bg-[#D7ECEB] text-[#2F7F7B]" : "bg-[#C8A96A]/20 text-[#7a6234]"}`} data-testid="status-webhook">{configured ? "Active" : "Inactive"}</span>
          </div>
          {!configured && (
            <p className="font-sans text-sm text-[#0F2A36]/75 mb-5">The webhook stays inactive until you save a course ID or offer price plan ID and generate a URL. Leaving both blank is fine while the course isn't built yet.</p>
          )}
          <form onSubmit={onSave} className="grid sm:grid-cols-2 gap-4">
            <label className="font-sans text-xs text-[#0F2A36]/70">Course ID
              <input inputMode="numeric" className={`${input} mt-1`} value={courseId} maxLength={100} onChange={(e) => setCourseId(e.target.value)} placeholder="Not set yet" data-testid="input-course-id" />
            </label>
            <label className="font-sans text-xs text-[#0F2A36]/70">Offer price plan ID
              <input inputMode="numeric" className={`${input} mt-1`} value={planId} maxLength={100} onChange={(e) => setPlanId(e.target.value)} placeholder="Not set yet" data-testid="input-plan-id" />
            </label>
            <div className="sm:col-span-2 flex items-center gap-3 flex-wrap">
              <button type="submit" className={btn} disabled={update.isPending} data-testid="button-save-webhook">{update.isPending ? "Saving…" : "Save settings"}</button>
              {configMsg && <p className={`font-sans text-sm ${configMsg.ok ? "text-[#2F7F7B]" : "text-red-700"}`} data-testid="status-config">{configMsg.text}</p>}
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-[#0F2A36]/10">
            <h3 className="font-serif text-xl mb-2">Secret webhook URL</h3>
            <p className="font-sans text-sm text-[#0F2A36]/75 mb-4">We show the URL once, right after you create it. Copy it into Systeme.io straight away. If you lose it, make a new one.</p>
            {secretUrl ? (
              <div className="rounded-xl bg-[#0F2A36] text-[#D7ECEB] p-4">
                <code className="block break-all text-xs font-mono select-all" data-testid="text-webhook-url">{secretUrl}</code>
                <div className="flex gap-3 mt-3">
                  <button onClick={copy} className="rounded-full bg-[#C8A96A] text-[#0F2A36] px-4 py-2 text-xs font-sans font-medium" data-testid="button-copy-url">{copied ? "Copied" : "Copy URL"}</button>
                  <button onClick={() => { setSecretUrl(null); setCopied(false); }} className="rounded-full border border-[#D7ECEB]/30 px-4 py-2 text-xs font-sans" data-testid="button-hide-url">I saved it, hide it</button>
                </div>
              </div>
            ) : confirmRotate ? (
              <div className="rounded-xl bg-[#C8A96A]/15 border border-[#C8A96A]/40 p-4 font-sans text-sm">
                <p className="mb-3">Making a new URL means the old one stops working right away. You'll need to paste the new one into Systeme.io. Continue?</p>
                <div className="flex gap-3">
                  <button className={btn} onClick={generate} disabled={createToken.isPending} data-testid="button-confirm-rotate">{createToken.isPending ? "Creating…" : "Yes, replace it"}</button>
                  <button className="rounded-full border border-[#0F2A36]/20 px-6 py-3 text-sm" onClick={() => setConfirmRotate(false)} data-testid="button-cancel-rotate">Cancel</button>
                </div>
              </div>
            ) : (
              <button className={btn} disabled={createToken.isPending} onClick={() => setConfirmRotate(true)} data-testid="button-generate-url">
                {createToken.isPending ? "Creating…" : configured ? "Replace webhook URL" : "Create webhook URL"}
              </button>
            )}
            {!configured && !hasSettings && <p className="mt-3 font-sans text-xs text-[#0F2A36]/60">Tip: save a course or offer ID first so sales can be matched.</p>}
            {tokenErr && <p className="mt-3 font-sans text-sm text-red-700" data-testid="status-token-error">{tokenErr}</p>}
          </div>

          <details className="mt-6 font-sans text-sm text-[#0F2A36]/80">
            <summary className="cursor-pointer text-[#2F7F7B]">What a sale needs to include</summary>
            <ul className="mt-3 space-y-1 list-disc pl-5">
              <li><code className="text-xs">type</code> set to <code className="text-xs">customer.sale.completed</code></li>
              <li><code className="text-xs">data.customer.email</code></li>
              <li><code className="text-xs">data.order.id</code> and <code className="text-xs">data.order_item.id</code></li>
              <li><code className="text-xs">data.order_item.resources</code> with your membership_course ID, and/or <code className="text-xs">data.offer_price_plan.id</code></li>
              <li><code className="text-xs">created_at</code></li>
            </ul>
          </details>
        </section>

        <section className={card}>
          <p className={label}>{buyers.length} {buyers.length === 1 ? "person" : "people"}</p>
          <h2 className="font-serif text-2xl mb-4">Buyers</h2>
          {buyers.length === 0 ? (
            <p className="font-sans text-sm text-[#0F2A36]/65 italic" data-testid="text-no-buyers">No buyers yet. When someone purchases or you grant access, they'll show up here.</p>
          ) : (
            <ul className="divide-y divide-[#0F2A36]/10">
              {buyers.map((b) => (
                <li key={b.email} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 font-sans text-sm" data-testid={`row-buyer-${b.email}`}>
                  <span className="font-medium break-all">{b.email}</span>
                  <span className="text-xs text-[#0F2A36]/60"><span className="rounded-full bg-[#D7ECEB] px-2 py-0.5 mr-2 text-[#2F7F7B]">{b.source}</span>{fmt(b.grantedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <p className={label}>Last 100</p>
          <h2 className="font-serif text-2xl mb-4">Webhook activity</h2>
          {events.length === 0 ? (
            <p className="font-sans text-sm text-[#0F2A36]/65 italic" data-testid="text-no-events">Nothing has come in yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-sans text-xs">
                <thead><tr className="text-left text-[#0F2A36]/55"><th className="py-2 pr-4 font-medium">Received</th><th className="py-2 pr-4 font-medium">Event key</th><th className="py-2 font-medium">Outcome</th></tr></thead>
                <tbody className="divide-y divide-[#0F2A36]/10">
                  {events.map((ev) => (
                    <tr key={ev.id} data-testid={`row-event-${ev.id}`}>
                      <td className="py-2 pr-4 whitespace-nowrap">{fmt(ev.receivedAt)}</td>
                      <td className="py-2 pr-4 font-mono break-all">{ev.eventKey || "none"}</td>
                      <td className="py-2">{ev.outcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
