import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, Image, Alert } from "react-native";
import { useFocusEffect, router } from "expo-router";
import {
  IconPencil, IconLogout, IconUserPlus, IconRun, IconCreditCard,
  IconPhone, IconBell, IconHelpCircle, IconChevronRight,
} from "@tabler/icons-react-native";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";
import { SettingsRow } from "../../../components/SettingsRow";
import { pickAndUploadAvatar } from "../../../lib/uploadAvatar";
import { LinearGradient } from "expo-linear-gradient";

interface ProfileData {
  full_name: string;
  email: string;
  department: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface ScoutStatus {
  verification_status: "pending" | "approved" | "rejected";
}

export default function UserProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [scoutStatus, setScoutStatus] = useState<ScoutStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errandsPostedCount, setErrandsPostedCount] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: profileRow }, { data: scoutRow }, { count }] = await Promise.all([
      supabase.from("profiles").select("full_name, email, department, avatar_url, created_at").eq("id", user.id).single(),
      supabase.from("scouts").select("verification_status").eq("profile_id", user.id).maybeSingle(),
      supabase.from("errands").select("id", { count: "exact", head: true }).eq("requester_id", user.id),
    ]);

    setProfile(profileRow ?? null);
    setScoutStatus(scoutRow ?? null);
    setErrandsPostedCount(count ?? 0);
    setLoading(false);
  }, []);

  const handleFocus = useCallback(() => { loadData(); }, [loadData]);
  useFocusEffect(handleFocus);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      channel = supabase
        .channel(`user-errands-count:${data.user.id}:${Math.random()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "errands", filter: `requester_id=eq.${data.user.id}` },
          () => loadData()
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadData]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
    router.replace("/login");
  }

  async function handleAvatarPress() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadAvatar(user.id);
      if (url) setProfile((current) => (current ? { ...current, avatar_url: url } : current));
    } catch (err) {
      Alert.alert("Couldn't upload photo", err instanceof Error ? err.message : "Try again.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleSwitchToScout() {
    router.replace("/(scout)/home");
  }

  function handleBecomeScout() {
    router.push("/(auth)/scout-registration");
  }

  function formatMemberSince(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }

  if (loading || !profile) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.avatarWrapper} onPress={handleAvatarPress} disabled={uploadingAvatar}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{profile.full_name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color={colors.deep} />
            ) : (
              <IconPencil size={11} color={colors.deep} strokeWidth={2} />
            )}
          </View>
        </Pressable>
        <Text style={styles.name}>{profile.full_name}</Text>
        <Text style={styles.subtext}>
          {profile.department ? `${profile.department} · ${profile.email}` : profile.email}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{errandsPostedCount ?? "—"}</Text>
          <Text style={styles.statLabel}>Errands posted</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.created_at ? formatMemberSince(profile.created_at) : "—"}</Text>
          <Text style={styles.statLabel}>Member since</Text>
        </View>
      </View>

      {scoutStatus?.verification_status === "pending" && (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingText}>
            Your Scout application is under review. This usually takes 24–48 hours.
          </Text>
        </View>
      )}

     <View style={{ marginBottom: 16 }}>
        {scoutStatus?.verification_status === "approved" && (
           <LinearGradient colors={[colors.primary, colors.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionRow}>
          <Pressable onPress={handleSwitchToScout} style={styles.actionRowInner}>
            <View style={styles.switchRowInner}>
            <IconRun size={18} color={colors.textSecondary} strokeWidth={1.75} />
            <Text style={styles.actionText}>
              Switch to Scout mode
            </Text>
            </View>
            <IconChevronRight size={18} color={colors.textSecondary} strokeWidth={1.75} />
          </Pressable>
        </LinearGradient>
        )}

        {!scoutStatus && (
          <LinearGradient 
          colors={[colors.primary, colors.deep]} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.actionRow}
          >
            <Pressable style={styles.becomeScoutCard} onPress={handleBecomeScout}>
              <IconRun size={20} color={colors.accent} strokeWidth={1.75} />
              <View style={styles.becomeScoutTextBlock}>
                <Text style={styles.becomeScoutTitle}>Want to earn on Gopher?</Text>
                <Text style={styles.becomeScoutSubtitle}>Become a scout</Text>
              </View>
              <IconChevronRight size={16} color={colors.accent} strokeWidth={1.75} />
            </Pressable>
          </LinearGradient>
        )}
      </View>

      <Text style={styles.sectionLabel}>Account</Text>
      <SettingsRow icon={IconUserPlus} label="Edit profile" onPress={() => router.push("/edit-profile")} />
      <SettingsRow icon={IconCreditCard} label="Payment history" onPress={() => router.push("/(user)/payment-history")} />
      <SettingsRow icon={IconPhone} label="Phone reveal preference" onPress={() => router.push("/(user)/phone-preference")} showDivider={false} />

      <Text style={styles.sectionLabel}>Support</Text>
      <SettingsRow icon={IconBell} label="Notifications" onPress={() => router.push("/(user)/notifications")} />
      <SettingsRow icon={IconHelpCircle} label="Help & support" onPress={() => router.push("/(user)/help-support")} showDivider={false} />

      <Pressable style={styles.signOutButton} onPress={handleSignOut} disabled={signingOut}>
        <IconLogout size={18} color={colors.error} strokeWidth={1.75} />
        <Text style={styles.signOutText}>{signingOut ? "Signing out..." : "Sign out"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 20, paddingTop: 76, paddingBottom: 160 },
  centeredContainer: { flex: 1, backgroundColor: colors.surfaceBase, alignItems: "center", justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 28 },
  avatarWrapper: { position: "relative", marginBottom: 14 },
  avatarCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 84, height: 84, borderRadius: 42 },
  avatarInitial: { fontFamily: fonts.headingBold, fontSize: 26, color: colors.accent },
  editBadge: {
    position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.accent, borderWidth: 3, borderColor: colors.surfaceBase,
    alignItems: "center", justifyContent: "center",
  },
  name: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.textPrimary, marginBottom: 4 },
  subtext: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, textAlign: "center" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  statBox: { flex: 1, backgroundColor: colors.surfaceRaised, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  statValue: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.textPrimary },
  statLabel: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted, marginTop: 4 },
  actionRow: {
    borderRadius: 14,
  },
  actionText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  pendingCard: { backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 16, marginBottom: 28 },
  pendingText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textSecondary, textAlign: "center" },
  becomeScoutCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, padding: 14,
  },
  actionRowInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  switchRowInner: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },
  becomeScoutTextBlock: { flex: 1 },
  becomeScoutTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: "#fff", marginBottom: 2 },
  becomeScoutSubtitle: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.accent },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginTop: 12,
  },
  signOutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, marginTop: 28 },
  signOutText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.error, marginLeft: 8 },
});