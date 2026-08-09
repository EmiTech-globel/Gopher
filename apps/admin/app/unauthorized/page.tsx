import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function UnauthorizedPage() {
  const supabase = await createClient();

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-foreground">Not authorized</h1>
        <p className="mt-2 text-sm text-muted">
          {user?.email ?? "This account"}  isn't on the Gopher admin list. If you think this
          is a mistake, contact whoever manages the admins table.
        </p>
        <form action={signOut} className="mt-5">
          <button
            type="submit"
            className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
