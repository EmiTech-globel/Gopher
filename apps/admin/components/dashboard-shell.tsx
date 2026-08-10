"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { SignOutButton } from "@/components/sign-out-button";

export function DashboardShell({
  userEmail, children,
}: {
  userEmail: string | undefined;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  // Closes the drawer automatically on navigation — without this,
  // tapping a nav link on mobile would leave the drawer open over the
  // new page underneath it.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-surface">
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-surface-raised transition-transform duration-200 ease-in-out lg:static lg:w-56 lg:shrink-0 lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <Image width={36} height={36} src="/gopher-logo.png" alt="Gopher Logo" className="rounded-full" />
            <span className="text-sm font-semibold text-foreground">Gopher Admin</span>
          </div>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="rounded-md p-1 text-muted hover:bg-surface lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>
        <Sidebar onNavigate={() => setMobileNavOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface-raised px-4 sm:px-6">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md p-1.5 text-muted hover:bg-surface lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
            <span className="hidden truncate text-sm text-muted sm:inline">{userEmail}</span>
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
