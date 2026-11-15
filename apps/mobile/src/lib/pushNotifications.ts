import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { supabase } from "./supabase";

export const PERMISSION_ASKED_KEY = "gopher.pushPermissionAsked";

const EXPO_PROJECT_ID = "5444a730-38f3-475c-a00f-731a5ae348eb";

/**
 * Configure how notifications appear while the app is in the foreground.
 * Without this, Expo suppresses foreground notifications entirely.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Android requires a notification channel. The push sender targets the
 * "default" channel, so it must exist before any push arrives and before
 * the permission prompt on Android 13+.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
  });
}

/**
 * Request notification permission from the OS.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Register this device's Expo push token for the logged-in user.
 * Goes through a security-definer RPC so a token that was previously
 * attached to another account on the same phone moves to this user.
 */
export async function registerPushToken(): Promise<void> {
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: EXPO_PROJECT_ID,
  });

  const { error } = await supabase.rpc("register_push_token", {
    p_token: token.data,
    p_platform: Platform.OS === "ios" ? "ios" : "android",
  });
  if (error) throw error;
}

/**
 * Remove this device's token. Call it just before signing out.
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });
    await supabase.from("push_tokens").delete().eq("token", token.data);
  } catch {
    // Logging out must never fail because of push cleanup.
  }
}

/**
 * Listen for notification taps. The callback receives the notification
 * data for deep-linking. Returns a cleanup function.
 */
export function setupPushHandlers(
  onNotificationTap?: (data: Record<string, unknown>) => void,
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      if (data && onNotificationTap) {
        onNotificationTap(data);
      }
    },
  );

  return () => subscription.remove();
}