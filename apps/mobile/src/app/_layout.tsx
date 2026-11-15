import { useCallback, useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Ubuntu_400Regular,
  Ubuntu_500Medium,
  Ubuntu_700Bold,
} from "@expo-google-fonts/ubuntu";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from "@expo-google-fonts/manrope";

import { supabase } from "../lib/supabase";
import {
  ensureAndroidChannel,
  requestNotificationPermission,
  registerPushToken,
  setupPushHandlers,
  PERMISSION_ASKED_KEY,
} from "../lib/pushNotifications";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Ubuntu_400Regular,
    Ubuntu_500Medium,
    Ubuntu_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });

  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setAppReady(true);
    }
  }, [fontsLoaded, fontError]);

  // Set up push notifications once the app is ready
  useEffect(() => {
    if (!appReady) return;

    let cleanup: (() => void) | undefined;

    async function initPush() {
      // The channel must exist before the permission prompt and before
      // any push arrives on Android.
      await ensureAndroidChannel();

      // Attach the tap handler first so a tap is never missed while the
      // permission and registration steps below are still awaiting.
      cleanup = setupPushHandlers(async (data) => {
        const errandId = data?.errandId as string | undefined;
        if (!errandId) return;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: scoutRow } = await supabase
          .from("scouts")
          .select("verification_status")
          .eq("profile_id", user.id)
          .maybeSingle();

        const basePath =
          scoutRow?.verification_status === "approved"
            ? "/(scout)/errand"
            : "/(user)/errand";

        router.push(`${basePath}/${errandId}` as any);
      });

      const alreadyAsked = await AsyncStorage.getItem(PERMISSION_ASKED_KEY);
      let permissionGranted = alreadyAsked === "granted";

      if (!alreadyAsked) {
        permissionGranted = await requestNotificationPermission();
        await AsyncStorage.setItem(
          PERMISSION_ASKED_KEY,
          permissionGranted ? "granted" : "denied",
        );
      }

      // Only register a push token when permission is actually granted.
      if (permissionGranted) {
        try {
          await registerPushToken();
        } catch (e) {
          console.warn("Push token registration failed", e);
        }
      }
    }

    initPush().catch((e) => console.warn("Push setup failed", e));

    return () => cleanup?.();
  }, [appReady]);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}