import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_SEEN_KEY = "gopher.onboardingSeen";

export default function SplashScreen() {
  useEffect(() => {
    async function checkOnboarding() {
      const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
      const destination = seen === "true" ? "/login" : "/onboarding";

      // Brief, deliberate pause so the brand mark is actually seen,
      // per spec: "shown briefly on every app open."
      setTimeout(() => {
        router.replace(destination);
      }, 1200);
    }

    checkOnboarding();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Gopher</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#532B59",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontFamily: "Ubuntu",
    fontSize: 40,
    color: "#D7AEAD",
    fontWeight: "700",
  },
});
