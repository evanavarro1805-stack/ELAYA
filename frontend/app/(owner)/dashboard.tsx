import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

const { width } = Dimensions.get("window");

export default function OwnerDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { data: shop } = useQuery({ queryKey: ["my-shop"], queryFn: () => api("/shops/mine") });
  const { data: products = [] } = useQuery({ queryKey: ["my-products"], queryFn: () => api("/owner/products") });
  const { data: orders = [] } = useQuery({ queryKey: ["owner-orders"], queryFn: () => api("/owner/orders"), refetchInterval: 8000 });

  const pending = orders.filter((o: any) => o.status === "pending").length;
  const completed = orders.filter((o: any) => o.status === "completed").length;
  const revenue = orders.filter((o: any) => o.status === "completed").reduce((s: number, o: any) => s + o.total, 0);

  const quicks = [
    { icon: "🌸", label: "Add Flower", to: "/(owner)/add-flower" as const },
    { icon: "💐", label: "Add Bouquet", to: "/(owner)/add-bouquet" as const },
    { icon: "🎀", label: "Add Wrapping", to: "/(owner)/add-wrapping" as const },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Image source={{ uri: shop?.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <LinearGradient colors={["rgba(43,30,34,0.6)", "rgba(43,30,34,0.9)"]} style={StyleSheet.absoluteFillObject} />
          <View style={styles.badge}><Text style={styles.badgeText}>FLOWER SHOP OWNER</Text></View>
          <Text style={styles.shopName}>{shop?.shop_name || "My Shop"}</Text>
          <Text style={styles.shopLoc}>📍 {shop?.location}</Text>
        </View>

        <View style={styles.metricGrid}>
          <View style={styles.metric}>
            <Text style={styles.metricNum}>{pending}</Text>
            <Text style={styles.metricLabel}>Pending</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricNum}>{products.length}</Text>
            <Text style={styles.metricLabel}>Products</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricNum}>{completed}</Text>
            <Text style={styles.metricLabel}>Completed</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricNum}>₱{revenue.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Revenue</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          {quicks.map((q) => (
            <Pressable key={q.label} testID={`quick-${q.label}`} onPress={() => router.push(q.to)} style={styles.quick}>
              <Text style={{ fontSize: 28 }}>{q.icon}</Text>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          {orders.slice(0, 5).map((o: any) => (
            <View key={o.id} style={styles.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderNo}>{o.order_no}</Text>
                <Text style={styles.orderCust}>{o.customer_name} · {o.items.length} items</Text>
              </View>
              <Text style={styles.orderPrice}>₱{o.total.toLocaleString()}</Text>
            </View>
          ))}
          {orders.length === 0 && <Text style={{ color: colors.muted, textAlign: "center" }}>No orders yet</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 220, padding: spacing.lg, overflow: "hidden", justifyContent: "flex-end", gap: 6 },
  badge: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.4)", borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  shopName: { color: "#FFFFFF", fontSize: 32, fontWeight: "300", fontStyle: "italic" },
  shopLoc: { color: "rgba(255,255,255,0.9)", fontSize: 13 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", padding: spacing.lg, gap: spacing.md },
  metric: { width: (width - spacing.lg * 2 - spacing.md) / 2, backgroundColor: colors.surfaceSecondary, padding: spacing.md, borderRadius: radius.md, gap: 4 },
  metricNum: { fontSize: 24, fontWeight: "700", color: colors.brandPrimary },
  metricLabel: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.onSurface, paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
  quickRow: { flexDirection: "row", paddingHorizontal: spacing.lg, gap: spacing.sm },
  quick: { flex: 1, padding: spacing.md, alignItems: "center", backgroundColor: colors.brandTertiary, borderRadius: radius.md, gap: 6 },
  quickLabel: { color: colors.onBrandTertiary, fontSize: 12, fontWeight: "700" },
  orderRow: { flexDirection: "row", alignItems: "center", padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md },
  orderNo: { fontWeight: "700", color: colors.onSurface, fontSize: 14 },
  orderCust: { color: colors.muted, fontSize: 12, marginTop: 2 },
  orderPrice: { color: colors.brandPrimary, fontWeight: "700", fontSize: 15 },
});
