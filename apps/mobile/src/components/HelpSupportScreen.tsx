import { View, Text, Pressable, Linking, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { IconArrowLeft, IconMail, IconMessageCircle } from "@tabler/icons-react-native";
import { colors, fonts } from "../theme";

const FAQ_ITEMS = [
  { q: "How does payment work?", a: "You pay upfront when posting an errand. Gopher holds the funds securely and only releases them to your Scout once you confirm delivery." },
  { q: "What if the price is higher than expected?", a: "Your Scout can request additional funds before buying. You'll be able to approve or decline the request before they proceed." },
  { q: "What if something goes wrong?", a: "You can report an issue instead of confirming delivery. Our team reviews disputes within 24 hours." },
  { q: "How do I become a Scout?", a: "Go to your Profile and tap \"Become a Scout.\" You'll need to submit a live selfie and student ID for verification, which usually takes 24–48 hours." },
];

export function HelpSupportScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <IconArrowLeft size={28} color={colors.textSecondary} strokeWidth={1.75} />
        </Pressable>
        <Text style={styles.headerTitle}>Help & support</Text>
        <View style={{ width: 20 }} />
      </View>
      
      <Text style={styles.sectionLabel}>Frequently asked questions</Text>
      {FAQ_ITEMS.map((item) => (
        <View key={item.q} style={styles.faqCard}>
          <Text style={styles.faqQuestion}>{item.q}</Text>
          <Text style={styles.faqAnswer}>{item.a}</Text>
        </View>
      ))}

      <Text style={styles.sectionLabel}>Contact us</Text>
      <Pressable style={styles.contactRow} onPress={() => Linking.openURL("mailto:support@gopherapp.ng")}>
        <IconMail size={18} color={colors.accent} strokeWidth={1.75} />
        <Text style={styles.contactText}>support@gopherapp.ng</Text>
      </Pressable>
      <Pressable style={styles.contactRow} onPress={() => Linking.openURL("https://wa.me/2348137193224")}>
        <IconMessageCircle size={18} color={colors.accent} strokeWidth={1.75} />
        <Text style={styles.contactText}>Message us on WhatsApp</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
headerTitle: { fontFamily: fonts.headingMedium, fontSize: 18, color: colors.textPrimary },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12,
  },
  faqCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 16, marginBottom: 10 },
  faqQuestion: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary, marginBottom: 6 },
  faqAnswer: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  contactRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 16, marginBottom: 10, marginTop: 4,
  },
  contactText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary },
});