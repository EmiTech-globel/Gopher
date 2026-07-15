import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList, TextInput, StyleSheet } from "react-native";
import { IconChevronDown, IconX, IconSearch } from "@tabler/icons-react-native";
import { campusBuildings } from "../data/campus-zones";
import { colors, fonts } from "../theme";

interface BuildingPickerProps {
  label: string;
  value: string | null;
  onSelect: (name: string) => void;
}

export function BuildingPicker({ label, value, onSelect }: BuildingPickerProps) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = campusBuildings.filter((b) =>
    b.name.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(name: string) {
    onSelect(name);
    setQuery("");
    setVisible(false);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setVisible(true)}>
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value ?? "Select a location"}
        </Text>
        <IconChevronDown size={18} color={colors.textSecondary} strokeWidth={1.75} />
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable onPress={() => setVisible(false)}>
                <IconX size={22} color={colors.textPrimary} strokeWidth={2} />
              </Pressable>
            </View>

            <View style={styles.searchRow}>
              <IconSearch size={16} color={colors.textSecondary} strokeWidth={1.75} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search buildings"
                placeholderTextColor={colors.textSecondary + "80"}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.name}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <Pressable style={styles.optionRow} onPress={() => handleSelect(item.name)}>
                  <Text style={styles.optionText}>{item.name}</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No buildings match your search.</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  valueText: { color: colors.textPrimary, fontFamily: fonts.bodyRegular, fontSize: 15 },
  placeholderText: { color: colors.textSecondary, opacity: 0.7, fontFamily: fonts.bodyRegular, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: "#00000080", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.surfaceBase,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.textPrimary },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: fonts.bodyRegular, fontSize: 15, paddingVertical: 12, marginLeft: 8 },
  optionRow: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.surfaceElevated },
  optionText: { color: colors.textPrimary, fontFamily: fonts.bodyRegular, fontSize: 15 },
  emptyText: { color: colors.textSecondary, fontFamily: fonts.bodyRegular, fontSize: 14, textAlign: "center", marginTop: 24 },
});