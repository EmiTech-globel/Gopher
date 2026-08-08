import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { VerificationActions } from "@/components/verification-actions";

interface PendingApplicant {
  profile_id: string;
  matric_number: string;
  selfie_url: string | null;
  id_photo_url: string | null;
  profiles: {
    full_name: string;
    department: string | null;
  } | null;
}

export default async function VerificationPage() {
  const supabase = await createClient();

  const { data: applicants, error } = await supabase
    .from("scouts")
    .select("profile_id, matric_number, selfie_url, id_photo_url, profiles(full_name, department)")
    .eq("verification_status", "pending")
    .returns<PendingApplicant[]>();

  // Signed URLs, not public ones — the scout-verification bucket is
  // private (spec Section 4: "restricted, non-public, admin-only
  // read"). is_admin() RLS already allows this read; we just need a
  // temporary URL to actually render the image.
  const applicantsWithUrls = await Promise.all(
    (applicants ?? []).map(async (applicant) => {
      const [selfieResult, idResult] = await Promise.all([
        applicant.selfie_url
          ? supabase.storage.from("scout-verification").createSignedUrl(applicant.selfie_url, 3600)
          : Promise.resolve({ data: null }),
        applicant.id_photo_url
          ? supabase.storage.from("scout-verification").createSignedUrl(applicant.id_photo_url, 3600)
          : Promise.resolve({ data: null }),
      ]);
      return {
        ...applicant,
        selfieSignedUrl: selfieResult.data?.signedUrl ?? null,
        idSignedUrl: idResult.data?.signedUrl ?? null,
      };
    })
  );

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Verification queue</h1>
      <p className="mb-6 text-sm text-muted">
        Scout applications awaiting review. Turnaround target: 24–48 hours.
      </p>

      {error && (
        <p className="rounded-lg border border-status-disputed bg-status-disputed-bg p-3 text-sm text-status-disputed">
          Couldn&apos;t load applicants: {error.message}
        </p>
      )}

      {!error && applicantsWithUrls.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised py-16 text-center">
          <ShieldCheck size={28} strokeWidth={1.5} className="mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Nothing pending</p>
          <p className="mt-1 text-xs text-muted">All caught up — no applications waiting.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {applicantsWithUrls.map((applicant) => (
          <div
            key={applicant.profile_id}
            className="rounded-xl border border-border bg-surface-raised p-5 shadow-sm"
          >
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground">
                {applicant.profiles?.full_name ?? "Unknown"}
              </p>
              <p className="text-xs text-muted">
                {applicant.matric_number}
                {applicant.profiles?.department ? ` · ${applicant.profiles.department}` : ""}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Selfie</p>
                {applicant.selfieSignedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={applicant.selfieSignedUrl}
                    alt="Applicant selfie"
                    className="aspect-square w-full rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                    No photo
                  </div>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Student ID</p>
                {applicant.idSignedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={applicant.idSignedUrl}
                    alt="Student ID"
                    className="aspect-square w-full rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                    No photo
                  </div>
                )}
              </div>
            </div>

            <VerificationActions profileId={applicant.profile_id} />
          </div>
        ))}
      </div>
    </div>
  );
}
