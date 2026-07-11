import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { AuthScreenContainer, AuthButton } from "../../components/auth";

export default function VerificationPendingScreen() {
  return (
    <AuthScreenContainer
      title="Verification pending"
      subtitle="Your selfie and student ID have been submitted"
    >
      <View style={styles.checklist}>
        <Text style={styles.item}>✓ Selfie submitted</Text>
        <Text style={styles.item}>✓ Student ID submitted</Text>
      </View>
      <Text style={styles.note}>
        Review usually takes 24–48 hours. You'll get a notification once
        you're approved to start accepting errands.
      </Text>
      <AuthButton label="Back to login" onPress={() => router.replace("/login")} />
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  checklist: { marginBottom: 20 },
  item: { color: "#FFFFFF", fontSize: 15, marginBottom: 8 },
  note: { color: "#FFFFFF", opacity: 0.7, fontSize: 13, textAlign: "center", marginBottom: 24, lineHeight: 19 },
});
