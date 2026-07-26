import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./supabase";

export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const instanceId = useRef(
    Math.random().toString(36).slice(2) || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  ).current;

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count: unread } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setCount(unread ?? 0);
  }, []);

  useEffect(() => {
    refresh();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      channel = supabase
        .channel(`notifications:${data.user.id}:${instanceId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${data.user.id}` },
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