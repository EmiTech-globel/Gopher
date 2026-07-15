import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { IconMinus, IconPlus } from "@tabler/icons-react-native";
import { AuthTextInput, ErrorText } from "../../components/auth";
import { BuildingPicker } from "../../components/BuildingPicker";
import { getSuggestedDeliveryFee } from "../../data/campus-zones";
import { calculateProcessingFee } from "../../lib/paystack-fees";
import { initiateErrandPayment } from "../../lib/paystack";
import { colors, fonts } from "../../theme";

const FEE_BUMP_INCREMENT = 50;

export default function PostErrandScreen() {
  const [itemDescription, setItemDescription] = useState("");
  const [pickupLocation, setPickupLocation] = useState<string | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<string | null>(null);
  const [itemBudget, setItemBudget] = useState("");
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const suggestedFee = useMemo(() => {
    if (!pickupLocation || !dropoffLocation) return null;
    return getSuggestedDeliveryFee(pickupLocation, dropoffLocation);
  }, [pickupLocation, dropoffLocation]);

  useEffect(() => {
    setDeliveryFee(suggestedFee);
  }, [suggestedFee]);

  const parsedBudget = parseFloat(itemBudget) || 0;
  const effectiveFee = deliveryFee ?? 0;
  const subtotal = parsedBudget + effectiveFee;
  const processingFee = calculateProcessingFee(subtotal);
  const total = subtotal + processingFee;

  function bumpFee(delta: number) {
    if (suggestedFee == null) return;
    setDeliveryFee((current) => {
      const next = (current ?? suggestedFee) + delta;
      return Math.max(next, suggestedFee);
    });
  }

  async function handlePost() {
    setErrorMessage(null);

    if (!itemDescription.trim()) {
      setErrorMessage("Describe what you need.");
      return;
    }
    if (!pickupLocation || !dropoffLocation) {
      setErrorMessage("Select both a pickup and dropoff location.");
      return;
    }
    if (parsedBudget <= 0) {
      setErrorMessage("Enter a valid item budget.");
      return;
    }
    if (deliveryFee == null) {
      setErrorMessage("Delivery fee couldn't be calculated. Try re-selecting locations.");
      return;
    }

    setSubmitting(true);
    try {
      await initiateErrandPayment({
        item_description: itemDescription.trim(),
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        item_budget: parsedBudget,
        delivery_fee: deliveryFee,
      });
      // The errand row is created by the Paystack webhook, not here —
      // this only hands off to checkout. Home's useFocusEffect will
      // pick up the new errand once payment actually succeeds.
      router.replace("/(user)/home");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't start payment. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Post an errand</Text>
      <Text style={styles.subtitle}>Tell us what you need and where it's going.</Text>

      <AuthTextInput
        label="What do you need?"
        placeholder="e.g. 2 packs of Indomie and a bottle of Coke"
        value={itemDescription}
        onChangeText={setItemDescription}
        multiline
      />

      <BuildingPicker label="Pickup location" value={pickupLocation} onSelect={setPickupLocation} />
      <BuildingPicker label="Dropoff location" value={dropoffLocation} onSelect={setDropoffLocation} />

      <AuthTextInput
        label="Item budget (₦)"
        placeholder="e.g. 1200"
        keyboardType="numeric"
        value={itemBudget}
        onChangeText={setItemBudget}
      />

      {suggestedFee != null && (
        <View style={styles.feeField}>
          <Text style={styles.label}>Delivery fee (₦)</Text>
          <View style={styles.feeRow}>
            <Pressable
              style={[styles.feeButton, effectiveFee <= suggestedFee && styles.feeButtonDisabled]}
              onPress={() => bumpFee(-FEE_BUMP_INCREMENT)}
              disabled={effectiveFee <= suggestedFee}
            >
              <IconMinus size={16} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
            <Text style={styles.feeValue}>₦{effectiveFee.toLocaleString()}</Text>
            <Pressable style={styles.feeButton} onPress={() => bumpFee(FEE_BUMP_INCREMENT)}>
              <IconPlus size={16} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>
          <Text style={styles.feeHint}>
            Bump up the fee for faster acceptance.
          </Text>
        </View>
      )}

      {parsedBudget > 0 && effectiveFee > 0 && (
        <View style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Item budget</Text>
            <Text style={styles.breakdownValue}>₦{parsedBudget.toLocaleString()}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Delivery fee</Text>
            <Text style={styles.breakdownValue}>₦{effectiveFee.toLocaleString()}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Processing fee</Text>
            <Text style={styles.breakdownValue}>
              {processingFee > 0 ? `₦${processingFee.toLocaleString()}` : "Waived"}
            </Text>
          </View>
          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₦{total.toLocaleString()}</Text>
          </View>
        </View>
      )}

      <ErrorText message={errorMessage} />

      <Pressable
        style={[styles.payButton, submitting && styles.payButtonDisabled]}
        onPress={handlePost}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.payButtonText}>Pay and post</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 175 },
  title: { fontFamily: fonts.headingBold, fontSize: 24, color: colors.textPrimary, marginBottom: 4 },
  subtitle: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  label: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.textSecondary, marginBottom: 6 },
  feeField: { marginBottom: 16 },
  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  feeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: "center", justifyContent: "center" },
  feeButtonDisabled: { opacity: 0.4 },
  feeValue: { fontFamily: fonts.headingMedium, fontSize: 18, color: colors.textPrimary },
  feeHint: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textSecondary, opacity: 0.8, marginTop: 6 },
  breakdown: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 16, marginBottom: 24 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  breakdownLabel: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textSecondary },
  breakdownValue: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary },
  totalRow: { marginTop: 4, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceElevated, marginBottom: 0 },
  totalLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary },
  totalValue: { fontFamily: fonts.headingBold, fontSize: 16, color: colors.accent },
  payButton: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.primary },
});