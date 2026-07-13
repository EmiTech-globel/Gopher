import { useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fonts } from "../../theme";

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
      <Image
        source={require("../../../assets/gopher-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.brand}>Gopher</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceBase,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 56,
    height: 56,
    marginBottom: 20,
  },
  brand: {
    fontFamily: fonts.headingBold,
    fontSize: 32,
    color: colors.textPrimary,
  },
});