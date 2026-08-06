import { useEffect, useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, Modal, FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { IconArrowLeft, IconChevronDown, IconCheck, IconSearch } from "@tabler/icons-react-native";
import { supabase } from "../../lib/supabase";
import { fetchBanks, resolveAccount, createTransferRecipient, type Bank } from "../../lib/bankSetup";
import { AlertDialog } from "../../components/AlertDialog";
import { useAlertDialog } from "../../lib/useAlertDialog";
import { colors, fonts } from "../../theme";

export default function BankSetupScreen() {
  const insets = useSafeAreaInsets();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingDetails, setExistingDetails] = useState<{ bank_name: string; account_number: string; account_name: string } | null>(null);
  const { showAlert, alertDialogProps } = useAlertDialog();

  useEffect(() => {
    async function load() {
      try {
        const [banksList] = await Promise.all([fetchBanks()]);
        setBanks(banksList);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Couldn't load banks");
      } finally {
        setLoadingBanks(false);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("scouts").select("bank_account_details").eq("profile_id", user.id).single();
      if (data?.bank_account_details) {
        setExistingDetails(data.bank_account_details as { bank_name: string; account_number: string; account_name: string });
      }
    }
    load();
  }, []);

  const filteredBanks = banks.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()));

  function handleSelectBank(bank: Bank) {
    setSelectedBank(bank);
    setResolvedName(null);
    setBankPickerVisible(false);
    setBankSearch("");
  }

  async function handleResolve() {
    if (!selectedBank || accountNumber.length !== 10) {
      setErrorMessage("Select a bank and enter a valid 10-digit account number.");
      return;
    }
    setErrorMessage(null);
    setResolving(true);
    try {
      const result = await resolveAccount(accountNumber, selectedBank.code);
      setResolvedName(result.account_name);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't verify account");
      setResolvedName(null);
    } finally {
      setResolving(false);
    }
  }

  async function handleSave() {
    if (!selectedBank || !resolvedName) {
      setErrorMessage("Verify the account before saving.");
      return;
    }
    setErrorMessage(null);
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expired. Please log in again.");

      // Bank details are saved unconditionally — this is the source of
      // truth for "does this scout have payout info on file". Recipient
      // creation with Paystack is attempted separately and may fail if
      // Transfers aren't available on the current account tier; that
      // failure doesn't block saving the bank details themselves.
      //
      // .select().single() confirms the row actually changed — without
      // it, a silently-blocked write (e.g. RLS or a bad filter) would
      // still report error: null, and we'd navigate back believing it
      // worked when nothing was persisted.
      const { data: updatedRow, error: updateError } = await supabase
        .from("scouts")
        .update({
          bank_account_details: {
            bank_name: selectedBank.name,
            bank_code: selectedBank.code,
            account_number: accountNumber,
            account_name: resolvedName,
          },
        })
        .eq("profile_id", user.id)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);
      if (!updatedRow) throw new Error("Save didn't apply — please try again.");

      try {
        const recipientResult = await createTransferRecipient(accountNumber, selectedBank.code, resolvedName);
        if (!recipientResult.recipient_code) {
          showAlert(
            "Bank details saved",
            "Your bank details are on file. Automated payouts aren't available on this account yet, but your details are ready for when they are."
          );
        }
      } catch {
        // Recipient creation failing entirely shouldn't block the save
        // confirmation — bank details already succeeded above.
      }

      // Navigate explicitly to profile so the tab state is correct and
      // the profile's focus refresh logic can re-fetch the latest bank details.
      router.replace("/(scout)/profile");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't save bank details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
  <Pressable onPress={() => router.back()}>
    <IconArrowLeft size={28} color={colors.textSecondary} strokeWidth={1.75} />
  </Pressable>
  <Text style={styles.headerTitle}>Bank setup</Text>
  <View style={{ width: 20 }} />
</View>

      {existingDetails && (
        <View style={styles.existingCard}>
          <Text style={styles.existingLabel}>Currently on file</Text>
          <Text style={styles.existingText}>{existingDetails.account_name}</Text>
          <Text style={styles.existingSubtext}>
            {existingDetails.bank_name} · •••• {existingDetails.account_number.slice(-4)}
          </Text>
        </View>
      )}

      <Text style={styles.label}>Bank</Text>
      <Pressable style={styles.input} onPress={() => setBankPickerVisible(true)}>
        <Text style={selectedBank ? styles.inputText : styles.inputPlaceholder}>
          {selectedBank ? selectedBank.name : "Select your bank"}
        </Text>
        <IconChevronDown size={16} color={colors.textMuted} strokeWidth={1.75} />
      </Pressable>

      <Text style={styles.label}>Account number</Text>
      <TextInput
        style={styles.textInput}
        value={accountNumber}
        onChangeText={(text) => { setAccountNumber(text.replace(/\D/g, "").slice(0, 10)); setResolvedName(null); }}
        placeholder="10-digit account number"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        maxLength={10}
      />

      {resolvedName ? (
        <View style={styles.resolvedCard}>
          <IconCheck size={16} color={colors.success} strokeWidth={2} />
          <Text style={styles.resolvedText}>{resolvedName}</Text>
        </View>
      ) : (
        <Pressable style={styles.verifyButton} onPress={handleResolve} disabled={resolving}>
          {resolving ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.verifyButtonText}>Verify account</Text>
          )}
        </Pressable>
      )}

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <Pressable
        style={[styles.saveButton, (!resolvedName || saving) && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!resolvedName || saving}
      >
        {saving ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.saveButtonText}>Save bank details</Text>
        )}
      </Pressable>

      <Modal visible={bankPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select bank</Text>
            <View style={styles.searchRow}>
              <IconSearch size={16} color={colors.textMuted} strokeWidth={1.75} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search banks"
                placeholderTextColor={colors.textMuted}
                value={bankSearch}
                onChangeText={setBankSearch}
                autoFocus
              />
            </View>
            {loadingBanks ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={filteredBanks}
                keyExtractor={(item) => item.code}
                style={{ maxHeight: 360 }}
                renderItem={({ item }) => (
                  <Pressable style={styles.bankRow} onPress={() => handleSelectBank(item)}>
                    <Text style={styles.bankRowText}>{item.name}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No banks match your search.</Text>}
              />
            )}
            <Pressable onPress={() => setBankPickerVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <AlertDialog {...alertDialogProps} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
 header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
headerTitle: { fontFamily: fonts.headingMedium, fontSize: 18, color: colors.textPrimary },
  existingCard: { backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 16, marginBottom: 24 },
  existingLabel: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  existingText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  existingSubtext: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  label: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.textSecondary, marginBottom: 8 },
  input: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surfaceRaised, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 18,
  },
  inputText: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textPrimary },
  inputPlaceholder: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textMuted },
  textInput: {
    backgroundColor: colors.surfaceRaised, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: colors.textPrimary, fontFamily: fonts.bodyRegular, fontSize: 14, marginBottom: 12,
  },
  resolvedCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(22,163,74,0.13)", borderRadius: 12, padding: 12, marginBottom: 18,
  },
  resolvedText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.success },
  verifyButton: { alignItems: "center", paddingVertical: 12, marginBottom: 18 },
  verifyButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accent },
  errorText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.error, marginBottom: 12 },
  saveButton: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.primary },
  modalOverlay: { flex: 1, backgroundColor: "#00000080", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.surfaceBase, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, maxHeight: "80%",
  },
  modalTitle: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.textPrimary, marginBottom: 16 },
  searchRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceRaised,
    borderRadius: 12, paddingHorizontal: 14, marginBottom: 12,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: fonts.bodyRegular, fontSize: 15, paddingVertical: 12, marginLeft: 8 },
  bankRow: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.surfaceElevated },
  bankRowText: { color: colors.textPrimary, fontFamily: fonts.bodyRegular, fontSize: 15 },
  emptyText: { color: colors.textMuted, fontFamily: fonts.bodyRegular, fontSize: 14, textAlign: "center", marginTop: 24 },
  cancelText: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 12 },
});