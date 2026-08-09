import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { SignOutButton } from "@/components/sign-out-button";
import Image from "next/image";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="w-56 shrink-0 border-r border-border bg-surface-raised">
        <div className="flex gap-2 border-b border-border px-4 py-4 items-center">
          <Image 
          width={36}
          height={36}
          src="/gopher-logo.png"
          alt="Gopher Logo"
          className="rounded-full"
          />
          <span className="text-sm font-semibold text-foreground">Gopher Admin</span>
        </div>
        <Sidebar />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-border bg-surface-raised px-6">
          <span className="text-sm text-muted">{user?.email}</span>
          <SignOutButton />
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
