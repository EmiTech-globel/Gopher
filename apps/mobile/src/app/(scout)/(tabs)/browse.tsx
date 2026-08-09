import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { IconShoppingBag, IconMapPin, IconLock } from "@tabler/icons-react-native";
import { supabase } from "../../../lib/supabase";
import { AlertDialog } from "../../../components/AlertDialog";
import { useAlertDialog } from "../../../lib/useAlertDialog";
import { useActiveErrandCount } from "../../../lib/useActiveErrandCount";
import { usePlatformSettings } from "../../../lib/usePlatformSettings";
import { colors, fonts } from "../../../theme";

const MAX_ACTIVE_ERRANDS = 2;

interface OpenErrand {
  id: string;
  requester_id: string;
  item_description: string;
  pickup_location: string;
  dropoff_location: string;
  item_budget: number;
  delivery_fee: number;
  created_at: string;
}

export default function BrowseErrandsScreen() {
  const [errands, setErrands] = useState<OpenErrand[]>([]);
  const [trustTier, setTrustTier] = useState<"new" | "trusted">("new");
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const { showAlert, alertDialogProps } = useAlertDialog();
  const { count: activeErrandCount } = useActiveErrandCount();
  const { settings } = usePlatformSettings();
  const atCapacity = activeErrandCount >= MAX_ACTIVE_ERRANDS;

  const loadData = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [{ data: scout }, { data: openErrands }] = await Promise.all([
      supabase.from("scouts").select("trust_tier").eq("profile_id", user.id).single(),
      supabase
        .from("errands")
        .select("id, requester_id, item_description, pickup_location, dropoff_location, item_budget, delivery_fee, created_at")
        .eq("status", "open")
        .neq("requester_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setTrustTier(scout?.trust_tier ?? "new");
    setErrands(openErrands ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function handleAccept(errand: OpenErrand) {
    if (atCapacity) {
      showAlert("At capacity", `You already have ${MAX_ACTIVE_ERRANDS} active errands. Finish one before accepting another.`);
      return;
    }

    setAcceptingId(errand.id);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAcceptingId(null);
      return;
    }

    // .eq("status", "open") in the update condition guards against a race
    // where two scouts tap Accept at nearly the same time — whichever
    // request lands first flips status away from "open", so the second
    // update simply matches zero rows instead of double-assigning.
    const { data, error } = await supabase
      .from("errands")
      .update({ scout_id: user.id, status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", errand.id)
      .eq("status", "open")
      .select()
      .maybeSingle();

    setAcceptingId(null);

    if (error) {
      showAlert("Couldn't accept errand", error.message);
      return;
    }
    if (!data) {
      showAlert("Too late", "Another scout already accepted this errand.");
      loadData();
      return;
    }

    router.push(`/(scout)/errand/${errand.id}`);
  }

  const renderItem = ({ item }: { item: OpenErrand }) => {
    const total = item.item_budget + item.delivery_fee;
    const isLocked = trustTier === "new" && total > settings.newScoutValueCap;

    if (isLocked) {
      return (
        <View style={[styles.card, styles.cardLocked]}>
          <View style={styles.lockedOverlay}>
            <IconLock size={20} color={colors.textSecondary} strokeWidth={1.75} />
            <Text style={styles.lockedText}>Complete 3 errands to unlock higher-value errands</Text>
          </View>
        </View>
      );
    }

    return (
      <Pressable style={styles.card} onPress={() => router.push(`/(scout)/errand/${item.id}`)}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <IconShoppingBag size={18} color={colors.accent} strokeWidth={1.75} />
          </View>
          <Text style={styles.itemText} numberOfLines={2}>
            {item.item_description}
          </Text>
        </View>

        <View style={styles.routeRow}>
          <IconMapPin size={13} color={colors.textSecondary} strokeWidth={1.75} />
          <Text style={styles.routeText} numberOfLines={1}>
            {item.pickup_location} → {item.dropoff_location}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.footerLabel}>Item budget</Text>
            <Text style={styles.footerValue}>₦{item.item_budget.toLocaleString()}</Text>
          </View>
          <View>
            <Text style={styles.footerLabel}>Delivery fee</Text>
            <Text style={styles.footerValue}>₦{item.delivery_fee.toLocaleString()}</Text>
          </View>
          <Pressable
            style={[styles.acceptButton, atCapacity && styles.acceptButtonDisabled]}
            onPress={() => handleAccept(item)}
            disabled={acceptingId === item.id}
          >
            {acceptingId === item.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.acceptText, atCapacity && styles.acceptTextDisabled]}>Accept</Text>
            )}
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={errands}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} tintColor={colors.accent} />
        }
        ListHeaderComponent={<Text style={styles.title}>Open errands</Text>}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No open errands right now. Check back soon.</Text>
            </View>
          ) : null
        }
      />

      <AlertDialog {...alertDialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  listContent: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 140 },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: 22,
    marginBottom: 20, 
    color: colors.accentLight,
  },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardLocked: {
    opacity: 0.5,
  },
  lockedOverlay: {
    alignItems: "center",
    paddingVertical: 12,
  },
  lockedText: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  itemText: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  routeRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  routeText: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    flexShrink: 1,
  },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footerLabel: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textSecondary, opacity: 0.8 },
  footerValue: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary, marginTop: 2 },
  acceptButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  acceptButtonDisabled: { opacity: 0.4 },
  acceptText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
  acceptTextDisabled: { color: colors.textMuted },
  emptyState: { paddingTop: 60, alignItems: "center" },
  emptyText: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});