import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";

const { width } = Dimensions.get("window");
const CARD = (width - spacing.lg * 2 - spacing.md) / 2;
const CATS = ["flower", "bouquet", "wrapping"] as const;

export default function AdminProducts() {
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState<(typeof CATS)[number]>("flower");
  const { data: prods = [] } = useQuery({ queryKey: ["all-products", cat], queryFn: () => api(`/products?product_type=${cat}`) });
  const { data: shops = [] } = useQuery({ queryKey: ["shops"], queryFn: () => api("/shops") });
  const shopById: Record<string, any> = Object.fromEntries(shops.map((s: any) => [s.id, s]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>All Products</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATS.map((c) => (
            <Pressable key={c} testID={`chip-${c}`} onPress={() => setCat(c)} style={[styles.chip, cat === c && styles.chipActive]}>
              <Text style={[styles.chipText, cat === c && { color: colors.onBrandPrimary }]}>{c[0].toUpperCase() + c.slice(1) + "s"}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={prods}
        keyExtractor={(i: any) => i.id}
        numColumns={2}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: spacing.md }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.img} contentFit="cover" />
            <View style={{ padding: spacing.sm }}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.shop} numberOfLines={1}>{shopById[item.shop_id]?.shop_name || "—"}</Text>
              <Text style={styles.price}>₱{item.price.toLocaleString()}</Text>
              <Text style={styles.stock}>Stock: {item.stock}</Text>
            </View>
          </View>
        )}
      />
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
  card: { width: CARD, backgroundColor: colors.surface, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  img: { width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceSecondary },
  name: { fontSize: 13, fontWeight: "700", color: colors.onSurface },
  shop: { fontSize: 11, color: colors.brandPrimary, marginTop: 2 },
  price: { fontSize: 14, fontWeight: "700", color: colors.onSurface, marginTop: 4 },
  stock: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
