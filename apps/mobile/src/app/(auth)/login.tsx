import { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { colors, fonts } from "../../theme";
import { routeAfterAuth } from "../../lib/route-after-auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin() {
    setErrorMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await routeAfterAuth();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../../assets/gopher-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brand}>Gopher</Text>
      </View>

      <Text style={styles.title}>Welcome back!</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor={colors.textSecondary + "80"}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor={colors.textSecondary + "80"}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <Pressable
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Text style={styles.buttonText}>Log in</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push("/create-account")}>
        <Text style={styles.link}>
          New here? <Text style={styles.linkBold}>Create an account</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceBase,
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  logo: {
    width: 56,
    height: 56,
    marginBottom: 5,
  },
  brand: {
    fontFamily: fonts.headingBold,
    fontSize: 24,
    color: colors.accent,
  },
  title: {
    fontSize: 25,
    fontFamily: fonts.headingBold,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textPrimary,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 30,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  error: {
    color: colors.error,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: colors.accent,
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
  link: {
    color: colors.textPrimary,
    opacity: 0.7,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    textAlign: "center",
  },
  linkBold: {
    color: colors.accent,
    opacity: 1,
    fontFamily: fonts.bodySemiBold,
  },
});