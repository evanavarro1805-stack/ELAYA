import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";

const { width } = Dimensions.get("window");
const CARD_W = (width - spacing.lg * 2 - spacing.md) / 2;
const CATS = ["all", "bouquet", "flower", "wrapping"] as const;

export default function Marketplace() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [cat, setCat] = useState<(typeof CATS)[number]>("all");
  const { data: prods = [], isLoading } = useQuery({
    queryKey: ["products", cat],
    queryFn: () => api(cat === "all" ? "/products" : `/products?product_type=${cat}`),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.sub}>Fresh from local shops in Biñan</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATS.map((c) => (
            <Pressable key={c} testID={`chip-${c}`} onPress={() => setCat(c)} style={[styles.chip, cat === c && styles.chipActive]}>
              <Text style={[styles.chipText, cat === c && { color: colors.onBrandPrimary }]}>{c === "all" ? "All" : c[0].toUpperCase() + c.slice(1) + "s"}</Text>
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
          <Pressable testID={`product-${item.id}`} onPress={() => router.push(`/(customer)/product/${item.id}` as any)} style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.img} contentFit="cover" />
            <View style={{ padding: spacing.sm, gap: 2 }}>
              <Text style={styles.type}>{item.product_type.toUpperCase()}</Text>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.price}>₱{item.price.toLocaleString()}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={{ textAlign: "center", color: colors.muted, marginTop: 40 }}>{isLoading ? "Loading fresh blooms..." : "No products yet"}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  title: { fontSize: 28, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  chipRow: { paddingVertical: spacing.md, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, height: 36, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, flexShrink: 0 },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: 13, color: colors.onSurfaceSecondary, fontWeight: "600" },
  card: { width: CARD_W, backgroundColor: colors.surface, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  img: { width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceSecondary },
  type: { color: colors.brandPrimary, fontSize: 9, fontWeight: "700", letterSpacing: 0.8 },
  name: { color: colors.onSurface, fontSize: 14, fontWeight: "600" },
  price: { color: colors.brandPrimary, fontSize: 15, fontWeight: "700", marginTop: 2 },
});
