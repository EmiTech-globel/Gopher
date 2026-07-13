import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { IconCheck } from "@tabler/icons-react-native";
import { AuthScreenContainer, AuthButton } from "../../components/auth";
import { colors, fonts } from "../../theme";

export default function VerificationPendingScreen() {
  return (
    <AuthScreenContainer
      title="Verification pending"
      subtitle="Your selfie and student ID have been submitted"
    >
      <View style={styles.checklist}>
        <View style={styles.checklistItem}>
          <IconCheck size={18} color={colors.success} strokeWidth={2.5} />
          <Text style={styles.item}>Selfie submitted</Text>
        </View>
        <View style={styles.checklistItem}>
          <IconCheck size={18} color={colors.success} strokeWidth={2.5} />
          <Text style={styles.item}>Student ID submitted</Text>
        </View>
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
  checklist: {
    marginBottom: 20,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  item: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
    marginLeft: 10,
  },
  note: {
    color: colors.textPrimary,
    opacity: 0.7,
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 19,
  },
});