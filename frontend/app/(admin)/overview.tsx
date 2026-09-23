import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

const { width } = Dimensions.get("window");

export default function AdminOverview() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: o } = useQuery({ queryKey: ["admin-overview"], queryFn: () => api("/admin/overview"), refetchInterval: 8000 });
  const { data: orders = [] } = useQuery({ queryKey: ["admin-orders"], queryFn: () => api("/admin/orders") });

  const cards = [
    { label: "Customers", value: o?.total_customers ?? 0, color: "#FF758C" },
    { label: "Shop Owners", value: o?.total_owners ?? 0, color: "#7B3245" },
    { label: "Shops", value: o?.total_shops ?? 0, color: "#4C7355" },
    { label: "Products", value: o?.total_products ?? 0, color: "#B87B41" },
    { label: "Orders", value: o?.total_orders ?? 0, color: "#607487" },
    { label: "Pending", value: o?.pending_orders ?? 0, color: "#B87B41" },
    { label: "Completed", value: o?.completed_orders ?? 0, color: "#4C7355" },
    { label: "Revenue", value: `₱${(o?.revenue ?? 0).toLocaleString()}`, color: "#FF758C" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <LinearGradient colors={["#2B1E22", "#4A353B"]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.badge}><Text style={styles.badgeText}>ADMIN</Text></View>
        <Text style={styles.title}>System Overview</Text>
        <Text style={styles.sub}>Welcome, {user?.name}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100, gap: spacing.md }}>
        <View style={styles.grid}>
          {cards.map((c) => (
            <View key={c.label} style={styles.card}>
              <View style={[styles.cardBar, { backgroundColor: c.color }]} />
              <Text style={styles.cardLabel}>{c.label}</Text>
              <Text style={styles.cardValue}>{c.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Product Breakdown</Text>
        <View style={styles.breakdown}>
          <View style={styles.brRow}><Text style={styles.brLabel}>🌸 Flowers</Text><Text style={styles.brVal}>{o?.total_flowers ?? 0}</Text></View>
          <View style={styles.brRow}><Text style={styles.brLabel}>💐 Bouquets</Text><Text style={styles.brVal}>{o?.total_bouquets ?? 0}</Text></View>
          <View style={styles.brRow}><Text style={styles.brLabel}>🎀 Wrappings</Text><Text style={styles.brVal}>{o?.total_wrappings ?? 0}</Text></View>
        </View>

        <Text style={styles.section}>Recent Orders</Text>
        <View style={{ gap: spacing.sm }}>
          {orders.slice(0, 5).map((ord: any) => (
            <View key={ord.id} style={styles.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderNo}>{ord.order_no}</Text>
                <Text style={styles.orderMeta}>{ord.customer_name} · {ord.status}</Text>
              </View>
              <Text style={styles.orderPrice}>₱{ord.total.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <Pressable testID="logout-btn" onPress={async () => { await logout(); router.replace("/"); }} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, gap: 6, overflow: "hidden" },
  badge: { alignSelf: "flex-start", backgroundColor: "rgba(255,117,140,0.2)", borderColor: "#FF758C", borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: "#FF758C", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  title: { color: "#FFFFFF", fontSize: 26, fontWeight: "300", fontStyle: "italic" },
  sub: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: { width: (width - spacing.lg * 2 - spacing.md) / 2, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, overflow: "hidden" },
  cardBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  cardLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  cardValue: { color: colors.onSurface, fontSize: 24, fontWeight: "700", marginTop: 4 },
  section: { fontSize: 15, fontWeight: "700", color: colors.onSurface, marginTop: spacing.sm },
  breakdown: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, gap: 6 },
  brRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  brLabel: { color: colors.onSurface, fontSize: 14 },
  brVal: { color: colors.brandPrimary, fontWeight: "700", fontSize: 15 },
  orderRow: { flexDirection: "row", padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, alignItems: "center" },
  orderNo: { fontWeight: "700", color: colors.onSurface, fontSize: 14 },
  orderMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  orderPrice: { color: colors.brandPrimary, fontWeight: "700", fontSize: 14 },
  logoutBtn: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.error, alignItems: "center" },
  logoutText: { color: colors.error, fontWeight: "700" },
});
