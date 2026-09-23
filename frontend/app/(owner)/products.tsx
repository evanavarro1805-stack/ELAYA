import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";

const CATS = ["all", "flower", "bouquet", "wrapping"] as const;

export default function MyProducts() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [cat, setCat] = useState<(typeof CATS)[number]>("all");
  const { data: products = [] } = useQuery({ queryKey: ["my-products"], queryFn: () => api("/owner/products") });
  const delMut = useMutation({ mutationFn: (id: string) => api(`/owner/products/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["my-products"] }) });

  const filtered = cat === "all" ? products : products.filter((p: any) => p.product_type === cat);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>My Products</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATS.map((c) => (
            <Pressable key={c} testID={`chip-${c}`} onPress={() => setCat(c)} style={[styles.chip, cat === c && styles.chipActive]}>
              <Text style={[styles.chipText, cat === c && { color: colors.onBrandPrimary }]}>{c === "all" ? "All" : c[0].toUpperCase() + c.slice(1) + "s"}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(i: any) => i.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 200 }}
        ListEmptyComponent={<Text style={{ textAlign: "center", color: colors.muted, marginTop: 40 }}>No products yet — add your first!</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.img} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.type}>{item.product_type.toUpperCase()}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>₱{item.price.toLocaleString()} · Stock: {item.stock}</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{item.availability ? "Available" : "Unavailable"}</Text>
              </View>
            </View>
            <Pressable testID={`delete-${item.id}`} onPress={() => delMut.mutate(item.id)} style={styles.trashBtn}><Text style={{ fontSize: 18 }}>🗑</Text></Pressable>
          </View>
        )}
      />
      <View style={[styles.fabRow, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable testID="add-flower-fab" onPress={() => router.push("/(owner)/add-flower")} style={styles.fabSmall}><Text style={styles.fabSmallText}>+ Flower</Text></Pressable>
        <Pressable testID="add-bouquet-fab" onPress={() => router.push("/(owner)/add-bouquet")} style={styles.fabPrimary}>
          <LinearGradient colors={["#FF7EB3", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fabBg}>
            <Text style={styles.fabText}>+ Bouquet</Text>
          </LinearGradient>
        </Pressable>
        <Pressable testID="add-wrap-fab" onPress={() => router.push("/(owner)/add-wrapping")} style={styles.fabSmall}><Text style={styles.fabSmallText}>+ Wrap</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  title: { fontSize: 24, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  chipRow: { paddingVertical: spacing.md, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, height: 36, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, flexShrink: 0 },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: 13, color: colors.onSurfaceSecondary, fontWeight: "600" },
  card: { flexDirection: "row", padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, gap: spacing.md, alignItems: "center" },
  img: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  type: { color: colors.brandPrimary, fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  name: { fontSize: 15, fontWeight: "600", color: colors.onSurface, marginTop: 2 },
  price: { fontSize: 13, color: colors.onSurfaceSecondary, marginTop: 2 },
  pill: { alignSelf: "flex-start", backgroundColor: colors.success + "20", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, marginTop: 6 },
  pillText: { color: colors.success, fontSize: 10, fontWeight: "700" },
  trashBtn: { padding: spacing.sm },
  fabRow: { position: "absolute", left: 0, right: 0, bottom: 64, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, flexDirection: "row", gap: spacing.sm },
  fabSmall: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: radius.pill, backgroundColor: colors.brandTertiary },
  fabSmallText: { color: colors.onBrandTertiary, fontWeight: "700", fontSize: 13 },
  fabPrimary: { flex: 1.4, borderRadius: radius.pill, overflow: "hidden" },
  fabBg: { paddingVertical: 12, alignItems: "center" },
  fabText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
});
