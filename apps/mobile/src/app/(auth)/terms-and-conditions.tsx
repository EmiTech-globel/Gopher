import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSquare, IconSquareCheck } from "@tabler/icons-react-native";
import { supabase } from "../../lib/supabase";
import { routeAfterAuth } from "../../lib/route-after-auth";
import { TERMS_SECTIONS, TERMS_VERSION, TERMS_LAST_UPDATED } from "../../lib/terms";
import { colors, fonts } from "../../theme";

export default function TermsAndConditionsScreen() {
  const insets = useSafeAreaInsets();
  const { next } = useLocalSearchParams<{ next?: string }>();

  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAccept() {
    if (!checked || saving) return;

    setErrorMessage(null);
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      router.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      setErrorMessage("Couldn't save your acceptance. Please try again.");
      return;
    }

    if (next) {
      router.replace(next as any);
    } else {
      await routeAfterAuth();
    }
  }

  function handleDecline() {
    Alert.alert(
      "Decline Terms & Conditions",
      "You need to accept the Terms & Conditions to use Gopher. Declining will sign you out.",
      [
        { text: "Go back", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Terms & Conditions</Text>
        <Text style={styles.updated}>Last updated {TERMS_LAST_UPDATED}</Text>
        <Text style={styles.intro}>
          Please read this before continuing. Accepting is required to use Gopher as either a
          User or a Scout.
        </Text>

        {TERMS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph, index) => (
              <Text key={index} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.checkboxRow} onPress={() => setChecked((c) => !c)}>
          {checked ? (
            <IconSquareCheck size={22} color={colors.accent} strokeWidth={1.75} />
          ) : (
            <IconSquare size={22} color={colors.textMuted} strokeWidth={1.75} />
          )}
          <Text style={styles.checkboxLabel}>
            I have read and agree to the Terms & Conditions
          </Text>
        </Pressable>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          style={[styles.acceptButton, !checked && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          disabled={!checked || saving}
        >
          <Text style={styles.acceptText}>{saving ? "Saving..." : "Accept and continue"}</Text>
        </Pressable>

        <Pressable onPress={handleDecline} disabled={saving}>
          <Text style={styles.declineText}>Decline</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  title: {
    fontFamily: fonts.headingBold, fontSize: 22, color: colors.textPrimary, marginBottom: 4,
  },
  updated: {
    fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, marginBottom: 14,
  },
  intro: {
    fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textTertiary,
    lineHeight: 19, marginBottom: 24,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary, marginBottom: 6,
  },
  paragraph: {
    fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textTertiary,
    lineHeight: 19, marginBottom: 8,
  },
  footer: {
    borderTopWidth: 1, borderTopColor: colors.divider,
    backgroundColor: colors.surfaceBase, paddingHorizontal: 20, paddingTop: 14,
  },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  checkboxLabel: {
    flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary,
  },
  error: {
    fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.error,
    textAlign: "center", marginBottom: 10,
  },
  acceptButton: {
    backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12,
    alignItems: "center", marginBottom: 12,
  },
  acceptButtonDisabled: { opacity: 0.4 },
  acceptText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.accent },
  declineText: {
    fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted,
    textAlign: "center", marginBottom: 4,
  },
});
