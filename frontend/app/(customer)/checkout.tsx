import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius } from "@/src/theme";
import { useCart } from "@/src/cart";
import { api } from "@/src/api";

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, total, clear } = useCart();
  const [addr, setAddr] = useState("San Antonio, Biñan, Laguna");
  const [notes, setNotes] = useState("");
  const [pay, setPay] = useState<"cod" | "gcash">("cod");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const validItems = items.filter((i) => i.shop_id !== "custom");

  const placeOrder = async () => {
    if (validItems.length === 0) { setErr("Only marketplace items can be ordered right now. Please add items from the shop."); return; }
    if (!addr) { setErr("Please enter a delivery address"); return; }
    setLoading(true); setErr(null);
    try {
      const order = await api("/orders", {
        method: "POST",
        body: JSON.stringify({ items: validItems, delivery_address: addr, delivery_lat: 14.3419, delivery_lng: 121.0803, notes, payment_method: pay }),
      });
      clear();
      router.replace(`/(customer)/track/${order.id}` as any);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>←</Text></Pressable>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 200 }}>
        <View>
          <Text style={styles.section}>Delivery Address</Text>
          <TextInput testID="address-input" value={addr} onChangeText={setAddr} multiline style={styles.input} placeholderTextColor={colors.muted} />
        </View>
        <View>
          <Text style={styles.section}>Order Notes</Text>
          <TextInput testID="notes-input" value={notes} onChangeText={setNotes} placeholder="Any special requests?" multiline style={styles.input} placeholderTextColor={colors.muted} />
        </View>
        <View>
          <Text style={styles.section}>Payment Method</Text>
          <Pressable testID="pay-cod" onPress={() => setPay("cod")} style={[styles.payOpt, pay === "cod" && styles.payOptActive]}>
            <Text style={styles.payTitle}>💵 Cash on Delivery</Text>
            <Text style={styles.paySub}>Pay when your bouquet arrives</Text>
          </Pressable>
          <Pressable testID="pay-gcash" onPress={() => setPay("gcash")} style={[styles.payOpt, pay === "gcash" && styles.payOptActive]}>
            <Text style={styles.payTitle}>📱 GCash</Text>
            <Text style={styles.paySub}>Coming soon</Text>
          </Pressable>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.section}>Order Summary</Text>
          {validItems.map((i) => (
            <View key={i.product_id} style={styles.sumRow}>
              <Text style={styles.sumItem} numberOfLines={1}>{i.name} × {i.quantity}</Text>
              <Text style={styles.sumPrice}>₱{(i.unit_price * i.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View style={[styles.sumRow, { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.sm }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>₱{total.toLocaleString()}</Text>
          </View>
        </View>
        {err ? <Text testID="checkout-error" style={{ color: colors.error }}>{err}</Text> : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable testID="place-order-btn" onPress={placeOrder} disabled={loading} style={styles.cta}>
          <LinearGradient colors={["#FF7EB3", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBg}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.ctaText}>Place Order · ₱{total.toLocaleString()}</Text>}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  back: { fontSize: 22, color: colors.onSurface },
  title: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  section: { fontSize: 14, fontWeight: "700", color: colors.onSurface, marginBottom: spacing.sm },
  input: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, minHeight: 48, color: colors.onSurface, fontSize: 14 },
  payOpt: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, backgroundColor: colors.surfaceSecondary },
  payOptActive: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  payTitle: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  paySub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  summaryBox: { padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md },
  sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  sumItem: { flex: 1, color: colors.onSurface, fontSize: 13 },
  sumPrice: { color: colors.onSurface, fontWeight: "600", fontSize: 13 },
  totalLabel: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  totalPrice: { fontSize: 18, fontWeight: "700", color: colors.brandPrimary },
  footer: { position: "absolute", left: 0, right: 0, bottom: 64, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  cta: { borderRadius: radius.pill, overflow: "hidden" },
  ctaBg: { paddingVertical: 14, alignItems: "center" },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
