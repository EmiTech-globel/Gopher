import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "../../lib/supabase";

function parseTokensFromUrl(url: string) {
  // Implicit flow (the JS SDK default for client-only apps) delivers
  // tokens after a "#" fragment, not as query params.
  const fragment = url.split("#")[1];
  if (!fragment) return null;

  const params = new URLSearchParams(fragment);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export default function ConfirmEmailScreen() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    async function handleUrl(url: string | null) {
      if (!url || handledRef.current) return;

      const tokens = parseTokensFromUrl(url);
      if (!tokens) {
        setErrorMessage("Missing confirmation details. Please try logging in.");
        return;
      }

      handledRef.current = true;

      const { error } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      // No dedicated post-confirmation/home screen exists yet — routing
      // to login for now, which will detect the active session. Swap
      // this once a real landing screen is built.
      router.replace("/login");
    }

    // Cold start: app was launched fresh by tapping the link.
    Linking.getInitialURL().then(handleUrl);

    // Warm start: app was already running in the background — this is
    // the case that was silently failing before.
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      {errorMessage ? (
        <Text style={styles.error}>{errorMessage}</Text>
      ) : (
        <>
          <ActivityIndicator color="#D7AEAD" size="large" />
          <Text style={styles.text}>Confirming your account...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A0E22",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  text: { color: "#FFFFFF", marginTop: 16, fontSize: 15 },
  error: { color: "#C15C6B", fontSize: 15, textAlign: "center" },
});
