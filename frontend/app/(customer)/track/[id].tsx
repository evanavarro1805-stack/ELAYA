import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";

const STAGES = [
  { key: "pending", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready_for_delivery", label: "Ready" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "completed", label: "Delivered" },
];

function mapHtml(rLat: number, rLng: number, dLat: number, dLng: number) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#m{height:100%;margin:0;padding:0;background:#FFF5F7;}</style></head><body>
<div id="m"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
var map=L.map('m',{zoomControl:false,attributionControl:false}).setView([${rLat},${rLng}],14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
var rIcon=L.divIcon({html:'<div style="font-size:26px;">🛵</div>',className:'',iconSize:[30,30]});
var dIcon=L.divIcon({html:'<div style="font-size:26px;">📍</div>',className:'',iconSize:[30,30]});
L.marker([${rLat},${rLng}],{icon:rIcon}).addTo(map);
L.marker([${dLat},${dLng}],{icon:dIcon}).addTo(map);
L.polyline([[${rLat},${rLng}],[${dLat},${dLng}]],{color:'#FF758C',weight:4,dashArray:'8,8'}).addTo(map);
map.fitBounds([[${rLat},${rLng}],[${dLat},${dLng}]],{padding:[40,40]});
</script></body></html>`;
}

export default function Track() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: o, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => api(`/orders/${id}`), enabled: !!id, refetchInterval: 6000 });

  if (isLoading || !o) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.brandPrimary} /></View>;

  const stageIdx = STAGES.findIndex((s) => s.key === o.status);
  const html = mapHtml(o.rider_lat, o.rider_lng, o.delivery_lat, o.delivery_lng);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.mapContainer}>
        {Platform.OS === "web" ? (
          <iframe title="map" srcDoc={html} style={{ width: "100%", height: "100%", border: 0 }} />
        ) : (
          <WebView originWhitelist={["*"]} source={{ html }} style={{ flex: 1 }} />
        )}
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable testID="back-btn" onPress={() => router.back()} style={styles.circle}><Text>←</Text></Pressable>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{STAGES[stageIdx]?.label || o.status}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        <View style={styles.handle} />
        <Text style={styles.title}>Order {o.order_no}</Text>
        <Text style={styles.sub}>ETA · 25-40 min</Text>

        <View style={styles.stepper}>
          {STAGES.map((s, i) => (
            <View key={s.key} style={styles.step}>
              <View style={[styles.dot, i <= stageIdx && { backgroundColor: colors.brandPrimary }]}>
                {i <= stageIdx && <Text style={{ color: colors.onBrandPrimary, fontSize: 10, fontWeight: "700" }}>✓</Text>}
              </View>
              <Text style={[styles.stepLabel, i === stageIdx && { color: colors.brandPrimary, fontWeight: "700" }]}>{s.label}</Text>
              {i < STAGES.length - 1 && <View style={[styles.line, i < stageIdx && { backgroundColor: colors.brandPrimary }]} />}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.info}>📍 {o.delivery_address}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({o.items.length})</Text>
          {o.items.map((it: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{it.name} × {it.quantity}</Text>
              <Text style={styles.itemPrice}>₱{(it.unit_price * it.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.sm, marginTop: spacing.sm }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>₱{o.total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: { height: "45%", backgroundColor: colors.brandTertiary },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.brandPrimary, borderRadius: radius.pill },
  statusText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: 12 },
  sheet: { flex: 1, backgroundColor: colors.surface, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: "700", color: colors.onSurface },
  sub: { color: colors.muted, marginTop: 2 },
  stepper: { marginTop: spacing.lg, marginBottom: spacing.lg },
  step: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 6, position: "relative" },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  stepLabel: { color: colors.onSurfaceSecondary, fontSize: 14 },
  line: { position: "absolute", left: 10, top: 28, width: 2, height: 12, backgroundColor: colors.border },
  section: { marginTop: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider },
  sectionTitle: { fontWeight: "700", color: colors.onSurface, marginBottom: spacing.sm },
  info: { color: colors.onSurface, fontSize: 14 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  itemName: { flex: 1, color: colors.onSurface, fontSize: 13 },
  itemPrice: { color: colors.onSurface, fontWeight: "600", fontSize: 13 },
  totalLabel: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  totalPrice: { fontSize: 18, fontWeight: "700", color: colors.brandPrimary },
});
