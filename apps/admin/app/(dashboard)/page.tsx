import { AlertTriangle, CheckCircle2, Clock, ListChecks, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

function startOfWeekUTC() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday));
  return monday.toISOString();
}

export default async function OverviewPage() {
  const supabase = await createClient();

  const [
    { count: activeErrandsCount },
    { count: completedTodayCount },
    { count: pendingVerificationsCount },
    { count: openDisputesCount },
    { data: confirmedThisWeek },
    { data: settingsRow },
  ] = await Promise.all([
    supabase
      .from("errands")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "accepted", "purchased", "delivered", "disputed"]),
    supabase
      .from("errands")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .gte("confirmed_at", startOfTodayUTC()),
    supabase
      .from("scouts")
      .select("profile_id", { count: "exact", head: true })
      .eq("verification_status", "pending"),
    supabase
      .from("disputes")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("errands")
      .select("delivery_fee")
      .eq("status", "confirmed")
      .gte("confirmed_at", startOfWeekUTC()),
    supabase.from("platform_settings").select("charges_fee_percent").eq("id", 1).single(),
  ]);

  const chargesFeeRate = Number(settingsRow?.charges_fee_percent ?? 18) / 100;
  const chargesFeeThisWeek = (confirmedThisWeek ?? []).reduce(
    (sum, row) => sum + Number(row.delivery_fee) * chargesFeeRate,
    0
  );

  const stats = [
    {
      label: "Active errands",
      value: activeErrandsCount ?? 0,
      icon: ListChecks,
      hint: "Open, accepted, purchased, delivered, or disputed",
    },
    {
      label: "Completed today",
      value: completedTodayCount ?? 0,
      icon: CheckCircle2,
      hint: "Confirmed since midnight UTC",
    },
    {
      label: "Pending verifications",
      value: pendingVerificationsCount ?? 0,
      icon: Clock,
      hint: "Scout applications awaiting review",
      href: "/verification",
    },
    {
      label: "Open disputes",
      value: openDisputesCount ?? 0,
      icon: AlertTriangle,
      hint: "Awaiting resolution",
      href: "/disputes",
    },
    {
      label: "This week's Charges Fee",
      value: `₦${chargesFeeThisWeek.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: Wallet,
      hint: `${(chargesFeeRate * 100).toFixed(0)}% of delivery fees, confirmed errands since Monday`,
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Overview</h1>
      <p className="mb-6 text-sm text-muted">A snapshot of what's happening right now.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, hint, href }) => (
          <a
            key={label}
            href={href ?? "#"}
            className={
              "rounded-xl border border-border bg-surface-raised p-5 shadow-sm" +
              (href ? " transition-colors hover:border-brand" : " cursor-default")
            }
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-muted">{label}</span>
              <Icon size={18} strokeWidth={1.75} className="text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold text-foreground">{value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
