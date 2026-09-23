import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";
import { useCart } from "@/src/cart";

const { width } = Dimensions.get("window");

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { add } = useCart();
  const qc = useQueryClient();
  const { data: p, isLoading } = useQuery({ queryKey: ["product", id], queryFn: () => api(`/products/${id}`), enabled: !!id });
  const [qty, setQty] = useState(1);
  const [colorIdx, setColorIdx] = useState(0);
  const [fav, setFav] = useState(false);

  const favMut = useMutation({
    mutationFn: () => fav ? api(`/favorites/${id}`, { method: "DELETE" }) : api(`/favorites/${id}`, { method: "POST" }),
    onSuccess: () => { setFav(!fav); qc.invalidateQueries({ queryKey: ["favs"] }); },
  });

  if (isLoading || !p) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}><ActivityIndicator color={colors.brandPrimary} /></View>;

  const addToCart = () => {
    add({ product_id: p.id, product_type: p.product_type, shop_id: p.shop_id, name: p.name, image: p.image, unit_price: p.price, quantity: qty });
    router.push("/(customer)/cart");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.imgWrap}>
          <Image source={{ uri: p.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable testID="back-btn" onPress={() => router.back()} style={styles.circleBtn}><Text style={{ fontSize: 18 }}>←</Text></Pressable>
            <Pressable testID="fav-btn" onPress={() => favMut.mutate()} style={styles.circleBtn}><Text style={{ fontSize: 18 }}>{fav ? "❤️" : "🤍"}</Text></Pressable>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.type}>{p.product_type.toUpperCase()}{p.category ? ` · ${p.category}` : ""}</Text>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.price}>₱{p.price.toLocaleString()}</Text>
          <Text style={styles.desc}>{p.description || "Handcrafted with love in Biñan, Laguna."}</Text>

          {p.colors && p.colors.length > 0 && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.label}>Colors</Text>
              <View style={styles.dotRow}>
                {p.colors.map((c: string, i: number) => (
                  <Pressable key={i} onPress={() => setColorIdx(i)} style={[styles.dot, { backgroundColor: c, borderWidth: 2, borderColor: colorIdx === i ? colors.brandPrimary : colors.border }]} />
                ))}
              </View>
            </View>
          )}

          {p.flowers_included && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.label}>Flowers Included</Text>
              <Text style={styles.info}>{p.flowers_included.join(", ")} · {p.number_of_flowers || "—"} stems</Text>
            </View>
          )}
          {p.wrapping && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={styles.label}>Wrapping</Text>
              <Text style={styles.info}>{p.wrapping} · {p.ribbon} ribbon</Text>
            </View>
          )}

          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.label}>Quantity</Text>
            <View style={styles.qtyRow}>
              <Pressable testID="qty-minus" onPress={() => setQty(Math.max(1, qty - 1))} style={styles.qtyBtn}><Text style={styles.qtyBtnT}>−</Text></Pressable>
              <Text style={styles.qty}>{qty}</Text>
              <Pressable testID="qty-plus" onPress={() => setQty(qty + 1)} style={styles.qtyBtn}><Text style={styles.qtyBtnT}>+</Text></Pressable>
              <Text style={{ marginLeft: spacing.md, color: colors.muted, fontSize: 12 }}>Stock: {p.stock}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable testID="add-cart-btn" onPress={addToCart} style={styles.cta}>
          <LinearGradient colors={["#FF7EB3", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBg}>
            <Text style={styles.ctaText}>Add to Cart · ₱{(p.price * qty).toLocaleString()}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imgWrap: { width: "100%", height: width * 0.9, backgroundColor: colors.surfaceSecondary },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.lg },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  body: { padding: spacing.lg, gap: 6 },
  type: { color: colors.brandPrimary, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  name: { fontSize: 26, fontWeight: "300", fontStyle: "italic", color: colors.onSurface, marginTop: 4 },
  price: { fontSize: 22, fontWeight: "700", color: colors.brandPrimary, marginTop: 4 },
  desc: { color: colors.muted, marginTop: spacing.sm, lineHeight: 20, fontSize: 14 },
  label: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "700", marginBottom: 6 },
  info: { color: colors.onSurface, fontSize: 14 },
  dotRow: { flexDirection: "row", gap: spacing.sm },
  dot: { width: 32, height: 32, borderRadius: 16 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  qtyBtnT: { fontSize: 18, color: colors.brandPrimary, fontWeight: "700" },
  qty: { fontSize: 16, fontWeight: "700", color: colors.onSurface, minWidth: 24, textAlign: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 64, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  cta: { borderRadius: radius.pill, overflow: "hidden" },
  ctaBg: { paddingVertical: 14, alignItems: "center" },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
