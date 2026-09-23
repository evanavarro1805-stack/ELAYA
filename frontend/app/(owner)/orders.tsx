import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";

const NEXT: Record<string, string | null> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready_for_delivery",
  ready_for_delivery: "out_for_delivery",
  out_for_delivery: "completed",
  completed: null,
};
const LABEL: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", preparing: "Preparing",
  ready_for_delivery: "Ready", out_for_delivery: "Out for Delivery", completed: "Completed", cancelled: "Cancelled",
};

export default function OwnerOrders() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({ queryKey: ["owner-orders"], queryFn: () => api("/owner/orders"), refetchInterval: 6000 });
  const advMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api(`/owner/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner-orders"] }),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Customer Orders</Text>
        <Text style={styles.sub}>{orders.length} total · {orders.filter((o: any) => o.status === "pending").length} pending</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}>
        {orders.length === 0 && <Text style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>No orders yet today 💐</Text>}
        {orders.map((o: any) => {
          const nxt = NEXT[o.status];
          return (
            <View key={o.id} style={styles.card}>
              <View style={styles.rowTop}>
                <View>
                  <Text style={styles.orderNo}>{o.order_no}</Text>
                  <Text style={styles.customer}>{o.customer_name}</Text>
                </View>
                <View style={styles.pill}><Text style={styles.pillText}>{LABEL[o.status] || o.status}</Text></View>
              </View>
              <Text style={styles.addr}>📍 {o.delivery_address}</Text>
              <View style={{ paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider, borderBottomWidth: 1, borderBottomColor: colors.divider, marginVertical: spacing.sm }}>
                {o.items.map((it: any, idx: number) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>{it.name} × {it.quantity}</Text>
                    <Text style={styles.itemPrice}>₱{(it.unit_price * it.quantity).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.rowBot}>
                <Text style={styles.total}>Total: ₱{o.total.toLocaleString()}</Text>
                {nxt && (
                  <Pressable testID={`adv-${o.id}`} onPress={() => advMut.mutate({ id: o.id, status: nxt })} style={styles.advBtn}>
                    <Text style={styles.advText}>Mark as {LABEL[nxt]} →</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  title: { fontSize: 24, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  card: { padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, gap: spacing.xs },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderNo: { fontWeight: "700", color: colors.onSurface, fontSize: 15 },
  customer: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.brandTertiary },
  pillText: { color: colors.onBrandTertiary, fontSize: 11, fontWeight: "700" },
  addr: { color: colors.onSurfaceSecondary, fontSize: 13, marginTop: spacing.xs },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  itemName: { flex: 1, color: colors.onSurface, fontSize: 13 },
  itemPrice: { color: colors.onSurface, fontWeight: "600", fontSize: 13 },
  rowBot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  total: { fontSize: 15, fontWeight: "700", color: colors.brandPrimary },
  advBtn: { backgroundColor: colors.brandPrimary, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill },
  advText: { color: colors.onBrandPrimary, fontSize: 12, fontWeight: "700" },
});
