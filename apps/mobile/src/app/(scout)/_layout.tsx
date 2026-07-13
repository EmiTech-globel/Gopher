import { Tabs } from "expo-router";
import { IconHome, IconSearch, IconWallet, IconUser } from "@tabler/icons-react-native";
import { FloatingTabBar } from "../../components/navigation/FloatingTabBar";

const scoutTabIcons = {
  home: IconHome,
  browse: IconSearch,
  earnings: IconWallet,
  profile: IconUser,
};

export default function ScoutTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} icons={scoutTabIcons} />}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="browse" options={{ title: "Browse" }} />
      <Tabs.Screen name="earnings" options={{ title: "Earnings" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}