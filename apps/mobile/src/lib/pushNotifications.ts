import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { supabase } from "./supabase";

const PERMISSION_ASKED_KEY = "gopher.pushPermissionAsked";

/**
 * Configure how notifications appear while the app is in the foreground.
 * Without this, Expo suppresses foreground notifications entirely.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permission from the OS. On Android this is mostly
 * automatic; on iOS the system permission dialog appears.
 *
 * Call this once — the result is persisted via the caller's gating logic.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Register the device's Expo push token with the backend so the
 * pg_net trigger can send pushes to this device.
 */
export async function registerPushToken(): Promise<void> {
  const token = await Notifications.getExpoPushTokenAsync({ projectId: "5444a730-38f3-475c-a00f-731a5ae348eb" });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("push_tokens").upsert(
    {
      user_id: user.id,
      token: token.data,
      platform: Platform.OS === "ios" ? "ios" : "android",
    },
    { onConflict: "user_id,token" },
  );
}

/**
 * Set up listeners for notification taps (background → foreground) and
 * foreground notifications. The onNotificationTap callback receives
 * the notification data for deep-linking.
 *
 * Returns a cleanup function that removes all listeners.
 */
export function setupPushHandlers(onNotificationTap?: (data: Record<string, unknown>) => void): () => void {
  // Tapped on a notification (app was in background or quit)
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    if (data && onNotificationTap) {
      onNotificationTap(data);
    }
  });

  return () => subscription.remove();
}

/**
 * Whether the user has already been asked for push permission.
 * Stored in AsyncStorage so the root layout can gate the ask to first launch.
 */
export { PERMISSION_ASKED_KEY };
