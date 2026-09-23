import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

export default function OwnerProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: shop } = useQuery({ queryKey: ["my-shop"], queryFn: () => api("/shops/mine") });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Image source={{ uri: shop?.image }} style={styles.shopImg} contentFit="cover" />
          <Text style={styles.shopName}>{shop?.shop_name}</Text>
          <Text style={styles.shopMeta}>📍 {shop?.location}</Text>
          <Text style={styles.shopMeta}>👤 {user?.name} · {user?.email}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>FLOWER SHOP OWNER</Text></View>
        </View>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Text style={styles.section}>About</Text>
          <Text style={styles.desc}>{shop?.description}</Text>
          <Text style={styles.section}>Contact</Text>
          <Text style={styles.desc}>{shop?.contact || "No contact info yet"}</Text>

          <Pressable testID="logout-btn" onPress={async () => { await logout(); router.replace("/"); }} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", padding: spacing.lg, gap: 4, backgroundColor: colors.brandTertiary },
  shopImg: { width: 96, height: 96, borderRadius: 48, marginBottom: spacing.sm },
  shopName: { fontSize: 24, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  shopMeta: { color: colors.onSurfaceSecondary, fontSize: 12 },
  badge: { backgroundColor: colors.brandPrimary, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, marginTop: spacing.sm },
  badgeText: { color: colors.onBrandPrimary, fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  section: { fontSize: 14, fontWeight: "700", color: colors.onSurface, marginTop: spacing.sm },
  desc: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 20 },
  logoutBtn: { marginTop: spacing.xl, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.error, alignItems: "center" },
  logoutText: { color: colors.error, fontWeight: "700" },
});
