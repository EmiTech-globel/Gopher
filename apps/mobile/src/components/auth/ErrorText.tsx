import { Text, StyleSheet } from "react-native";
import { colors, fonts } from "../../theme";

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  error: {
    color: colors.error,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
});