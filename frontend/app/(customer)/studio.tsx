import { useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import * as THREE from "three";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius } from "@/src/theme";
import { useCart } from "@/src/cart";

const { width } = Dimensions.get("window");

const FLOWERS = [
  { id: "rose", name: "Red Rose", color: "#E11D48", price: 50 },
  { id: "tulip", name: "Pink Tulip", color: "#FF758C", price: 75 },
  { id: "sunflower", name: "Sunflower", color: "#F59E0B", price: 55 },
  { id: "lily", name: "White Lily", color: "#FFFAF5", price: 65 },
  { id: "orchid", name: "Purple Orchid", color: "#A855F7", price: 120 },
  { id: "baby", name: "Baby's Breath", color: "#FDE8EE", price: 30 },
];
const WRAPS = [
  { id: "kraft", name: "Kraft", color: "#B8845C", price: 40 },
  { id: "white", name: "White", color: "#F5F5F5", price: 45 },
  { id: "pink", name: "Pink", color: "#FF7EB3", price: 50 },
  { id: "cream", name: "Cream", color: "#F5E6D3", price: 45 },
];
const RIBBONS = [
  { id: "red", name: "Red", color: "#DC2626" },
  { id: "pink", name: "Pink", color: "#FF758C" },
  { id: "gold", name: "Gold", color: "#D4AF37" },
  { id: "white", name: "White", color: "#FFFFFF" },
];

export default function Studio() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { add } = useCart();
  const [flower, setFlower] = useState(FLOWERS[0]);
  const [wrap, setWrap] = useState(WRAPS[2]);
  const [ribbon, setRibbon] = useState(RIBBONS[1]);
  const [count, setCount] = useState(12);
  const [tab, setTab] = useState<"flower" | "wrap" | "ribbon">("flower");
  const rot = useRef(0);
  const glRef = useRef<any>(null);
  const meshesRef = useRef<{ petals: THREE.Group; wrap: THREE.Mesh; ribbon: THREE.Mesh } | null>(null);

  const price = flower.price * count + wrap.price + 20;

  const rebuildBouquet = (scene: THREE.Scene) => {
    if (meshesRef.current) {
      scene.remove(meshesRef.current.petals);
      scene.remove(meshesRef.current.wrap);
      scene.remove(meshesRef.current.ribbon);
    }
    // Wrapping cone
    const wrapGeo = new THREE.ConeGeometry(1.2, 2.2, 32, 1, true);
    const wrapMat = new THREE.MeshStandardMaterial({ color: wrap.color, side: THREE.DoubleSide, roughness: 0.9 });
    const wrapMesh = new THREE.Mesh(wrapGeo, wrapMat);
    wrapMesh.position.y = -0.8;
    scene.add(wrapMesh);

    // Ribbon torus
    const ribGeo = new THREE.TorusGeometry(0.9, 0.12, 12, 40);
    const ribMat = new THREE.MeshStandardMaterial({ color: ribbon.color, roughness: 0.4, metalness: 0.1 });
    const ribMesh = new THREE.Mesh(ribGeo, ribMat);
    ribMesh.position.y = -1.4;
    ribMesh.rotation.x = Math.PI / 2;
    scene.add(ribMesh);

    // Flowers
    const petals = new THREE.Group();
    const flowerCount = Math.min(count, 24);
    for (let i = 0; i < flowerCount; i++) {
      const g = new THREE.SphereGeometry(0.28, 12, 10);
      const m = new THREE.MeshStandardMaterial({ color: flower.color, roughness: 0.6 });
      const s = new THREE.Mesh(g, m);
      const angle = (i / flowerCount) * Math.PI * 2;
      const ring = i < 8 ? 0 : i < 16 ? 0.55 : 0.85;
      const y = 0.6 + (i % 3) * 0.15;
      s.position.set(Math.cos(angle) * ring, y, Math.sin(angle) * ring);
      petals.add(s);
    }
    scene.add(petals);
    meshesRef.current = { petals, wrap: wrapMesh, ribbon: ribMesh };
  };

  const onContextCreate = async (gl: any) => {
    glRef.current = gl;
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0xffdde6, 1);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);
    camera.position.set(0, 0.6, 4.5);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(3, 5, 3);
    scene.add(dir);
    (glRef.current as any).scene = scene;
    rebuildBouquet(scene);
    const animate = () => {
      requestAnimationFrame(animate);
      rot.current += 0.006;
      if (meshesRef.current) meshesRef.current.petals.rotation.y = rot.current;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  const addToCart = () => {
    add({
      product_id: `custom-${Date.now()}`,
      product_type: "custom_bouquet",
      shop_id: "custom",
      name: `Custom ${flower.name} Bouquet`,
      image: "https://images.unsplash.com/photo-1561848355-890d054dc55a?w=800",
      unit_price: price,
      quantity: 1,
      customization: { flower: flower.name, wrap: wrap.name, ribbon: ribbon.name, count },
    });
    router.push("/(customer)/cart");
  };

  // Rebuild scene when selection changes
  const scheduleRebuild = () => {
    if (glRef.current?.scene) rebuildBouquet(glRef.current.scene);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>3D Bouquet Studio</Text>
        <Text style={styles.sub}>Design in real-time</Text>
      </View>
      <View style={styles.canvasWrap}>
        <LinearGradient colors={["#FFDDE6", "#FFF5F7"]} style={StyleSheet.absoluteFillObject} />
        <GLView testID="gl-canvas" style={{ flex: 1 }} onContextCreate={onContextCreate} />
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}>
        <View style={styles.sheetHandle} />
        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryTitle}>{flower.name} × {count}</Text>
            <Text style={styles.summarySub}>{wrap.name} wrap · {ribbon.name} ribbon</Text>
          </View>
          <Text style={styles.summaryPrice}>₱{price.toLocaleString()}</Text>
        </View>

        <View style={styles.tabRow}>
          {(["flower", "wrap", "ribbon"] as const).map((t) => (
            <Pressable key={t} testID={`tab-${t}`} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t && { color: colors.brandPrimary }]}>{t[0].toUpperCase() + t.slice(1)}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
          {tab === "flower" && FLOWERS.map((f) => (
            <Pressable key={f.id} testID={`opt-flower-${f.id}`} onPress={() => { setFlower(f); scheduleRebuild(); }} style={[styles.opt, flower.id === f.id && styles.optActive]}>
              <View style={[styles.optDot, { backgroundColor: f.color }]} />
              <Text style={styles.optName}>{f.name}</Text>
            </Pressable>
          ))}
          {tab === "wrap" && WRAPS.map((w) => (
            <Pressable key={w.id} testID={`opt-wrap-${w.id}`} onPress={() => { setWrap(w); scheduleRebuild(); }} style={[styles.opt, wrap.id === w.id && styles.optActive]}>
              <View style={[styles.optDot, { backgroundColor: w.color, borderWidth: 1, borderColor: colors.border }]} />
              <Text style={styles.optName}>{w.name}</Text>
            </Pressable>
          ))}
          {tab === "ribbon" && RIBBONS.map((r) => (
            <Pressable key={r.id} testID={`opt-ribbon-${r.id}`} onPress={() => { setRibbon(r); scheduleRebuild(); }} style={[styles.opt, ribbon.id === r.id && styles.optActive]}>
              <View style={[styles.optDot, { backgroundColor: r.color, borderWidth: 1, borderColor: colors.border }]} />
              <Text style={styles.optName}>{r.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Flowers</Text>
          <View style={styles.qtyCtrl}>
            <Pressable testID="qty-minus" onPress={() => { setCount(Math.max(3, count - 1)); scheduleRebuild(); }} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>−</Text></Pressable>
            <Text style={styles.qty}>{count}</Text>
            <Pressable testID="qty-plus" onPress={() => { setCount(Math.min(24, count + 1)); scheduleRebuild(); }} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable testID="add-cart-btn" onPress={addToCart} style={styles.addBtn}>
          <LinearGradient colors={["#FF7EB3", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtnBg}>
            <Text style={styles.addBtnText}>Add to Cart · ₱{price.toLocaleString()}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  sub: { color: colors.muted, fontSize: 12 },
  canvasWrap: { height: width * 0.85, marginHorizontal: spacing.lg, borderRadius: radius.lg, overflow: "hidden" },
  sheet: { flex: 1, marginTop: spacing.md, paddingHorizontal: spacing.lg },
  sheetHandle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  summary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md, marginBottom: spacing.md },
  summaryTitle: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  summarySub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  summaryPrice: { fontSize: 22, fontWeight: "700", color: colors.brandPrimary },
  tabRow: { flexDirection: "row", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  tab: { paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: colors.brandPrimary },
  tabText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  pickerRow: { paddingVertical: spacing.md, gap: spacing.sm },
  opt: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surfaceSecondary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, flexShrink: 0 },
  optActive: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  optDot: { width: 18, height: 18, borderRadius: 9 },
  optName: { fontSize: 13, color: colors.onSurface, fontWeight: "600" },
  qtyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.md },
  qtyLabel: { fontSize: 15, fontWeight: "600", color: colors.onSurface },
  qtyCtrl: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surfaceSecondary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  qtyBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  qtyBtnText: { fontSize: 20, color: colors.brandPrimary, fontWeight: "700" },
  qty: { fontSize: 16, fontWeight: "700", color: colors.onSurface, minWidth: 24, textAlign: "center" },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 64, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  addBtn: { borderRadius: radius.pill, overflow: "hidden" },
  addBtnBg: { paddingVertical: 14, alignItems: "center" },
  addBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
