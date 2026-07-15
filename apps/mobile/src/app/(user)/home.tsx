import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { IconPlus, IconMapPin } from "@tabler/icons-react-native";
import { supabase } from "../../lib/supabase";
import { colors, fonts } from "../../theme";
import { LinearGradient } from "expo-linear-gradient";

const ACTIVE_STATUSES = ["open", "accepted", "purchased", "delivered", "disputed"];

interface ErrandRow {
  id: string;
  item_description: string;
  dropoff_location: string;
  status: string;
  delivery_fee: number;
  created_at: string;
}

export default function UserHomeScreen() {
  const [fullName, setFullName] = useState<string | null>(null);
  const [activeErrand, setActiveErrand] = useState<ErrandRow | null>(null);
  const [history, setHistory] = useState<ErrandRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [{ data: profile }, { data: errands }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase
        .from("errands")
        .select("id, item_description, dropoff_location, status, delivery_fee, created_at")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setFullName(profile?.full_name ?? null);

    const active = errands?.find((e) => ACTIVE_STATUSES.includes(e.status)) ?? null;
    const pastErrands = (errands ?? [])
      .filter((e) => !ACTIVE_STATUSES.includes(e.status))
      .slice(0, 5);

    setActiveErrand(active);
    setHistory(pastErrands);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const firstName = fullName?.split(" ")[0] ?? "there";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} tintColor={colors.accent} />
      }
    >
      <Text style={styles.greeting}>Hey {firstName}</Text>
      <Text style={styles.subtitle}>What do you need today?</Text>

      <Pressable onPress={() => router.push("/(user)/post-errand")}>
  <LinearGradient
    colors={[colors.deep, colors.primary]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.ctaCard}
  >
    <View>
      <Text style={styles.ctaTitle}>Post an errand</Text>
      <Text style={styles.ctaSubtitle}>Get anything delivered on campus</Text>
    </View>
    <View style={styles.ctaIconCircle}>
      <IconPlus size={22} color={colors.primary} strokeWidth={2.25} />
    </View>
  </LinearGradient>
</Pressable>

      <Text style={styles.sectionTitle}>Active errand</Text>
      {activeErrand ? (
        <View style={styles.errandCard}>
          <Text style={styles.errandItem}>{activeErrand.item_description}</Text>
          <View style={styles.errandMetaRow}>
            <IconMapPin size={14} color={colors.textSecondary} strokeWidth={1.75} />
            <Text style={styles.errandMeta}>{activeErrand.dropoff_location}</Text>
          </View>
          <Text style={styles.errandStatus}>{formatStatus(activeErrand.status)}</Text>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active errand right now.</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent history</Text>
      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Your completed errands will show up here.</Text>
        </View>
      ) : (
        history.map((errand) => (
          <View key={errand.id} style={styles.historyRow}>
            <Text style={styles.historyItem}>{errand.item_description}</Text>
            <Text style={styles.historyStatus}>{formatStatus(errand.status)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 140 },
  greeting: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textSecondary,
    marginBottom: 24,
  },
 ctaCard: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  borderRadius: 20,
  height: 150,
  padding: 20,
  marginBottom: 32,
},
ctaTitle: {
  fontFamily: fonts.headingBold,
  fontSize: 18,
  color: colors.textPrimary,
  marginBottom: 4,
},
ctaSubtitle: {
  fontFamily: fonts.bodyRegular,
  fontSize: 13,
  color: colors.textPrimary,
  opacity: 0.75,
},
ctaIconCircle: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: colors.accent,
  alignItems: "center",
  justifyContent: "center",
},
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.headingMedium,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  errandCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    padding: 16,
    marginBottom: 32,
  },
  errandItem: {
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: 6,
  },
  errandMetaRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  errandMeta: {
    fontFamily: fonts.bodyRegular,
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 6,
  },
  errandStatus: { fontFamily: fonts.bodyMedium, color: colors.accent, fontSize: 13 },
  emptyCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    padding: 20,
    marginBottom: 32,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: fonts.bodyRegular,
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  historyItem: { fontFamily: fonts.bodyRegular, color: colors.textPrimary, fontSize: 14 },
  historyStatus: { fontFamily: fonts.bodyMedium, color: colors.textSecondary, fontSize: 13 },
});