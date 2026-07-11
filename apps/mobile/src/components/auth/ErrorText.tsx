import { Text, StyleSheet } from "react-native";

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  error: {
    color: "#C15C6B",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
});
