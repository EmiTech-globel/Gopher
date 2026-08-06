import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, Image } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  IconPencil, IconLogout, IconStar, IconBuildingBank, IconCircleCheckFilled,
  IconShieldStar, IconUserPlus, IconFileText, IconBell, IconHelpCircle, IconChevronRight,
  IconUser,
} from "@tabler/icons-react-native";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";
import { SettingsRow } from "../../../components/SettingsRow";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { AlertDialog } from "../../../components/AlertDialog";
import { useAlertDialog } from "../../../lib/useAlertDialog";
import { pickAndUploadAvatar } from "../../../lib/uploadAvatar";

interface ProfileData {
  full_name: string;
  email: string;
  department: string | null;
  avatar_url: string | null;
}

interface ScoutStats {
  trust_tier: "new" | "trusted" | null;
  completed_errands_count: number | null;
  rating_count: number | null;
  rating_avg: number | null;
}

interface ScoutPrivate {
  verification_status: "pending" | "approved" | "rejected";
  bank_account_details: unknown;
}

export default function ScoutProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ScoutStats | null>(null);
  const [privateData, setPrivateData] = useState<ScoutPrivate | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutConfirmVisible, setSignOutConfirmVisible] = useState(false);
  const { showAlert, alertDialogProps } = useAlertDialog();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // public_scouts is a live-computed view (see migration 00006) — it
    // recalculates completed count and rating from source tables on
    // every query, so there's nothing to drift out of sync. Verification
    // status and bank details stay in the real `scouts` table, since
    // they're intentionally excluded from that public view.
    const [{ data: profileRow }, { data: statsRow }, { data: privateRow }] = await Promise.all([
      supabase.from("profiles").select("full_name, email, department, avatar_url").eq("id", user.id).single(),
      supabase
        .from("public_scouts")
        .select("trust_tier, completed_errands_count, rating_count, rating_avg")
        .eq("profile_id", user.id)
        .single(),
      supabase.from("scouts").select("verification_status, bank_account_details").eq("profile_id", user.id).single(),
    ]);

    setProfile(profileRow ?? null);
    setStats(statsRow ?? null);
    setPrivateData(privateRow ?? null);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Live push while the screen is open. The view has nothing to cache,
  // so any change to the source tables just needs a re-fetch to reflect.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      channel = supabase
        .channel(`scout-profile-live:${data.user.id}:${Math.random()}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "errands", filter: `scout_id=eq.${data.user.id}` },
          () => loadData()
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "ratings", filter: `rated_user_id=eq.${data.user.id}` },
          () => loadData()
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "scouts", filter: `profile_id=eq.${data.user.id}` },
          () => loadData()
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadData]);

  async function handleSignOut() {
    setSignOutConfirmVisible(false);
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
      showAlert("Couldn't upload photo", err instanceof Error ? err.message : "Try again.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleSwitchToUser() {
    router.replace("/(user)/home");
  }

  function handleBankSetup() {
    router.push("/(scout)/bank-setup");
  }

  if (loading || !profile || !stats || !privateData) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const trustLabel = stats.trust_tier === "trusted" ? "Trusted scout" : "New scout";
  const hasBankDetails = privateData.bank_account_details != null;
  const isVerified = privateData.verification_status === "approved";

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
        <View style={styles.tierBadge}>
          <IconShieldStar size={13} color={colors.accent} strokeWidth={1.75} />
          <Text style={styles.tierBadgeText}>{trustLabel}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <View style={styles.ratingRow}>
            <IconStar size={14} color={colors.warning} strokeWidth={2} />
            <Text style={styles.statValue}>
              {stats.rating_avg != null ? stats.rating_avg.toFixed(1) : "New"}
            </Text>
          </View>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.completed_errands_count ?? 0}</Text>
          <Text style={styles.statLabel}>Errands</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>—</Text>
          <Text style={styles.statLabel}>Disputes</Text>
        </View>
      </View>

      {isVerified ? (
        <View style={styles.verifiedBanner}>
          <IconCircleCheckFilled size={16} color={colors.success} strokeWidth={1.75} />
          <Text style={styles.verifiedText}>Verified scout · identity confirmed</Text>
        </View>
      ) : (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingText}>
            {privateData.verification_status === "pending"
              ? "Your Scout application is under review. This usually takes 24–48 hours."
              : "Your Scout application was not approved. Check your verification status for details."}
          </Text>
        </View>
      )}

      <View style={{ marginBottom: 12 }}>
        <LinearGradient colors={[colors.primary, colors.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionRow}>
          <Pressable onPress={handleSwitchToUser} style={styles.actionRowInner}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <IconUser size={18} color={colors.textSecondary} strokeWidth={1.75} />
              <Text style={styles.actionText}>Switch to User mode</Text>
            </View>
            <IconChevronRight size={18} color={colors.textSecondary} strokeWidth={1.75} />
          </Pressable>
        </LinearGradient>
      </View>

      <Text style={styles.sectionLabel}>Payouts</Text>
      <SettingsRow
        icon={IconBuildingBank}
        label={hasBankDetails ? "Bank account details" : "Add bank account for payouts"}
        onPress={handleBankSetup}
      />
      <SettingsRow icon={IconFileText} label="Payment history" onPress={() => router.push("/(scout)/payout-history")} showDivider={false} />

      <Text style={styles.sectionLabel}>Account</Text>
      <SettingsRow icon={IconUserPlus} label="Edit profile" onPress={() => router.push("/edit-profile")} />
      <SettingsRow icon={IconBell} label="Notifications" onPress={() => router.push("/(scout)/notification")} showDivider={false} />

      <Text style={styles.sectionLabel}>Support</Text>
      <SettingsRow icon={IconHelpCircle} label="Help & support" onPress={() => router.push("/(scout)/help-support")} showDivider={false} />

      <Pressable style={styles.signOutButton} onPress={() => setSignOutConfirmVisible(true)} disabled={signingOut}>
        <IconLogout size={18} color={colors.error} strokeWidth={1.75} />
        <Text style={styles.signOutText}>{signingOut ? "Signing out..." : "Sign out"}</Text>
      </Pressable>

      <ConfirmDialog
        visible={signOutConfirmVisible}
        title="Sign out?"
        message="You'll need to log back in to browse or manage errands."
        confirmLabel="Sign out"
        onConfirm={handleSignOut}
        onCancel={() => setSignOutConfirmVisible(false)}
      />

      <AlertDialog {...alertDialogProps} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 20, paddingTop: 76, paddingBottom: 160 },
  centeredContainer: { flex: 1, backgroundColor: colors.surfaceBase, alignItems: "center", justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 28 },
  avatarWrapper: { position: "relative", marginBottom: 14 },
  avatarCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: "#89536E", alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 84, height: 84, borderRadius: 42 },
  avatarInitial: { fontFamily: fonts.headingBold, fontSize: 26, color: colors.accent },
  editBadge: {
    position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.accent, borderWidth: 3, borderColor: colors.surfaceBase,
    alignItems: "center", justifyContent: "center",
  },
  name: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.textPrimary, marginBottom: 4 },
  subtext: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, textAlign: "center", marginBottom: 12 },
  tierBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.deep, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12,
  },
  tierBadgeText: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.accent },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  statBox: { flex: 1, backgroundColor: colors.surfaceRaised, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  statValue: { fontFamily: fonts.headingBold, fontSize: 16, color: colors.textPrimary },
  statLabel: { fontFamily: fonts.bodyRegular, fontSize: 10, color: colors.textMuted, marginTop: 4 },
  verifiedBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(22,163,74,0.13)", borderRadius: 14, padding: 12, marginBottom: 28,
  },
  verifiedText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.success },
  pendingCard: { backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 16, marginBottom: 28 },
  pendingText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textSecondary, textAlign: "center" },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginTop: 12,
  },
  actionRow: { borderRadius: 14 },
  actionRowInner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16,
  },
  actionText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  signOutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, marginTop: 24 },
  signOutText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.error, marginLeft: 8 },
});