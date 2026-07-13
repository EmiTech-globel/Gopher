import { Tabs, router } from "expo-router";
import {
  IconHome,
  IconListCheck,
  IconMessageCircle,
  IconUser,
  IconPlus,
} from "@tabler/icons-react-native";
import { FloatingTabBar } from "../../components/navigation/FloatingTabBar";

const userTabIcons = {
  home: IconHome,
  errands: IconListCheck,
  chat: IconMessageCircle,
  profile: IconUser,
};

export default function UserTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <FloatingTabBar
          {...props}
          icons={userTabIcons}
          centerAction={{
            icon: IconPlus,
            onPress: () => router.push("/(user)/post-errand"),
          }}
        />
      )}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="errands" options={{ title: "Errands" }} />
      <Tabs.Screen name="chat" options={{ title: "Chat" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="post-errand" options={{ href: null }} />
    </Tabs>
  );
}