import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { useCart } from "@/src/cart";

const { width } = Dimensions.get("window");
const CARD_W = width * 0.72;

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { items } = useCart();

  const { data: bouquets = [] } = useQuery({ queryKey: ["p", "bouquet"], queryFn: () => api("/products?product_type=bouquet") });
  const { data: flowers = [] } = useQuery({ queryKey: ["p", "flower"], queryFn: () => api("/products?product_type=flower") });
  const { data: shops = [] } = useQuery({ queryKey: ["shops"], queryFn: () => api("/shops") });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
          <Image source={{ uri: "https://images.unsplash.com/photo-1523693916903-027d144a2b7d?w=1200" }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <LinearGradient colors={["rgba(255,117,140,0.15)", "rgba(43,30,34,0.85)"]} style={StyleSheet.absoluteFillObject} />
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroHi}>Hello, {user?.name?.split(" ")[0] || "Friend"} 🌷</Text>
              <Text style={styles.heroLoc}>📍 Biñan, Laguna</Text>
            </View>
            <Pressable testID="cart-icon" onPress={() => router.push("/(customer)/cart")} style={styles.cartBtn}>
              <Text style={{ fontSize: 20 }}>🛒</Text>
              {items.length > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{items.length}</Text></View>}
            </Pressable>
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>Bloom-to-door,{"\n"}crafted just for you.</Text>
            <Pressable testID="hero-shop-btn" onPress={() => router.push("/(customer)/marketplace")} style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Shop Marketplace →</Text>
            </Pressable>
          </View>
        </View>

        {/* Curated bouquets */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Curated Bouquets</Text>
            <Pressable onPress={() => router.push("/(customer)/marketplace")}><Text style={styles.link}>See all</Text></Pressable>
          </View>
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={bouquets} keyExtractor={(i: any) => i.id}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
            renderItem={({ item }) => (
              <Pressable testID={`bouquet-${item.id}`} onPress={() => router.push(`/(customer)/product/${item.id}` as any)} style={styles.bqCard}>
                <Image source={{ uri: item.image }} style={styles.bqImg} contentFit="cover" />
                <LinearGradient colors={["transparent", "rgba(43,30,34,0.85)"]} style={styles.bqScrim} />
                <View style={styles.bqInfo}>
                  <Text style={styles.bqName}>{item.name}</Text>
                  <Text style={styles.bqPrice}>₱{item.price.toLocaleString()}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* Design your own */}
        <Pressable testID="design-cta" onPress={() => router.push("/(customer)/studio")} style={styles.studioCard}>
          <LinearGradient colors={["#FF758C", "#FF7EB3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.studioBg}>
            <View style={{ flex: 1 }}>
              <Text style={styles.studioTag}>NEW</Text>
              <Text style={styles.studioTitle}>3D Bouquet Studio</Text>
              <Text style={styles.studioDesc}>Design your dream bouquet in immersive 3D</Text>
            </View>
            <Text style={{ fontSize: 44 }}>🌷</Text>
          </LinearGradient>
        </Pressable>

        {/* Local shops */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local Flower Shops</Text>
          {shops.map((s: any) => (
            <Pressable key={s.id} style={styles.shopRow}>
              <Image source={{ uri: s.image }} style={styles.shopImg} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>{s.shop_name}</Text>
                <Text style={styles.shopDesc}>{s.description}</Text>
                <Text style={styles.shopMeta}>📍 {s.location} · {s.product_count} items</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Fresh flowers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fresh Flowers</Text>
          <View style={{ paddingHorizontal: spacing.lg, flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            {flowers.slice(0, 6).map((f: any) => (
              <Pressable key={f.id} testID={`flower-${f.id}`} onPress={() => router.push(`/(customer)/product/${f.id}` as any)} style={styles.fCard}>
                <Image source={{ uri: f.image }} style={styles.fImg} contentFit="cover" />
                <Text style={styles.fName} numberOfLines={1}>{f.name}</Text>
                <Text style={styles.fPrice}>₱{f.price}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 320, overflow: "hidden", paddingHorizontal: spacing.lg },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroHi: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  heroLoc: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  cartBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  cartBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#FF758C", minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  cartBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  heroBody: { marginTop: "auto", paddingBottom: spacing.lg, gap: spacing.md },
  heroTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: "300", fontStyle: "italic", lineHeight: 40 },
  heroCta: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)" },
  heroCtaText: { color: "#FFFFFF", fontWeight: "600" },
  section: { marginTop: spacing.xl, gap: spacing.md },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg },
  sectionTitle: { fontSize: 22, fontWeight: "300", fontStyle: "italic", color: colors.onSurface, paddingHorizontal: spacing.lg },
  link: { color: colors.brandPrimary, fontWeight: "600", fontSize: 13 },
  bqCard: { width: CARD_W, height: 260, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surfaceSecondary },
  bqImg: { width: "100%", height: "100%" },
  bqScrim: { position: "absolute", left: 0, right: 0, bottom: 0, top: "50%" },
  bqInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing.md },
  bqName: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  bqPrice: { color: "#FFFFFF", fontSize: 15, marginTop: 2, opacity: 0.9 },
  studioCard: { marginHorizontal: spacing.lg, marginTop: spacing.xl, borderRadius: radius.lg, overflow: "hidden" },
  studioBg: { padding: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.md },
  studioTag: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  studioTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "700", marginTop: 2 },
  studioDesc: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 4 },
  shopRow: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, alignItems: "center" },
  shopImg: { width: 64, height: 64, borderRadius: radius.md },
  shopName: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  shopDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  shopMeta: { color: colors.onSurfaceSecondary, fontSize: 11, marginTop: 4 },
  fCard: { width: (width - spacing.lg * 2 - spacing.md * 2) / 3, gap: 4 },
  fImg: { width: "100%", aspectRatio: 1, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary },
  fName: { color: colors.onSurface, fontSize: 12, fontWeight: "600", marginTop: 4 },
  fPrice: { color: colors.brandPrimary, fontSize: 13, fontWeight: "700" },
});
