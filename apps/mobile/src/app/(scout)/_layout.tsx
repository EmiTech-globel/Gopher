import { Stack } from "expo-router";

/**
 * The Scout area is a headerless Stack sitting above the tab bar.
 *
 * Detail screens reached from a tab (bank-setup, payout-history,
 * notification, help-support, errand/[id], proof-of-purchase,
 * request-funds, chat/[errandId]) push onto this Stack so router.back()
 * returns to the screen that opened them (e.g. Profile), instead of
 * falling through to the tab navigator's initial route (Home). Route
 * groups are URL-transparent, so all existing absolute paths like
 * /(scout)/home still resolve unchanged.
 */
export default function ScoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
