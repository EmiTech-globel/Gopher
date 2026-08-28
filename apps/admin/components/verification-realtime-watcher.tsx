"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Mounts a Supabase Realtime subscription that listens for new rows
 * inserted into the `scouts` table with verification_status = 'pending'.
 *
 * When a scout submits their selfie + ID, their scouts row is created
 * with this status. This component detects that insert and:
 *  1. Calls router.refresh() so the server component re-fetches the queue.
 *  2. Shows a browser notification (if permission is granted) so the admin
 *     sees the alert even if they're on a different browser tab.
 *
 * Mount this inside the verification page — it has no visible UI.
 */
export function VerificationRealtimeWatcher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Request browser notification permission on first mount
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel("admin-pending-scouts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "scouts",
          filter: "verification_status=eq.pending",
        },
        (payload) => {
          // Refresh the page so the server component re-fetches the queue
          router.refresh();

          // Fire a browser notification if permission is granted
          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("New scout verification request", {
              body: "A scout has submitted their ID and selfie for review.",
              icon: "/favicon.ico",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
