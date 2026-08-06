import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator, Image } from "react-native";
import { router } from "expo-router";
import { IconArrowLeft, IconPencil, IconUser, IconPhone, IconBuilding } from "@tabler/icons-react-native";
import { supabase } from "../lib/supabase";
import { pickAndUploadAvatar } from "../lib/uploadAvatar";
import { AlertDialog } from "../components/AlertDialog";
import { useAlertDialog } from "../lib/useAlertDialog";
import { colors, fonts } from "../theme";

export default function EditProfileScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { showAlert, alertDialogProps } = useAlertDialog();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, department, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setDepartment(data.department ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleAvatarPress() {
    if (!userId) return;
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadAvatar(userId);
      if (url) setAvatarUrl(url);
    } catch (err) {
      showAlert("Couldn't upload photo", err instanceof Error ? err.message : "Try again.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!userId) return;
    if (!fullName.trim()) {
      showAlert("Name required", "Please enter your full name.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        department: department.trim() || null,
      })
      .eq("id", userId);
    setSaving(false);

    if (error) {
      showAlert("Couldn't save", error.message);
      return;
    }
    router.back();
  }

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <IconArrowLeft size={28} color={colors.textSecondary} strokeWidth={1.75} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <View style={{ width: 20 }} />
      </View>

      <Pressable style={styles.avatarWrapper} onPress={handleAvatarPress} disabled={uploadingAvatar}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{fullName.charAt(0).toUpperCase() || "?"}</Text>
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

      <View style={styles.labelRow}>
        <IconUser size={14} color={colors.textMuted} strokeWidth={1.75} />
        <Text style={styles.label}>Full name</Text>
      </View>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Your full name"
        placeholderTextColor={colors.textSecondary + "80"}
      />

      <View style={styles.labelRow}>
        <IconPhone size={14} color={colors.textMuted} strokeWidth={1.75} />
        <Text style={styles.label}>Phone number</Text>
      </View>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Your phone number"
        placeholderTextColor={colors.textSecondary + "80"}
        keyboardType="phone-pad"
      />

      <View style={styles.labelRow}>
        <IconBuilding size={14} color={colors.textMuted} strokeWidth={1.75} />
        <Text style={styles.label}>Department</Text>
      </View>
      <TextInput
        style={styles.input}
        value={department}
        onChangeText={setDepartment}
        placeholder="Your department"
        placeholderTextColor={colors.textSecondary + "80"}
      />

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.saveButtonText}>Save changes</Text>
        )}
      </Pressable>

      <AlertDialog {...alertDialogProps} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  centeredContainer: { flex: 1, backgroundColor: colors.surfaceBase, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 60 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  headerTitle: { fontFamily: fonts.headingMedium, fontSize: 18, color: colors.textPrimary },
  avatarWrapper: { position: "relative", alignSelf: "center", marginBottom: 28 },
  avatarCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 84, height: 84, borderRadius: 42 },
  avatarInitial: { fontFamily: fonts.headingBold, fontSize: 26, color: colors.accent },
  editBadge: {
    position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.accent, borderWidth: 3, borderColor: colors.surfaceBase,
    alignItems: "center", justifyContent: "center",
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  label: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.textSecondary },
  input: {
    backgroundColor: colors.surfaceRaised, color: colors.textPrimary, fontFamily: fonts.bodyRegular,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 18,
  },
  saveButton: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  saveButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.primary },
});