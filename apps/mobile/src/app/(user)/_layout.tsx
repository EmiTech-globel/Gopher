import { Stack } from "expo-router";

/**
 * The User area is a headerless Stack sitting above the tab bar.
 *
 * Detail screens reached from a tab (payment-history, phone-preference,
 * notifications, help-support, post-errand, errand/[id]) push onto this
 * Stack so router.back() returns to the screen that opened them (e.g.
 * Profile), instead of falling through to the tab navigator's initial
 * route (Home). Route groups are URL-transparent, so all existing
 * absolute paths like /(user)/home still resolve unchanged.
 */
export default function UserLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
