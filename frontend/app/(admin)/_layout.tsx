import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { colors } from "@/src/theme";

function Icon({ label, focused }: { label: string; focused: boolean }) {
  return <View style={{ alignItems: "center" }}><Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{label}</Text></View>;
}

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.brandPrimary,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.divider, height: 64, paddingTop: 6, paddingBottom: 8 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
    }}>
      <Tabs.Screen name="overview" options={{ title: "Overview", tabBarIcon: ({ focused }) => <Icon label="📊" focused={focused} /> }} />
      <Tabs.Screen name="users" options={{ title: "Users", tabBarIcon: ({ focused }) => <Icon label="👥" focused={focused} /> }} />
      <Tabs.Screen name="shops" options={{ title: "Shops", tabBarIcon: ({ focused }) => <Icon label="🏪" focused={focused} /> }} />
      <Tabs.Screen name="products" options={{ title: "Products", tabBarIcon: ({ focused }) => <Icon label="💐" focused={focused} /> }} />
    </Tabs>
  );
}
