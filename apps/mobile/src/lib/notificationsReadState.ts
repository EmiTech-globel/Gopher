import { supabase } from "./supabase";

/**
 * Marks every unread notification tied to a specific errand as read
 * for the current user. Called when a screen showing that errand's
 * status or chat is actively being viewed — the person has already
 * seen the update, so there's nothing left for the badge to flag.
 *
 * Fire-and-forget by design: this runs alongside a screen's normal
 * data load, and a failure here shouldn't block or error out the
 * screen itself — worst case, a notification just stays marked
 * unread a little longer.
 */
export async function markErrandNotificationsRead(errandId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("errand_id", errandId)
    .eq("read", false);
}

/**
 * Marks every unread notification for the current user as read —
 * backs the "Mark all as read" action on the notifications screen.
 */
export async function markAllNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
}
