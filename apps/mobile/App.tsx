import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { createGopherClient } from "@gopher/supabase-client";

const supabase = createGopherClient({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  storage: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  },
});

export default function App() {
  const [result, setResult] = useState<string>("Querying...");

  useEffect(() => {
    supabase
      .from("public_profiles")
      .select("*", { count: "exact" })
      .then(({ data, error, count }) => {
        if (error) {
          setResult(`Error: ${JSON.stringify(error)}`);
        } else {
          setResult(`Row count: ${count}\n${JSON.stringify(data)}`);
        }
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text>Gopher — Supabase Connection Smoke Test</Text>
      <Text style={styles.result}>{result}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  result: {
    marginTop: 20,
    textAlign: "center",
  },
});