import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";

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

    // Role-specific home screens (User vs Scout) are deferred per the
    // build order until the full auth flow is complete — this is a
    // placeholder confirmation, not the final destination.
    router.replace("/login-success-placeholder");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Gopher</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#D7AEAD80"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#D7AEAD80"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <Pressable
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#D7AEAD" />
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
    backgroundColor: "#1A0E22",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  brand: {
    fontSize: 32,
    fontWeight: "700",
    color: "#D7AEAD",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#2A1533",
    color: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  error: {
    color: "#C15C6B",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#532B59",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: "#D7AEAD",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    color: "#FFFFFF",
    opacity: 0.7,
    textAlign: "center",
    fontSize: 14,
  },
  linkBold: {
    color: "#D7AEAD",
    opacity: 1,
    fontWeight: "600",
  },
});
