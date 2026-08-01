import { View, Text, Linking, StyleSheet } from "react-native";
import { router } from "expo-router";
import { IconX } from "@tabler/icons-react-native";
import { AuthScreenContainer, AuthButton } from "../../components/auth";
import { colors, fonts } from "../../theme";

const SUPPORT_EMAIL = "support@gopher.ng";

export default function VerificationRejectedScreen() {
  return (
    <AuthScreenContainer
      title="Verification not approved"
      subtitle="Your scout registration was reviewed"
    >
      <View style={styles.checklist}>
        <View style={styles.checklistItem}>
          <IconX size={18} color={colors.error} strokeWidth={2.5} />
          <Text style={styles.item}>Documents did not pass review</Text>
        </View>
      </View>
      <Text style={styles.note}>
        Your submitted selfie or student ID did not meet our requirements.
        Please review the guidelines and try submitting again, or contact
        support if you believe this was a mistake.
      </Text>
      <AuthButton
        label="Contact support"
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        variant="secondary"
      />
      <View style={styles.spacer} />
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
  spacer: {
    height: 12,
  },
});
