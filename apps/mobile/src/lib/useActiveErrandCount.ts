import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./supabase";

// Statuses that count toward a scout's active load. Kept in sync with the
// home screen's ACTIVE_STATUSES list and the DB trigger in migration 00029.
const ACTIVE_STATUSES = ["accepted", "purchased", "delivered", "disputed"];

// Mirrors useUnreadCount: fetches the scout's current active-errand count and
// keeps it live via a realtime subscription, so the accept buttons on Browse
// and the errand detail screen can disable themselves the moment a scout hits
// the 2-errand cap — without waiting for the DB trigger to reject the accept.
export function useActiveErrandCount() {
  const [count, setCount] = useState(0);
  const instanceId = useRef(Math.random().toString(36).slice(2)).current;

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count: active } = await supabase
      .from("errands")
      .select("id", { count: "exact", head: true })
      .eq("scout_id", user.id)
      .in("status", ACTIVE_STATUSES);
    setCount(active ?? 0);
  }, []);

  useEffect(() => {
    refresh();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      channel = supabase
        .channel(`active-errands:${data.user.id}:${instanceId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "errands", filter: `scout_id=eq.${data.user.id}` },
          () => refresh()
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [refresh, instanceId]);

  return { count, refresh };
}
