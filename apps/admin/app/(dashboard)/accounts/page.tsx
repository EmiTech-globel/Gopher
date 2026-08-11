import Link from "next/link";
import { Users, ShieldCheck, ShieldOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  access_revoked_at: string | null;
}

interface ScoutRow {
  profile_id: string;
  trust_tier: string;
  verification_status: string;
  banned_at: string | null;
  rating_avg: number | null;
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let profileQuery = supabase
    .from("profiles")
    .select("id, full_name, email, department, access_revoked_at")
    .order("full_name")
    .limit(50);

  if (q) profileQuery = profileQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data: profiles, error } = await profileQuery.returns<ProfileRow[]>();

  const profileIds = (profiles ?? []).map((p) => p.id);
  const { data: scouts } = profileIds.length
    ? await supabase
        .from("scouts")
        .select("profile_id, trust_tier, verification_status, banned_at, rating_avg")
        .in("profile_id", profileIds)
        .returns<ScoutRow[]>()
    : { data: [] as ScoutRow[] };

  const scoutMap = new Map((scouts ?? []).map((s) => [s.profile_id, s]));

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Accounts</h1>
      <p className="mb-6 text-sm text-muted">Search users and scouts. Showing up to 50 results.</p>

      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or email..."
          className="w-full max-w-md rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </form>

      {error && (
        <p className="rounded-lg border border-status-disputed bg-status-disputed-bg p-3 text-sm text-status-disputed">
          Couldn&apos;t load accounts: {error.message}
        </p>
      )}

      {!error && (profiles ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised py-16 text-center">
          <Users size={28} strokeWidth={1.5} className="mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No accounts match</p>
        </div>
      )}

      {!error && (profiles ?? []).length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Trust tier</th>
                <th className="px-4 py-2.5 font-medium">Rating</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((profile) => {
                const scout = scoutMap.get(profile.id);
                return (
                  <tr
                    key={profile.id}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-surface"
                  >
                    <td className="px-4 py-2.5">
                      <Link href={`/accounts/${profile.id}`} className="font-medium text-foreground hover:text-brand">
                        {profile.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted">{profile.email}</td>
                    <td className="px-4 py-2.5 text-muted">{scout ? "Scout" : "User"}</td>
                    <td className="px-4 py-2.5 text-muted capitalize">{scout?.trust_tier ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted">{scout?.rating_avg ? scout.rating_avg.toFixed(1) : "—"}</td>
                    <td className="px-4 py-2.5">
                      {profile.access_revoked_at ? (
                        <span className="inline-flex items-center gap-1 text-xs text-status-disputed">
                          <ShieldOff size={13} strokeWidth={1.75} /> Access revoked
                        </span>
                      ) : scout?.banned_at ? (
                        <span className="inline-flex items-center gap-1 text-xs text-status-disputed">
                          <ShieldOff size={13} strokeWidth={1.75} /> Banned
                        </span>
                      ) : scout ? (
                        <span className="inline-flex items-center gap-1 text-xs text-status-resolved">
                          <ShieldCheck size={13} strokeWidth={1.75} /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
