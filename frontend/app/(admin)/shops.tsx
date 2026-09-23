import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";

export default function AdminShops() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: shops = [] } = useQuery({ queryKey: ["shops"], queryFn: () => api("/shops") });
  const mut = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => api(`/admin/shops/${id}/status?new_status=${s}`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shops"] }),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Flower Shops</Text>
        <Text style={styles.sub}>{shops.length} registered · {shops.filter((s: any) => s.status === "active").length} active</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}>
        {shops.map((s: any) => (
          <View key={s.id} style={styles.card}>
            <Image source={{ uri: s.image }} style={styles.img} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.shopName}>{s.shop_name}</Text>
              <Text style={styles.shopDesc} numberOfLines={2}>{s.description}</Text>
              <Text style={styles.shopMeta}>📍 {s.location}</Text>
              <Text style={styles.shopMeta}>💐 {s.product_count} products · 📞 {s.contact || "—"}</Text>
              <View style={styles.rowBtm}>
                <View style={[styles.pill, { backgroundColor: s.status === "active" ? colors.success + "20" : colors.error + "20" }]}>
                  <Text style={[styles.pillText, { color: s.status === "active" ? colors.success : colors.error }]}>{s.status}</Text>
                </View>
                <Pressable
                  testID={`toggle-${s.id}`}
                  onPress={() => mut.mutate({ id: s.id, s: s.status === "active" ? "disabled" : "active" })}
                  style={[styles.actionBtn, { backgroundColor: s.status === "active" ? colors.error : colors.success }]}
                >
                  <Text style={styles.actionText}>{s.status === "active" ? "Deactivate" : "Activate"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  title: { fontSize: 24, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  card: { flexDirection: "row", padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, gap: spacing.md },
  img: { width: 80, height: 80, borderRadius: radius.md },
  shopName: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  shopDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  shopMeta: { color: colors.onSurfaceSecondary, fontSize: 11, marginTop: 4 },
  rowBtm: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  pillText: { fontSize: 10, fontWeight: "700" },
  actionBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  actionText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
});
